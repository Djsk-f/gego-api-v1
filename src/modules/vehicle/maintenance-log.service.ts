import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/services/base.service';
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto';
import { UpdateMaintenanceLogDto } from './dto/update-maintenance-log.dto';
import { VehicleMaintenanceLog } from './entities/vehicle-maintenance-log.entity';

@Injectable()
export class MaintenanceLogService extends BaseService<VehicleMaintenanceLog> {
  constructor(
    @InjectRepository(VehicleMaintenanceLog)
    private readonly logRepository: Repository<VehicleMaintenanceLog>,
  ) {
    super(logRepository);
  }

  async createLog(dto: CreateMaintenanceLogDto, vehicleId: string, companyId: string): Promise<VehicleMaintenanceLog> {
    return this.create({
      ...dto,
      vehicleId,
      companyId,
      performedAt: new Date(dto.performedAt),
      nextServiceAt: dto.nextServiceAt ? new Date(dto.nextServiceAt) : undefined,
    } as VehicleMaintenanceLog);
  }

  findByVehicle(vehicleId: string, page = 1, limit = 20) {
    return this.findAll({
      where: { vehicleId },
      order: { performedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  findLogsByCompany(companyId: string, page = 1, limit = 20) {
    return this.findAll({
      where: { companyId },
      relations: { vehicle: true },
      order: { performedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findUpcoming(companyId: string): Promise<VehicleMaintenanceLog[]> {
    const now = new Date();
    return this.logRepository.find({
      where: {
        companyId,
        status: 'SCHEDULED' as any,
      },
      relations: { vehicle: true },
      order: { nextServiceAt: 'ASC' },
    });
  }

  async updateLog(id: string, dto: UpdateMaintenanceLogDto, vehicleId?: string): Promise<VehicleMaintenanceLog> {
    const log = await this.findById(id);
    Object.assign(log, {
      ...dto,
      performedAt: dto.performedAt ? new Date(dto.performedAt) : log.performedAt,
      nextServiceAt: dto.nextServiceAt ? new Date(dto.nextServiceAt) : log.nextServiceAt,
    });
    return this.logRepository.save(log);
  }

  async deleteLog(id: string): Promise<void> {
    const log = await this.findById(id);
    await this.logRepository.remove(log);
  }
}
