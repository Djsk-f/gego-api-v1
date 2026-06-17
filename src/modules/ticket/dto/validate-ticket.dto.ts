import { IsString } from 'class-validator';

export class ValidateTicketDto {
  @IsString()
  qrCode!: string;
}
