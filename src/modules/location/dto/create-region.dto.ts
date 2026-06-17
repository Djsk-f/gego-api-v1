import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RegionScope } from '../entities/region.entity';

export class CreateRegionDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsEnum(RegionScope)
  scope?: RegionScope;
}
