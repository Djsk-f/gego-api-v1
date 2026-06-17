import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdatePricingDto {
  @IsString()
  @IsOptional()
  departureCity?: string;

  @IsString()
  @IsOptional()
  arrivalCity?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  basePrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  vipPrice?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
