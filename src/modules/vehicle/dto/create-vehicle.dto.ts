import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { VehicleStatus, VehicleType } from '../entities/vehicle.entity';

export class CreateVehicleDto {
  @IsString()
  plateNumber!: string;

  @IsString()
  model!: string;

  @IsEnum(VehicleType)
  type!: VehicleType;

  @IsInt()
  @Min(1)
  capacity!: number;

  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
}
