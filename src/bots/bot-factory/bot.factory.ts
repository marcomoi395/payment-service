import { ConfigService } from '@nestjs/config';
import { BotConfig, BotType } from '../bot.interfaces';
import { Bot } from '../bot.service';
import { TelegramBot } from './telegram.service';
import { DiscordBot } from './discord.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export class BotFactory {
  create(
    botConfig: BotConfig,
    configService: ConfigService,
    eventEmitter: EventEmitter2,
  ): Bot {
    switch (botConfig.type) {
      case BotType.TELEGRAM:
        const telegram = new TelegramBot(
          botConfig,
          configService,
          eventEmitter,
        );
        return telegram;
      case BotType.DISCORD:
        const discord = new DiscordBot(botConfig, configService, eventEmitter);
        return discord;
      default:
        throw new Error('Bot not found');
    }
  }
}
