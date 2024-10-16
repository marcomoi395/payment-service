import { Injectable } from '@nestjs/common';
import { Payment } from 'src/gateways/gate.interface';
import { Bot } from '../bot.service';
import * as TelegramBotSDK from 'node-telegram-bot-api';
import { BotConfig } from '../bot.interfaces';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment-timezone';
import { Format3Dot } from 'src/shards/helpers/format3Dot';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GATEWAY_START_CRON, GATEWAY_STOP_CRON } from 'src/shards/events';
import { nanoid } from 'nanoid';

@Injectable()
export class TelegramBot extends Bot {
  private readonly bot: TelegramBotSDK;

  constructor(
    protected botConfig: BotConfig,
    protected readonly configService: ConfigService,
    protected readonly eventEmitter: EventEmitter2,
  ) {
    super(botConfig, configService, eventEmitter);

    const SERVICE_DOMAIN = configService.get<string | undefined>(
      'SERVICE_DOMAIN',
    );
    const TELE_SECRET_TOKEN = nanoid(21);
    this.bot = new TelegramBotSDK(botConfig.token, {
      polling: SERVICE_DOMAIN ? false : true,
    });

    if (SERVICE_DOMAIN) {
      this.bot.setWebHook(`https://${SERVICE_DOMAIN}/bot/${botConfig.token}`, {
        secret_token: TELE_SECRET_TOKEN,
      });
      this.eventEmitter.on('tele:update', ({ update, token, secretToken }) => {
        if (secretToken !== TELE_SECRET_TOKEN || token !== botConfig.token)
          return;
        this.bot.processUpdate(update);
      });
    }
    this.bot.on('message', (msg) => {
      if (!msg.chat || !msg.from || !msg.text) return;

      const chatId = msg.chat.id;
      const userId = msg.from.id.toString();
      if (msg.text == '/chatid')
        this.bot.sendMessage(chatId, `Your chat id: ${chatId}`);
      if (msg.text == '/userid')
        this.bot.sendMessage(chatId, `Your user id: ${userId}`);
      if (
        msg.text.startsWith('/stopCron') &&
        this.botConfig.admin_ids?.includes(userId)
      ) {
        this.eventEmitter.emit(GATEWAY_STOP_CRON);
        this.bot.sendMessage(chatId, `Stop cron job in 5m`);
      }
      if (
        msg.text.startsWith('/startCron') &&
        this.botConfig.admin_ids?.includes(userId)
      ) {
        this.eventEmitter.emit(GATEWAY_START_CRON);
        this.bot.sendMessage(chatId, `Start cron`);
      }
    });
  }
  async sendPaymentNotificationMessage(payment: Payment) {
    let message = `🔊 +${Format3Dot(payment.creditAmount)} ${payment.content}`;
    message += `\r\n💰 Số tiền: ${Format3Dot(payment.creditAmount)}`;
    message += `\r\n📇 Nội dung: ${payment.content}`;
    message += `\r\n💳 Tài khoản: ${payment.accountNo} (${payment.gate})`;
    message += `\r\n📅 Thời gian: ${moment
      .tz(payment.date, 'Asia/Ho_Chi_Minh')
      .format('HH:mm DD/MM/YYYY')}`;
    message += `\r\n🗃 Transaction id: ${payment.transaction_id}`;
    message += `\r\n---`;

    await this.bot.sendMessage(this.botConfig.chat_chanel_id, message);
  }
  async sendMessage(message: string) {
    await this.bot.sendMessage(this.botConfig.chat_chanel_id, message);
  }
}
