import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/services/base.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle } from './entities/vehicle.entity';

@Injectable()
export class VehicleService extends BaseService<Vehicle> {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {
    super(vehicleRepository);
  }

  createVehicle(
    dto: CreateVehicleDto,
    companyId: string,
    agencyId?: string,
  ) {
    return this.create({ ...dto, companyId, agencyId });
  }

  findVehiclesByCompany(companyId: string, agencyId?: string, page = 1, limit = 20) {
    return this.findAll({
      where: { companyId, ...(agencyId ? { agencyId } : {}) },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  findVehicleById(id: string, companyId: string) {
    return this.findOne({
      where: { id, companyId },
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
}
