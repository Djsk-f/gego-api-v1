import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/services/base.service';
import { VehicleService } from '../vehicle/vehicle.service';
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
    private readonly vehicleService: VehicleService,
  ) {
    super(tripRepository);
  }

  async createTrip(
    dto: CreateTripDto,
    companyId: string,
    agencyId: string,
  ) {
    await this.vehicleService.validateVehicleForTrip(
      dto.vehicleId,
      companyId,
      dto.departureTime,
      dto.arrivalTime,
    );

    const trip = await this.create({
      ...dto,
      companyId,
      agencyId,
      departureTime: new Date(dto.departureTime),
      arrivalTime: dto.arrivalTime ? new Date(dto.arrivalTime) : undefined,
    });

    await this.vehicleService.incrementTotalTrips(dto.vehicleId);

    return trip;
  }

  findByCompany(companyId: string, agencyId?: string, page = 1, limit = 20) {
    return this.findAll({
      where: { companyId, ...(agencyId ? { agencyId } : {}) },
      relations: { vehicle: true, driver: true, route: true },
      order: { departureTime: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  findTripById(id: string, companyId: string) {
    return this.findOne({
      where: { id, companyId },
      relations: { vehicle: true, driver: true, route: { stops: { city: true } } },
    });
  }

  async findByVehicle(vehicleId: string, companyId: string, page = 1, limit = 20) {
    return this.findAll({
      where: { vehicleId, companyId },
      relations: { driver: true, agency: true, route: true },
      order: { departureTime: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async updateTrip(id: string, companyId: string, dto: UpdateTripDto) {
    const trip = await this.findTripById(id, companyId);

    if (dto.vehicleId || dto.departureTime || dto.arrivalTime) {
      await this.vehicleService.validateVehicleForTrip(
        dto.vehicleId ?? trip.vehicleId,
        companyId,
        dto.departureTime ?? trip.departureTime.toISOString(),
        dto.arrivalTime ?? trip.arrivalTime?.toISOString() ?? undefined,
        id,
      );
    }

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
      relations: { vehicle: true, agency: true, driver: true, route: true },
      order: { departureTime: 'ASC' },
    });

    return enrichTripsWithPricing(this.tripRepository.manager, trips);
  }
}
