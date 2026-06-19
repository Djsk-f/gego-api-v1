import { IsArray, IsOptional, IsString, IsUUID, Length, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateBookingSeatDto } from './create-booking-seat.dto';

export class CreateBookingDto {
  @IsUUID()
  tripId!: string;

  @IsOptional()
  @IsUUID()
  departureStopId?: string;

  @IsOptional()
  @IsUUID()
  arrivalStopId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateBookingSeatDto)
  seats!: CreateBookingSeatDto[];

  @IsOptional()
  @IsString()
  @Length(1, 100)
  contactName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 30)
  contactPhone?: string;
}
