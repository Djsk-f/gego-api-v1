import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agency } from '../agency/entities/agency.entity';
import { Driver } from '../driver/entities/driver.entity';
import { Rating } from './entities/rating.entity';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Rating, Agency, Driver])],
  controllers: [RatingController],
  providers: [RatingService],
  exports: [TypeOrmModule, RatingService],
})
export class RatingModule {}
