import { IsString, Length, IsOptional } from 'class-validator';

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
}
