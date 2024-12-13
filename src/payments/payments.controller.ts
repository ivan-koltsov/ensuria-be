import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('set-fees')
  setFees(@Body() fees: { A: number; B: number; D: number }) {
    this.paymentsService.setFees(fees.A, fees.B, fees.D);
  }

  @Post('store')
  addStore(@Body() data: { name: string; feeC: number }) {
    return this.paymentsService.addStore(data.name, data.feeC);
  }

  @Post('accept')
  acceptPayment(@Body() data: { storeId: number; amount: number }) {
    return this.paymentsService.acceptPayment(data.storeId, data.amount);
  }

  @Post('process')
  processPayments(@Body() data: { paymentIds: number[] }) {
    return this.paymentsService.processPayments(data.paymentIds);
  }

  @Post('complete')
  completePayments(@Body() data: { paymentIds: number[] }) {
    return this.paymentsService.completePayments(data.paymentIds);
  }

  @Get('make/:storeId')
  async makePayments(@Param('storeId') storeId: number) {
    return this.paymentsService.makePayments(storeId);
  }
}