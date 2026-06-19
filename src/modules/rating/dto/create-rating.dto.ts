import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { RatingTargetType } from '../entities/rating.entity';

export class CreateRatingDto {
  @IsEnum(RatingTargetType)
  targetType!: RatingTargetType;

  @IsUUID()
  targetId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  score!: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
