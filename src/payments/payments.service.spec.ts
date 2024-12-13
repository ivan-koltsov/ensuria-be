import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Store } from '../entities/store.entity';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { NotFoundException } from '@nestjs/common';

const mockStoreRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
});

const mockPaymentRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

describe('PaymentsService', () => {
  let service: PaymentsService;
  let storeRepository: Repository<Store>;
  let paymentRepository: Repository<Payment>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Store), useFactory: mockStoreRepository },
        { provide: getRepositoryToken(Payment), useFactory: mockPaymentRepository },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    storeRepository = module.get<Repository<Store>>(getRepositoryToken(Store));
    paymentRepository = module.get<Repository<Payment>>(getRepositoryToken(Payment));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setFees', () => {
    it('should set the fees properly', () => {
      service.setFees(10, 5, 50);
      // Here you would verify using private variables if needed
    });
  });

  describe('addStore', () => {
    it('should add a store and return its ID', async () => {
      const store = { id: 1, name: 'My Store', feeC: 15 };
      storeRepository.create = jest.fn().mockReturnValue(store);
      storeRepository.save = jest.fn().mockResolvedValue(store);

      const result = await service.addStore('My Store', 15);
      expect(result).toEqual(store.id);
      expect(storeRepository.create).toHaveBeenCalledWith({ name: 'My Store', feeC: 15 });
    });
  });

  describe('acceptPayment', () => {
    it('should accept a payment and return its ID', async () => {
      // Mock store data
      const mockStore = { id: 1, name: 'My Store', feeC: 0.15 };
      storeRepository.findOne = jest.fn().mockResolvedValue(mockStore);

      // Mock payment data
      const payment = { 
        id: 1, 
        storeId: 1, 
        amount: 1000,
        status: PaymentStatus.Accepted,
        availableAmount: 700, // Example value after fees
        tempBlockingD: 50
      };
      paymentRepository.create = jest.fn().mockReturnValue(payment);
      paymentRepository.save = jest.fn().mockResolvedValue(payment);

      const result = await service.acceptPayment(1, 1000);
      
      expect(result).toEqual(payment.id);
      expect(storeRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(paymentRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        storeId: 1,
        amount: 1000,
        status: PaymentStatus.Accepted,
        tempBlockingD: expect.any(Number),
        availableAmount: expect.any(Number)
      }));
    });

    it('should throw NotFoundException when store is not found', async () => {
      storeRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.acceptPayment(999, 1000)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('processPayments', () => {
    it('should process payments successfully', async () => {
      const payment = { id: 1, storeId: 1, status: PaymentStatus.Accepted };
      paymentRepository.findOne = jest.fn().mockResolvedValue(payment);
      paymentRepository.save = jest.fn();

      await service.processPayments([1]);
      expect(payment.status).toBe(PaymentStatus.Processed);
      expect(paymentRepository.save).toHaveBeenCalledWith(payment);
    });
  });

  describe('completePayments', () => {
    it('should complete payments successfully', async () => {
      const payment = { id: 1, storeId: 1, status: PaymentStatus.Processed };
      paymentRepository.findOne = jest.fn().mockResolvedValue(payment);
      paymentRepository.save = jest.fn();

      await service.completePayments([1]);
      expect(payment.status).toBe(PaymentStatus.Completed);
      expect(paymentRepository.save).toHaveBeenCalledWith(payment);
    });
  });

  describe('makePayments', () => {
    it('should make payments', async () => {
      const payments = [
        { id: 1, storeId: 1, availableAmount: 900, status: PaymentStatus.Completed },
        { id: 2, storeId: 1, availableAmount: 800, status: PaymentStatus.Completed },
      ];
      paymentRepository.find = jest.fn().mockResolvedValue(payments);
      paymentRepository.save = jest.fn();

      const result = await service.makePayments(1);
      expect(result.amount).toBe(1700);
      expect(result.payments.length).toBe(2);
      expect(payments[0].status).toBe(PaymentStatus.Paid);
      expect(paymentRepository.save).toHaveBeenCalledTimes(2);
    });
    it('should pay the correct payments based on logic', async () => {
      const storeId = 1;
  
      // Mocking the payments
      const payments = [
        { id: 1, storeId, amount: 1010, status: PaymentStatus.Processed, availableAmount: 950 }, // D = 50
        { id: 2, storeId, amount: 51, status: PaymentStatus.Completed, availableAmount: 50 },    // D = 5
        { id: 3, storeId, amount: 102, status: PaymentStatus.Completed, availableAmount: 100 }, // D = 5
      ];
  
      paymentRepository.find = jest.fn().mockResolvedValue(payments);
      paymentRepository.save = jest.fn();
  
      // Call the service method
      const result = await service.makePayments(storeId); // Change to the actual method call
  
      // Ensure the total amount is handled correctly
      expect(result.amount).toBe(1100); // Total to be paid is the sum of the available amounts
      expect(result.payments.length).toBe(2); // We should only pay 2 payments of the 3
  
      // Logically, we would expect the first two payments (the max available) to be returned.
      expect(result.payments).toEqual([
        { id: 2, amount: 50 },   // Payment 2 available amount
        { id: 3, amount: 100 },  // Payment 3 available amount
      ]);
  
      // Verify the payments were updated to Paid status
      expect(payments[1].status).toBe(PaymentStatus.Paid);
      expect(payments[2].status).toBe(PaymentStatus.Paid);
  
      // Ensure the save was called for each payment that was paid
      expect(paymentRepository.save).toHaveBeenCalledTimes(2);
    });
  });
});