import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Payment } from 'src/gateways/gate.interface';
import {
  GATEWAY_CRON_ERROR_STREAK,
  GATEWAY_CRON_RECOVERY,
  PAYMENT_CREATED,
} from 'src/shards/events';
import { BotManagerService } from './bots-manager.service';
import { GatewayErrorStreakEvent, GatewayRecoveryEvent } from 'src/shards/type';

@Controller('bot')
export class BotController {
  constructor(
    private readonly botSetupService: BotManagerService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent(PAYMENT_CREATED)
  handlePaymentCreatedEvent(payments: Payment[]) {
    this.botSetupService.onPaymentsCreated(payments);
  }

  @OnEvent(GATEWAY_CRON_ERROR_STREAK)
  handleGatewayErrorStreakEvent(data: GatewayErrorStreakEvent) {
    this.botSetupService.onGatewayErrorStreak(data);
  }

  @OnEvent(GATEWAY_CRON_RECOVERY)
  handleGatewayCronRecoveryEvent(data: GatewayRecoveryEvent) {
    this.botSetupService.onGatewayCronRecovery(data);
  }

  @Post(':token')
  async processUpdate(
    @Param('token') token: string,
    @Body() update: any,
    @Req() req: any,
  ) {
    const secretToken = req.headers['x-telegram-bot-api-secret-token'];
    this.eventEmitter.emit('tele:update', { update, token, secretToken });
    return { status: 'ok' };
  }
}
