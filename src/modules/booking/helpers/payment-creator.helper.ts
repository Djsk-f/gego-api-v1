import { randomBytes } from 'crypto';
import { EntityManager } from 'typeorm';
import { Payment, PaymentProvider, PaymentStatus } from '../../payment/entities/payment.entity';

export async function createPendingPayment(
  manager: EntityManager,
  bookingId: string,
  amount: number,
  currency = 'XAF',
): Promise<Payment> {
  const payment = manager.create(Payment, {
    bookingId,
    amount,
    currency,
    provider: PaymentProvider.WALLET,
    transactionRef: `TX-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`,
    status: PaymentStatus.PENDING,
  });

  return manager.save(payment);
}
