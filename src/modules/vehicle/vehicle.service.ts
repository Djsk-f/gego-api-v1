import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { BaseService } from '../../common/services/base.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle, VehicleStatus } from './entities/vehicle.entity';

@Injectable()
export class VehicleService extends BaseService<Vehicle> {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {
    super(vehicleRepository);
  }

  createVehicle(dto: CreateVehicleDto, companyId: string) {
    return this.create({ ...dto, companyId });
  }

  findVehiclesByCompany(companyId: string, page = 1, limit = 20) {
    return this.findAll({
      where: { companyId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  findVehicleById(id: string, companyId: string) {
    return this.findOne({
      where: { id, companyId },
      relations: { maintenanceLogs: true },
    });
  }

  async updateVehicle(id: string, companyId: string, dto: UpdateVehicleDto) {
    const vehicle = await this.findVehicleById(id, companyId);
    Object.assign(vehicle, dto);
    return this.vehicleRepository.save(vehicle);
  }

  async deleteVehicle(id: string, companyId: string) {
    const vehicle = await this.findVehicleById(id, companyId);
    await this.vehicleRepository.remove(vehicle);
  }

  async getVehicleStats(companyId: string) {
    const vehicles = await this.vehicleRepository.find({
      where: { companyId },
    });

    return {
      total: vehicles.length,
      active: vehicles.filter((v) => v.status === VehicleStatus.ACTIVE).length,
      inactive: vehicles.filter((v) => v.status === VehicleStatus.INACTIVE).length,
      maintenance: vehicles.filter((v) => v.status === VehicleStatus.MAINTENANCE).length,
      totalCapacity: vehicles.reduce((sum, v) => sum + v.capacity, 0),
    };
  }

  async findAvailableVehicles(
    companyId: string,
    departureTime: string,
    arrivalTime?: string,
    excludeTripId?: string,
  ): Promise<Vehicle[]> {
    const departure = new Date(departureTime);
    const arrival = arrivalTime ? new Date(arrivalTime) : new Date(departure.getTime() + 4 * 60 * 60 * 1000);

    const vehicles = await this.vehicleRepository.find({
      where: { companyId, status: VehicleStatus.ACTIVE },
    });

    const available: Vehicle[] = [];

    for (const vehicle of vehicles) {
      const hasConflict = await this.vehicleRepository.manager
        .createQueryBuilder('trip', 't')
        .where('t."vehicleId" = :vehicleId', { vehicleId: vehicle.id })
        .andWhere('t.status != :cancelled', { cancelled: 'CANCELLED' })
        .andWhere(
          `(t."departureTime" < :arrival AND t."arrivalTime" > :departure) OR (t."departureTime" < :arrival AND t."arrivalTime" IS NULL AND t."departureTime" > :departure)`,
          { departure, arrival },
        )
        .getCount();

      if (hasConflict === 0) {
        available.push(vehicle);
      }
    }

    return available;
  }

  async validateVehicleForTrip(
    vehicleId: string,
    companyId: string,
    departureTime: string,
    arrivalTime?: string,
    excludeTripId?: string,
  ): Promise<void> {
    const vehicle = await this.findOne({
      where: { id: vehicleId, companyId },
    });

    if (vehicle.status !== VehicleStatus.ACTIVE) {
      throw new BadRequestException(`Vehicle is ${vehicle.status.toLowerCase()} and cannot be assigned to a trip`);
    }

    const departure = new Date(departureTime);
    const arrival = arrivalTime
      ? new Date(arrivalTime)
      : new Date(departure.getTime() + 4 * 60 * 60 * 1000);

    const conflictQuery = this.vehicleRepository.manager
      .createQueryBuilder('trip', 't')
      .where('t."vehicleId" = :vehicleId', { vehicleId })
      .andWhere('t.status != :cancelled', { cancelled: 'CANCELLED' })
      .andWhere(
        `t."departureTime" < :arrival AND (t."arrivalTime" > :departure OR (t."arrivalTime" IS NULL AND t."departureTime" > :departure))`,
        { departure, arrival },
      );

    if (excludeTripId) {
      conflictQuery.andWhere('t.id != :excludeTripId', { excludeTripId });
    }

    const conflictCount = await conflictQuery.getCount();

    if (conflictCount > 0) {
      throw new BadRequestException('Vehicle is already assigned to another trip during this time period');
    }
  }

  async incrementTotalTrips(vehicleId: string): Promise<void> {
    await this.vehicleRepository
      .createQueryBuilder()
      .update(Vehicle)
      .set({ totalTrips: () => '"totalTrips" + 1' })
      .where('id = :id', { id: vehicleId })
      .execute();
  }
}
