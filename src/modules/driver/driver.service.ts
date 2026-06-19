import {
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/services/base.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { Driver } from './entities/driver.entity';

@Injectable()
export class DriverService extends BaseService<Driver> {
  constructor(
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
  ) {
    super(driverRepository);
  }

  async createDriver(
    dto: CreateDriverDto,
    companyId: string,
  ): Promise<Driver> {
    return this.create({ ...dto, companyId });
  }

  findDriversByCompany(
    companyId: string,
    page = 1,
    limit = 20,
  ) {
    return this.findAll({
      where: { companyId },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  findDriverById(id: string, companyId: string) {
    return this.findOne({
      where: { id, companyId },
    });
  }

  async updateDriver(
    id: string,
    companyId: string,
    dto: UpdateDriverDto,
  ): Promise<Driver> {
    const driver = await this.findDriverById(id, companyId);
    Object.assign(driver, dto);
    return this.driverRepository.save(driver);
  }

  async deleteDriver(id: string, companyId: string): Promise<void> {
    const driver = await this.findDriverById(id, companyId);
    await this.driverRepository.remove(driver);
  }
}
