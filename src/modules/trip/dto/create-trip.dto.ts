import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { TripStatus } from '../entities/trip.entity';

export class CreateTripDto {
  @IsUUID()
  vehicleId!: string;

  @IsString()
  departureCity!: string;

  @IsString()
  arrivalCity!: string;

  @IsDateString()
  departureTime!: string;

  @IsOptional()
  @IsDateString()
  arrivalTime?: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;
}
