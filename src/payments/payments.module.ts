import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentService } from './payments.services';
import { GatesModule } from 'src/gateways/gates.module';

@Module({
  imports: [GatesModule],
  controllers: [PaymentsController],
  providers: [PaymentService],
})
export class PaymentsModule {}
