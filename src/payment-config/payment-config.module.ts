import { Global, Module } from '@nestjs/common';
import { PaymentConfigService } from './payment-config.services';

@Global()
@Module({
  providers: [PaymentConfigService],
  exports: [PaymentConfigService],
})
export class PaymentConfigModule {}
