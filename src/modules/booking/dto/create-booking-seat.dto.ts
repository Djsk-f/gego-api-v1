import { IsString, Length, IsOptional, IsUUID } from 'class-validator';

export class CreateBookingSeatDto {
  @IsString()
  @Length(1, 10)
  seatNumber!: string;

  @IsString()
  @Length(1, 100)
  passengerName!: string;

  @IsOptional()
  @IsString()
  @Length(1, 30)
  passengerPhone?: string;

  @IsOptional()
  @IsUUID()
  departureStopId?: string;

  @IsOptional()
  @IsUUID()
  arrivalStopId?: string;
}
