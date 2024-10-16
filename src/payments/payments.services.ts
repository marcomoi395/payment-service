import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Payment } from '../gateways/gate.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PAYMENT_CREATED } from 'src/shards/events';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment-timezone';

@Injectable()
export class PaymentService implements OnApplicationBootstrap {
  private payments: Payment[] = [];
  private redis: Redis;
  constructor(
    private eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {
    this.redis = this.configService.get('redis');
  }

  async onApplicationBootstrap() {
    if (this.configService.get('DISABLE_SYNC_REDIS') == 'true') return;

    const payments = await this.redis.get('payments');
    if (payments) {
      this.payments = JSON.parse(payments).map((el) => ({
        ...el,
        date: new Date(el.date),
      }));
    }
  }

  async saveRedis() {
    await this.redis.set('payments', JSON.stringify(this.payments));
  }

  isExists(payment: Payment) {
    return this.payments.some(
      (el) => el.transaction_id == payment.transaction_id,
    );
  }

  /**
   * Vì một số bank không trả về thời gian, nên nếu thời gian trả về là 00:00:00 của ngày hiện tại thì sẽ thay thế bằng giờ hiện tại
   * @param date Date
   * @returns Date
   */
  replaceDateTodayAndNoTime = (date: Date): Date => {
    const dateMoment = moment.tz(date, 'Asia/Ho_Chi_Minh');
    const dateNow = moment().tz('Asia/Ho_Chi_Minh');
    const dateNoTime =
      dateMoment.get('hour') == 0 &&
      dateMoment.get('minute') == 0 &&
      dateMoment.get('second') == 0;

    if (dateMoment.isSame(dateNow, 'day') && dateNoTime) {
      return new Date();
    }
    return date;
  };
  addPayments(payments: Payment[]) {
    const newPayments = payments.filter((payment) => !this.isExists(payment));
    const replaceDateTimeNewPayments = newPayments.map((payment) => ({
      ...payment,
      date: this.replaceDateTodayAndNoTime(payment.date),
    }));

    if (replaceDateTimeNewPayments.length == 0) return;

    this.eventEmitter.emit(PAYMENT_CREATED, replaceDateTimeNewPayments);

    this.payments.push(...replaceDateTimeNewPayments);

    this.payments = this.payments
      .slice(-500)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    this.saveRedis();
  }

  getPayments(): Payment[] {
    return this.payments;
  }
}
