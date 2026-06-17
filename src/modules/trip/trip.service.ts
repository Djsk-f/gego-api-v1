import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/services/base.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { SearchTripsDto } from './dto/search-trips.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { Trip } from './entities/trip.entity';
import {
  buildSearchDateRange,
  buildTripSearchWhere,
  enrichTripsWithPricing,
} from './helpers/trip-search.helper';

@Injectable()
export class TripService extends BaseService<Trip> {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
  ) {
    super(tripRepository);
  }

  createTrip(
    dto: CreateTripDto,
    companyId: string,
    agencyId?: string,
  ) {
    return this.create({
      ...dto,
      companyId,
      agencyId,
      departureTime: new Date(dto.departureTime),
      arrivalTime: dto.arrivalTime ? new Date(dto.arrivalTime) : undefined,
    });
  }

  findByCompany(companyId: string, agencyId?: string, page = 1, limit = 20) {
    return this.findAll({
      where: { companyId, ...(agencyId ? { agencyId } : {}) },
      relations: { vehicle: true },
      order: { departureTime: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  findTripById(id: string, companyId: string) {
    return this.findOne({
      where: { id, companyId },
      relations: { vehicle: true },
    });
  }

  async updateTrip(id: string, companyId: string, dto: UpdateTripDto) {
    const trip = await this.findTripById(id, companyId);
    const update = dto as Record<string, unknown>;
    Object.assign(trip, {
      ...dto,
      departureTime: update.departureTime
        ? new Date(update.departureTime as string)
        : trip.departureTime,
      arrivalTime: update.arrivalTime
        ? new Date(update.arrivalTime as string)
        : trip.arrivalTime,
    });
    return this.tripRepository.save(trip);
  }

  async deleteTrip(id: string, companyId: string) {
    const trip = await this.findTripById(id, companyId);
    await this.tripRepository.remove(trip);
  }

  async search(dto: SearchTripsDto) {
    const { start, end } = buildSearchDateRange(dto.date);

    const trips = await this.tripRepository.find({
      where: buildTripSearchWhere(dto.departureCity, dto.arrivalCity, start, end),
      relations: { vehicle: true, agency: true, driver: true },
      order: { departureTime: 'ASC' },
    });

    return enrichTripsWithPricing(this.tripRepository.manager, trips);
  }
}
