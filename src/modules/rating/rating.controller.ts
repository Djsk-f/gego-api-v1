import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateRatingDto } from './dto/create-rating.dto';
import { RatingTargetType } from './entities/rating.entity';
import { RatingService } from './rating.service';

@Controller('ratings')
@UseGuards(JwtAuthGuard)
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post()
  create(
    @Body() dto: CreateRatingDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.ratingService.createRating(dto, user.id);
  }

  @Get()
  findByTarget(
    @Query('targetType') targetType: RatingTargetType,
    @Query('targetId') targetId: string,
  ) {
    return this.ratingService.findByTarget(targetType, targetId);
  }

  @Get('average')
  getAverage(
    @Query('targetType') targetType: RatingTargetType,
    @Query('targetId') targetId: string,
  ) {
    return this.ratingService.getAverageScore(targetType, targetId);
  }

  @Get('count')
  getCount(
    @Query('targetType') targetType: RatingTargetType,
    @Query('targetId') targetId: string,
  ) {
    return this.ratingService.getCount(targetType, targetId);
  }
}
