import { IsString, IsUUID, IsOptional, IsNumber, IsEnum, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { RouteStatus } from '../entities/route.entity';

export class CreateRouteStopDto {
  @IsUUID()
  cityId!: string;

  @IsNumber()
  @Min(1)
  stopOrder!: number;

  @IsNumber()
  @Min(0)
  stopDurationMin!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  distanceFromPrevKm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceFromPrev?: number;
}

export class CreateRouteDto {
  @IsString()
  name!: string;

  @IsUUID()
  departureCityId!: string;

  @IsUUID()
  arrivalCityId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  distanceKm?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  baseDurationMin?: number;

  @IsNumber()
  @Min(0)
  basePrice!: number;

  @IsOptional()
  @IsEnum(RouteStatus)
  status?: RouteStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRouteStopDto)
  stops?: CreateRouteStopDto[];
}
