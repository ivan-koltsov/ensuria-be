import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

const mockPaymentsService = () => ({
  setFees: jest.fn(),
  addStore: jest.fn(),
  acceptPayment: jest.fn(),
  processPayments: jest.fn(),
  completePayments: jest.fn(),
  makePayments: jest.fn(),
});

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [{ provide: PaymentsService, useFactory: mockPaymentsService }],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('setFees', () => {
    it('should call setFees on service', async () => {
      const fees = { A: 10, B: 5, D: 50 };
      await controller.setFees(fees);
      expect(service.setFees).toHaveBeenCalledWith(10, 5, 50);
    });
  });

  describe('addStore', () => {
    it('should call addStore on service', async () => {
      const storeData = { name: 'My Store', feeC: 15 };
      service.addStore.mockResolvedValue(1);
      const result = await controller.addStore(storeData);
      expect(result).toEqual(1);
      expect(service.addStore).toHaveBeenCalledWith('My Store', 15);
    });
  });

  describe('acceptPayment', () => {
    it('should call acceptPayment on service', async () => {
      const paymentData = { storeId: 1, amount: 1000 };
      service.acceptPayment.mockResolvedValue(1);
      const result = await controller.acceptPayment(paymentData);
      expect(result).toEqual(1);
      expect(service.acceptPayment).toHaveBeenCalledWith(1, 1000);
    });
  });

  describe('processPayments', () => {
    it('should call processPayments on service', async () => {
      const paymentData = { paymentIds: [1] };
      await controller.processPayments(paymentData);
      expect(service.processPayments).toHaveBeenCalledWith(paymentData.paymentIds);
    });
  });

  describe('completePayments', () => {
    it('should call completePayments on service', async () => {
      const paymentData = { paymentIds: [1] };
      await controller.completePayments(paymentData);
      expect(service.completePayments).toHaveBeenCalledWith(paymentData.paymentIds);
    });
  });

  describe('makePayments', () => {
    it('should call makePayments on service', async () => {
      service.makePayments.mockResolvedValue({ amount: 900, payments: [] });
      const result = await controller.makePayments(1);
      expect(result).toEqual({ amount: 900, payments: [] });
      expect(service.makePayments).toHaveBeenCalledWith(1);
    });
  });
});