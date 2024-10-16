import {
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { PaymentConfigService } from 'src/payment-config/payment-config.services';
import { GateFactory } from './gateway-factory/gate.factory';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Gate } from 'src/gateways/gates.services';
import { GateConfig, GateType } from './gate.interface';
import * as Joi from 'joi';
import { CaptchaSolverService } from 'src/captcha-solver/captcha-solver.service';
import { ProxyService } from '../proxy/proxy.service';

@Injectable()
export class GatesManagerService implements OnApplicationBootstrap {
  private gates: Gate[] = [];

  constructor(
    private readonly paymentConfigService: PaymentConfigService,
    private readonly gateFactory: GateFactory,
    private eventEmitter: EventEmitter2,
    private readonly captchaSolverService: CaptchaSolverService,
    private readonly proxyService: ProxyService,
  ) {}

  async onApplicationBootstrap() {
    const banksConfigInput =
      await this.paymentConfigService.getConfigPath<GateConfig>('gateways');

    const banksConfigValidated = this.validateBanksConfig(banksConfigInput);

    this.createGates(banksConfigValidated);
  }

  createGates(banksConfig: GateConfig[]) {
    this.gates = banksConfig.map((bankConfig) =>
      this.gateFactory.create(
        bankConfig,
        this.eventEmitter,
        this.captchaSolverService,
        this.proxyService,
      ),
    );
  }

  validateBanksConfig(banksConfig: GateConfig[]): GateConfig[] {
    const gateConfigSchema = Joi.object({
      name: Joi.string().required(),
      type: Joi.valid(...Object.values(GateType)).required(),
      repeat_interval_in_sec: Joi.number().min(1).max(120).required(),
      password: Joi.string().when('type', {
        is: [
          GateType.MBBANK,
          GateType.ACBBANK,
          GateType.TPBANK,
          GateType.VCBBANK,
        ],
        then: Joi.required(),
      }),
      login_id: Joi.string().when('type', {
        is: [
          GateType.MBBANK,
          GateType.ACBBANK,
          GateType.TPBANK,
          GateType.VCBBANK,
        ],
        then: Joi.required(),
      }),
      device_id: Joi.string().when('type', {
        is: [GateType.VCBBANK, GateType.TPBANK],
        then: Joi.required(),
      }),
      token: Joi.string(),
      account: Joi.string().required(),
      proxy: Joi.string(),
      get_transaction_day_limit: Joi.number().min(1).max(100).default(14),
      get_transaction_count_limit: Joi.number().min(1).max(100).default(100),
    });

    const banksConfigRes: GateConfig[] = [];
    for (const bankConfig of banksConfig) {
      const { error, value } = gateConfigSchema.validate(bankConfig);

      if (error) {
        throw new Error(
          `config.yml is invalid: ${error.message} on ${bankConfig.name}`,
        );
      }
      banksConfigRes.push(value);
    }
    return banksConfigRes;
  }

  stopCron(name: string, timeInSec: number) {
    const gate = this.gates.find((gate) => gate.getName() === name);
    if (!gate) throw new NotFoundException({ error: 'Gate not found' });

    gate.stopCron();
    setTimeout(() => {
      gate.startCron();
    }, timeInSec * 1000);
  }

  startCron(name: string, timeInSec: number) {
    const gate = this.gates.find((gate) => gate.getName() === name);
    if (!gate) throw new NotFoundException({ error: 'Gate not found' });

    gate.startCron();
    setTimeout(() => {
      gate.stopCron();
    }, timeInSec * 1000);
  }

  stopAllCron() {
    this.gates.forEach((gate) => gate.stopCron());
    // setTimeout(() => {
    //   this.startAllCron();
    // }, 5 * 60000);
  }
  startAllCron() {
    this.gates.forEach((gate) => gate.startCron());
    // setTimeout(() => {
    //   this.stopAllCron();
    // }, 5 * 60000);
  }
}
