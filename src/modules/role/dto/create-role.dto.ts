import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { RoleScope } from '../entities/role.entity';

export class CreateRoleDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(RoleScope)
  scope!: RoleScope;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionNames?: string[];
}
