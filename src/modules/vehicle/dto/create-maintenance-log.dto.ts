import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { MaintenanceStatus, MaintenanceType } from '../entities/vehicle-maintenance-log.entity';

export class CreateMaintenanceLogDto {
  @IsEnum(MaintenanceType)
  type!: MaintenanceType;

  @IsString()
  description!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  mileage?: number;

  @IsOptional()
  @Min(0)
  cost?: number;

  @IsDateString()
  performedAt!: string;

  @IsOptional()
  @IsDateString()
  nextServiceAt?: string;

  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  performedBy?: string;
}
