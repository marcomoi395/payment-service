import { MBBankService } from './mbbank.services';
import { ACBBankService } from './acbbank.services';
import { TPBankService } from './tpbank.services';
import { GateConfig, GateType } from '../gate.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Gate } from '../gates.services';
import { CaptchaSolverService } from 'src/captcha-solver/captcha-solver.service';
import { ProxyService } from '../../proxy/proxy.service';
import { TronUsdtBlockchainService } from './tron-usdt-blockchain.services/tron-usdt-blockchain.services';
import { VCBBankService } from './vcb/vcbbank.services';

export class GateFactory {
  create(
    config: GateConfig,
    eventEmitter: EventEmitter2,
    captchaSolver: CaptchaSolverService,
    proxies: ProxyService,
  ): Gate {
    switch (config.type) {
      case GateType.TPBANK:
        const tpbank = new TPBankService(
          config,
          eventEmitter,
          captchaSolver,
          proxies,
        );
        return tpbank;
      case GateType.MBBANK:
        const mbbank = new MBBankService(
          config,
          eventEmitter,
          captchaSolver,
          proxies,
        );
        return mbbank;
      case GateType.ACBBANK:
        const acbbank = new ACBBankService(
          config,
          eventEmitter,
          captchaSolver,
          proxies,
        );
        return acbbank;
      case GateType.VCBBANK:
        const vcbbank = new VCBBankService(
          config,
          eventEmitter,
          captchaSolver,
          proxies,
        );
        return vcbbank;
      case GateType.TRON_USDT_BLOCKCHAIN:
        const tronUsdtBlockchain = new TronUsdtBlockchainService(
          config,
          eventEmitter,
          captchaSolver,
          proxies,
        );
        return tronUsdtBlockchain;

      default:
        throw new Error('Gate not found');
    }
  }
}
