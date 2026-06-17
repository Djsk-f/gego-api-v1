import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { CityScope } from '../entities/city.entity';

export class UpdateCityDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(CityScope)
  scope?: CityScope;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
