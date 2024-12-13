import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum PaymentStatus {
  Accepted = 'accepted',
  Processed = 'processed',
  Completed = 'completed',
  Paid = 'paid',
}

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  storeId: number;

  @Column()
  amount: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.Accepted })
  status: PaymentStatus;

  @Column({ nullable: true })
  tempBlockingD: number;

  @Column({ nullable: true })
  availableAmount: number;
}