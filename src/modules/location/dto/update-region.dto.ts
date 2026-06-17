import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { RegionScope } from '../entities/region.entity';

export class UpdateRegionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(RegionScope)
  scope?: RegionScope;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
