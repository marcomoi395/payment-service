import { Injectable, Logger } from '@nestjs/common';
import { BotConfig } from './bot.interfaces';
import { ConfigService } from '@nestjs/config';
import { Job, Queue, Worker } from 'bullmq';
import { Payment } from 'src/gateways/gate.interface';
import { CheckPaymentConditions } from 'src/shards/helpers/checkPaymentCondition';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GatewayErrorStreakEvent, GatewayRecoveryEvent } from 'src/shards/type';

@Injectable()
export abstract class Bot {
  private logger = new Logger(Bot.name);

  private readonly queue: Queue<Payment>;

  constructor(
    protected readonly botConfig: BotConfig,
    protected readonly configService: ConfigService,
    protected readonly eventEmitter: EventEmitter2,
  ) {
    this.queue = new Queue(`bot-${this.botConfig.type}`, {
      connection: this.configService.get('redis'),
      defaultJobOptions: {
        removeOnComplete: 500,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000 * 60 * 1,
        },
      },
    });
    this.createWorker();
  }
  createWorker() {
    const worker = new Worker(
      `bot-${this.botConfig.type}`,
      async (job: Job<Payment>) => {
        await this.sendPaymentNotificationMessage(job.data);
      },
      { connection: this.configService.get('redis'), concurrency: 5 },
    );

    worker.on('completed', (job) => {
      this.logger.log(`Job bot ${job.id} completed`);
    });
    worker.on('failed', (job, err) => {
      this.logger.error(`Job bot ${job.id} failed with ${err.message}`);
    });
  }

  onPaymentsCreated(payments: Payment[]) {
    const matchedPayments = payments.filter((payment) =>
      CheckPaymentConditions(payment, this.botConfig.conditions),
    );
    matchedPayments.forEach((payment) => {
      this.queue.add('bot', payment, {
        jobId: `${payment.transaction_id}-${this.botConfig.name}`,
      });
    });
  }
  onGatewayErrorStreak(data: GatewayErrorStreakEvent) {
    console.log(`Gateway ${data.name} has error streak, error: ${data.error}`);
    this.sendMessage(
      `Gateway ${data.name} has error streak, error: ${data.error}`,
    );
  }

  onGatewayCronRecovery(data: GatewayRecoveryEvent) {
    console.log(`Gateway ${data.name} has recovered`);
    this.sendMessage(`Gateway ${data.name} has recovered`);
  }

  abstract sendPaymentNotificationMessage(payment: Payment): Promise<void>;
  abstract sendMessage(message: string): Promise<void>;
}
