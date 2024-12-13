import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsModule } from './payments/payments.module';
import { Store } from './entities/store.entity';
import { Payment } from './entities/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'payments.db',
      entities: [Store, Payment],
      synchronize: true,
    }),
    PaymentsModule,
  ],
})
export class AppModule {}