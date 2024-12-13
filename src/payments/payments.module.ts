import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Store } from '../entities/store.entity';
import { Payment } from '../entities/payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Store, Payment])],
  providers: [PaymentsService],
  controllers: [PaymentsController],
})
export class PaymentsModule {}