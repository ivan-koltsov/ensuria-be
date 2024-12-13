import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '../entities/store.entity';
import { Payment, PaymentStatus } from '../entities/payment.entity';

@Injectable()
export class PaymentsService {
  private A: number;
  private B: number;
  private D: number;
  private stores: Map<number, Store>;

  constructor(
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,

    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {
    this.stores = new Map();
    this.A = 10; // Example fixed fee A
    this.B = 5;  // Example fixed fee B
    this.D = 50; // Example blocking fee D
  }

  setFees(A: number, B: number, D: number) {
    this.A = A;
    this.B = B;
    this.D = D;
  }

  async addStore(name: string, feeC: number): Promise<number> {
    const store = this.storeRepository.create({ name, feeC });
    await this.storeRepository.save(store);
    this.stores.set(store.id, store);
    return store.id;
  }

  async acceptPayment(storeId: number, amount: number): Promise<number> {
    const store = await this.storeRepository.findOne({ where: { id: storeId } });
    if (!store) throw new NotFoundException(`Store with ID ${storeId} not found.`);

    const bFee = amount * this.B;
    const cFee = amount * store.feeC;
    const dBlock = amount * this.D;
    const totalFees = this.A + bFee + cFee;
    const availableAmount = amount - totalFees;

    const payment = new Payment();
    payment.storeId = storeId;
    payment.amount = amount;
    payment.status = PaymentStatus.Accepted;
    payment.tempBlockingD = dBlock;
    payment.availableAmount = availableAmount;
    
    const savedPayment = await this.paymentRepository.save(payment);
    return savedPayment.id;
  }

  async processPayments(paymentIds: number[]): Promise<void> {
    for (const id of paymentIds) {
      const payment = await this.paymentRepository.findOne({ where: { id } });
      if (!payment) throw new NotFoundException(`Payment with ID ${id} not found.`);
      payment.status = PaymentStatus.Processed;
      await this.paymentRepository.save(payment);
    }
  }

  async completePayments(paymentIds: number[]): Promise<void> {
    for (const id of paymentIds) {
      const payment = await this.paymentRepository.findOne({ where: { id } });
      if (!payment) throw new NotFoundException(`Payment with ID ${id} not found.`);
      payment.status = PaymentStatus.Completed;
      await this.paymentRepository.save(payment);
    }
  }

  async makePayments(storeId: number): Promise<{ amount: number; payments: Array<{ id: number; amount: number }> }> {
    const payments = await this.paymentRepository.find({
      where: { storeId, status: PaymentStatus.Completed },
    });

    const paymentsToPay = payments
      .filter(p => p.availableAmount > 0)
      .sort((a, b) => a.availableAmount - b.availableAmount); // Sort by amount ascending

    const totalPayable = paymentsToPay.reduce((sum, p) => sum + p.availableAmount, 0);
    const paymentsSelected = paymentsToPay.slice(0, 2);

    // Update the status to Paid
    for (const payment of paymentsSelected) {
      payment.status = PaymentStatus.Paid;
      await this.paymentRepository.save(payment);
    }

    return {
      amount: totalPayable,
      payments: paymentsSelected.map(p => ({ id: p.id, amount: p.availableAmount })),
    };
  }
}