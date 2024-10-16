import { Module } from '@nestjs/common';
import { GateFactory } from './gateway-factory/gate.factory';
import { GatesManagerService } from './gates-manager.services';
import { GatesController } from './gates.controller';
import { CaptchaSolverModule } from 'src/captcha-solver/captcha-solver.module';
import {ProxyModule} from "../proxy/proxy.module";

@Module({
  imports: [CaptchaSolverModule, ProxyModule],
  controllers: [GatesController],
  providers: [GatesManagerService, GateFactory],
  exports: [GateFactory],
})
export class GatesModule {}
