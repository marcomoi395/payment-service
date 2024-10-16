import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { BotConfig, BotType } from './bot.interfaces';
import { ConfigService } from '@nestjs/config';
import { PaymentConfigService } from 'src/payment-config/payment-config.services';
import * as Joi from 'joi';
import { BotFactory } from './bot-factory/bot.factory';
import { Bot } from './bot.service';
import { Payment } from 'src/gateways/gate.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GatewayErrorStreakEvent, GatewayRecoveryEvent } from 'src/shards/type';

@Injectable()
export class BotManagerService implements OnApplicationBootstrap {
  private logger = new Logger(BotManagerService.name);
  private bots: Bot[] = [];

  constructor(
    private readonly paymentConfigService: PaymentConfigService,
    protected readonly configService: ConfigService,
    private readonly botFactory: BotFactory,
    private readonly eventEmitter: EventEmitter2,
  ) {}
  async onApplicationBootstrap() {
    const botsConfig = await this.paymentConfigService.getConfigPath<BotConfig>(
      'bots',
    );
    await this.validateBotsConfig(botsConfig);

    this.createBots(botsConfig);
  }
  async validateBotsConfig(botsConfig: BotConfig[]) {
    const botConfigSchema = Joi.object({
      name: Joi.string().required(),
      type: Joi.valid(...Object.values(BotType)).required(),
      chat_chanel_id: Joi.string().required(),
      discord_group_id: Joi.string(),
      token: Joi.string().required(),
      conditions: {
        content_regex: Joi.string().required(),
        account_regex: Joi.string().required(),
      },
      admin_ids: Joi.array().items(Joi.string()),
    });

    for (const botConfig of botsConfig) {
      const { error } = botConfigSchema.validate(botConfig);
      if (error) {
        throw error;
      }
    }
  }

  createBots(botsConfig: BotConfig[]) {
    this.bots = botsConfig.map((botConfig) =>
      this.botFactory.create(botConfig, this.configService, this.eventEmitter),
    );
  }

  onPaymentsCreated(payments: Payment[]) {
    this.bots.forEach((bot) => bot.onPaymentsCreated(payments));
  }
  onGatewayErrorStreak(data: GatewayErrorStreakEvent) {
    this.bots.forEach((bot) => bot.onGatewayErrorStreak(data));
  }

  onGatewayCronRecovery(data: GatewayRecoveryEvent) {
    this.bots.forEach((bot) => bot.onGatewayCronRecovery(data));
  }
}
