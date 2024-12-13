import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum PaymentStatus {
  Accepted = 'ACCEPTED',
  Processed = 'PROCESSED',
  Completed = 'COMPLETED',
  Paid = 'PAID'
}

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  storeId: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  availableAmount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  tempBlockingD: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.Accepted
  })
  status: PaymentStatus;

  getFees(): number {
    return this.amount - this.availableAmount;
  }
}