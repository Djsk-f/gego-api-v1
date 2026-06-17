import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentProvider } from '../entities/payment.entity';

export class InitiatePaymentDto {
  @IsString()
  bookingId!: string;

  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;

  @IsOptional()
  @IsString()
  phone?: string;
}
