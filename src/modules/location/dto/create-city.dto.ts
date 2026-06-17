import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { CityScope } from '../entities/city.entity';

export class CreateCityDto {
  @IsString()
  name!: string;

  @IsUUID()
  regionId!: string;

  @IsOptional()
  @IsEnum(CityScope)
  scope?: CityScope;
}
