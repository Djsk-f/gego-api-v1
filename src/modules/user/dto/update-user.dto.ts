import { IsOptional, IsString, IsEmail, IsEnum } from 'class-validator';
import { UserStatus, UserType } from '../entities/user.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserType)
  type?: UserType;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
