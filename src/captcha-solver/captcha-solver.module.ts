import { Module } from '@nestjs/common';
import { CaptchaSolverService } from './captcha-solver.service';

@Module({
  providers: [CaptchaSolverService],
  exports: [CaptchaSolverService],
})
export class CaptchaSolverModule {}
