import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @ValidateIf((dto: RegisterDto) => !dto.phone)
  @IsEmail()
  email?: string;

  @ValidateIf((dto: RegisterDto) => !dto.email)
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  city?: string;
}
