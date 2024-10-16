import { Controller } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { OnEvent } from '@nestjs/event-emitter';
import { PAYMENT_CREATED } from 'src/shards/events';
import { Payment } from 'src/gateways/gate.interface';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @OnEvent(PAYMENT_CREATED)
  handlePaymentCreatedEvent(payments: Payment[]) {
    this.webhookService.sendPayments(payments);
  }
}
