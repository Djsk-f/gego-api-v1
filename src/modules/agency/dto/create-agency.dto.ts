import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AgencyStatus } from '../entities/agency.entity';

export class CreateAgencyDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsString()
  city!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(AgencyStatus)
  status?: AgencyStatus;
}
