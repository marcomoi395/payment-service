import { Controller, Get } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Payment } from 'src/gateways/gate.interface';
import { PAYMENT_HISTORY_UPDATED } from 'src/shards/events';
import { PaymentService } from './payments.services';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentService: PaymentService) {}

  @OnEvent(PAYMENT_HISTORY_UPDATED)
  handlePaymentHistoryUpdateEvent(payments: Payment[]) {
    this.paymentService.addPayments(payments);
  }

  @Get()
  getPayments() {
    return this.paymentService.getPayments();
  }
}
