import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

// Rôles valides pour le staff d'une agence
const AGENCY_ROLE_NAMES = ['AGENCY_MANAGER', 'TICKET_AGENT', 'VEHICLE_MANAGER'] as const;
export type AgencyRoleName = typeof AGENCY_ROLE_NAMES[number];

export class CreateAgencyStaffDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @ValidateIf((dto: CreateAgencyStaffDto) => !dto.phone)
  @IsEmail()
  email?: string;

  @ValidateIf((dto: CreateAgencyStaffDto) => !dto.email)
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsIn(AGENCY_ROLE_NAMES)
  roleName!: AgencyRoleName;
}
