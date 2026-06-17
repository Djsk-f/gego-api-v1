import { IsUUID } from 'class-validator';

export class DisableCityDto {
  @IsUUID()
  cityId!: string;
}
