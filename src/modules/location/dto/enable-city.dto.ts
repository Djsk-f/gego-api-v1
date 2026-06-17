import { IsUUID } from 'class-validator';

export class EnableCityDto {
  @IsUUID()
  cityId!: string;
}
