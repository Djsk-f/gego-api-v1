import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { DriverStatus } from '../entities/driver.entity';

export class CreateDriverDto {
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MaxLength(100)
  lastName!: string;

  @IsString()
  @MaxLength(30)
  phone!: string;

  @IsString()
  @MaxLength(50)
  licenseNumber!: string;

  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;
}
