import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import * as Joi from 'joi';
import { axios } from 'src/shards/helpers/axios';

import { Payment } from '../gateways/gate.interface';
import { PaymentConfigService } from 'src/payment-config/payment-config.services';
import { CheckPaymentConditions } from 'src/shards/helpers/checkPaymentCondition';
import { Job, Queue, Worker } from 'bullmq';
import { ConfigService } from '@nestjs/config';
interface WebhookConfig {
  name: string;
  url: string;
  token: string;
  conditions: {
    content_regex: string;
    account_regex: string;
  };
}
type JobData = { webhook: WebhookConfig; payment: Payment };

@Injectable()
export class WebhookService implements OnApplicationBootstrap {
  private logger = new Logger(WebhookService.name);
  private webhooks: WebhookConfig[] = [];
  private readonly queue: Queue<JobData>;

  constructor(
    private readonly configService: ConfigService,
    private readonly paymentConfigService: PaymentConfigService,
  ) {
    this.queue = new Queue('webhook', {
      connection: this.configService.get('redis'),
      defaultJobOptions: {
        removeOnComplete: {
          age: 1000 * 60 * 60 * 24 * 3,
        },
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000 * 60 * 1,
        },
      },
    });
    this.createWorker();
  }
  async onApplicationBootstrap() {
    const webhookConfig =
      await this.paymentConfigService.getConfigPath<WebhookConfig>('webhooks');
    await this.validateWebhooksConfig(webhookConfig);
    this.webhooks = webhookConfig;
  }

  createWorker() {
    const worker = new Worker(
      'webhook',
      async (job: Job<JobData>) => {
        const { url, token } = job.data.webhook;
        const { payment } = job.data;

        const data = {
          token,
          payment,
        };
        await axios.post(url, data);
      },
      { connection: this.configService.get('redis'), concurrency: 5 },
    );
    worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} completed`);
    });
    worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job.id} failed with ${err.message}`);
    });
  }

  validateWebhooksConfig(webhooksConfig: WebhookConfig[]) {
    const webhookConfigSchema = Joi.object({
      name: Joi.string().required(),
      url: Joi.string().required(),
      token: Joi.string().required(),
      conditions: Joi.object({
        content_regex: Joi.string().required(),
        account_regex: Joi.string().required(),
      }),
    });
    for (const webhookConfig of webhooksConfig) {
      const { error } = webhookConfigSchema.validate(webhookConfig);
      if (error) throw error;
    }
  }

  sendPayments(payments: Payment[]) {
    this.webhooks.forEach((webhook) => {
      const matchedPayments = payments.filter((payment) =>
        CheckPaymentConditions(payment, webhook.conditions),
      );
      matchedPayments.forEach((payment) => {
        this.queue.add(
          'webhook',
          { webhook, payment },
          {
            jobId: `${payment.transaction_id}-${webhook.name}`,
          },
        );
      });
    });
  }
}
