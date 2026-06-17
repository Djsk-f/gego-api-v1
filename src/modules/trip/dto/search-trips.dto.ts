import { IsDateString, IsOptional, IsString } from 'class-validator';

export class SearchTripsDto {
  @IsString()
  departureCity!: string;

  @IsString()
  arrivalCity!: string;

  @IsDateString()
  @IsOptional()
  date?: string;
}
