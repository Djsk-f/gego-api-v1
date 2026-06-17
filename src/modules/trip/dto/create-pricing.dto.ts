import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreatePricingDto {
  @IsUUID()
  agencyId!: string;

  @IsString()
  departureCity!: string;

  @IsString()
  arrivalCity!: string;

  @IsNumber()
  @Min(0)
  basePrice!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  vipPrice?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
