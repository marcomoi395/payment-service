import { Module } from '@nestjs/common';
import { BotManagerService } from './bots-manager.service';
import { BotFactory } from './bot-factory/bot.factory';
import { BotController } from './bot.controller';

@Module({
  controllers: [BotController],
  providers: [BotManagerService, BotFactory],
})
export class BotModule {}
