import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { DriverStatus } from '../entities/driver.entity';

export class UpdateDriverDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  licenseNumber?: string;

  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;
}
