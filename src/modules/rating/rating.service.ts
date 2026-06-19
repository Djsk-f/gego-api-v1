import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BaseService } from '../../common/services/base.service';
import { Agency } from '../agency/entities/agency.entity';
import { Driver } from '../driver/entities/driver.entity';
import { CreateRatingDto } from './dto/create-rating.dto';
import { Rating, RatingTargetType } from './entities/rating.entity';

@Injectable()
export class RatingService extends BaseService<Rating> {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
    private readonly dataSource: DataSource,
  ) {
    super(ratingRepository);
  }

  async createRating(dto: CreateRatingDto, userId: string): Promise<Rating> {
    const existing = await this.ratingRepository.findOne({
      where: { userId, targetType: dto.targetType, targetId: dto.targetId },
    });
    if (existing) {
      throw new ConflictException('You have already rated this target');
    }

    await this.validateTargetExists(dto.targetType, dto.targetId);

    const rating = await this.create({ ...dto, userId } as Rating);
    await this.updateDenormalizedRating(dto.targetType, dto.targetId);
    return rating;
  }

  async findByTarget(targetType: RatingTargetType, targetId: string): Promise<Rating[]> {
    return this.ratingRepository.find({
      where: { targetType, targetId },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getAverageScore(targetType: RatingTargetType, targetId: string): Promise<number> {
    const result = await this.ratingRepository
      .createQueryBuilder('rating')
      .select('AVG(rating.score)', 'avg')
      .where('rating.targetType = :targetType', { targetType })
      .andWhere('rating.targetId = :targetId', { targetId })
      .getRawOne();

    return parseFloat(result?.avg ?? '0') || 0;
  }

  async getCount(targetType: RatingTargetType, targetId: string): Promise<number> {
    return this.ratingRepository.count({
      where: { targetType, targetId },
    });
  }

  private async validateTargetExists(
    targetType: RatingTargetType,
    targetId: string,
  ): Promise<void> {
    let exists: boolean;
    switch (targetType) {
      case RatingTargetType.AGENCY:
        exists = await this.dataSource.getRepository(Agency).exists({ where: { id: targetId } });
        break;
      case RatingTargetType.DRIVER:
        exists = await this.dataSource.getRepository(Driver).exists({ where: { id: targetId } });
        break;
      default:
        exists = true;
    }
    if (!exists) {
      throw new NotFoundException(`${targetType} with id ${targetId} not found`);
    }
  }

  private async updateDenormalizedRating(
    targetType: RatingTargetType,
    targetId: string,
  ): Promise<void> {
    const avg = await this.getAverageScore(targetType, targetId);
    const rounded = Math.round(avg * 10) / 10;

    switch (targetType) {
      case RatingTargetType.AGENCY:
        await this.dataSource.getRepository(Agency).update(targetId, { rating: rounded });
        break;
      case RatingTargetType.DRIVER:
        await this.dataSource.getRepository(Driver).update(targetId, { rating: rounded });
        break;
    }
  }
}
