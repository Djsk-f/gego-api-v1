import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { City, CityScope } from './entities/city.entity';
import { CompanyDisabledCity } from './entities/company-disabled-city.entity';
import { Region, RegionScope } from './entities/region.entity';
import { UpdateRegionDto } from './dto/update-region.dto';
import { UpdateCityDto } from './dto/update-city.dto';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Region)
    private readonly regionsRepository: Repository<Region>,
    @InjectRepository(City)
    private readonly citiesRepository: Repository<City>,
    @InjectRepository(CompanyDisabledCity)
    private readonly disabledRepository: Repository<CompanyDisabledCity>,
  ) {}

  // ─── Public ────────────────────────────────────────────────────────────────

  async findRegions(companyId?: string): Promise<Region[]> {
    return this.regionsRepository.find({
      where: [
        { scope: RegionScope.GLOBAL, isActive: true },
        ...(companyId
          ? [{ scope: RegionScope.COMPANY, companyId, isActive: true }]
          : []),
      ],
      order: { name: 'ASC' },
    });
  }

  async findCities(
    companyId?: string,
    regionId?: string,
  ): Promise<City[]> {
    const where: any[] = [
      { scope: CityScope.GLOBAL, isActive: true },
      ...(companyId
        ? [{ scope: CityScope.COMPANY, companyId, isActive: true }]
        : []),
    ];

    if (regionId) {
      where.forEach((w) => (w.regionId = regionId));
    }

    let cities = await this.citiesRepository.find({
      where,
      relations: { region: true },
      order: { name: 'ASC' },
    });

    if (companyId) {
      const disabled = await this.disabledRepository.find({
        where: { companyId },
      });
      const disabledIds = new Set(disabled.map((d) => d.cityId));
      cities = cities.filter((c) => !disabledIds.has(c.id));
    }

    return cities;
  }

  async createRegion(
    name: string,
    scope: RegionScope = RegionScope.GLOBAL,
    companyId?: string,
  ): Promise<Region> {
    const existing = await this.regionsRepository.findOne({
      where: { name, ...(companyId ? { companyId } : { companyId: In([null]) }) },
    });
    if (existing) {
      throw new ConflictException('Region already exists');
    }

    const region = this.regionsRepository.create({ name, scope, companyId });
    return this.regionsRepository.save(region);
  }

  async createCity(
    name: string,
    regionId: string,
    scope: CityScope = CityScope.GLOBAL,
    companyId?: string,
  ): Promise<City> {
    const region = await this.regionsRepository.findOne({
      where: { id: regionId },
    });
    if (!region) {
      throw new NotFoundException('Region not found');
    }

    const existing = await this.citiesRepository.findOne({
      where: { name, regionId },
    });
    if (existing) {
      throw new ConflictException('City already exists in this region');
    }

    const city = this.citiesRepository.create({
      name,
      regionId,
      scope,
      companyId,
    });
    return this.citiesRepository.save(city);
  }

  async disableCityForCompany(
    cityId: string,
    companyId: string,
  ): Promise<void> {
    const city = await this.citiesRepository.findOne({
      where: { id: cityId },
    });
    if (!city) {
      throw new NotFoundException('City not found');
    }

    const existing = await this.disabledRepository.findOne({
      where: { companyId, cityId },
    });
    if (existing) return;

    const entry = this.disabledRepository.create({ companyId, cityId });
    await this.disabledRepository.save(entry);
  }

  // ─── Admin — Regions ───────────────────────────────────────────────────────

  async adminFindRegions(userType: string, companyId?: string): Promise<Region[]> {
    if (userType === 'SUPER_ADMIN') {
      return this.regionsRepository.find({
        relations: { cities: true },
        order: { name: 'ASC' },
      });
    }

    return this.regionsRepository.find({
      where: [
        { scope: RegionScope.GLOBAL },
        ...(companyId ? [{ scope: RegionScope.COMPANY, companyId }] : []),
      ],
      relations: { cities: true },
      order: { name: 'ASC' },
    });
  }

  async adminFindRegionById(id: string): Promise<Region> {
    const region = await this.regionsRepository.findOne({
      where: { id },
      relations: { cities: true },
    });
    if (!region) {
      throw new NotFoundException('Region not found');
    }
    return region;
  }

  async adminUpdateRegion(
    id: string,
    dto: UpdateRegionDto,
  ): Promise<Region> {
    const region = await this.adminFindRegionById(id);

    if (dto.name !== undefined) region.name = dto.name;
    if (dto.scope !== undefined) region.scope = dto.scope;

    if (dto.isActive !== undefined) {
      region.isActive = dto.isActive;

      // Si on désactive la région, désactiver toutes ses villes aussi
      await this.citiesRepository.update(
        { regionId: id },
        { isActive: dto.isActive },
      );
    }

    return this.regionsRepository.save(region);
  }

  // ─── Admin — Cities ────────────────────────────────────────────────────────

  async adminFindCities(
    userType: string,
    companyId?: string,
    regionId?: string,
  ): Promise<City[]> {
    const where: any[] = [];

    if (userType === 'SUPER_ADMIN') {
      where.push({});
    } else if (companyId) {
      where.push(
        { scope: CityScope.GLOBAL },
        { scope: CityScope.COMPANY, companyId },
      );
    } else {
      where.push({ scope: CityScope.GLOBAL });
    }

    if (regionId) {
      where.forEach((w) => (w.regionId = regionId));
    }

    return this.citiesRepository.find({
      where,
      relations: { region: true },
      order: { name: 'ASC' },
    });
  }

  async adminFindCityById(id: string): Promise<City> {
    const city = await this.citiesRepository.findOne({
      where: { id },
      relations: { region: true },
    });
    if (!city) {
      throw new NotFoundException('City not found');
    }
    return city;
  }

  async adminUpdateCity(id: string, dto: UpdateCityDto): Promise<City> {
    const city = await this.adminFindCityById(id);

    if (dto.name !== undefined) city.name = dto.name;
    if (dto.scope !== undefined) city.scope = dto.scope;
    if (dto.isActive !== undefined) city.isActive = dto.isActive;

    return this.citiesRepository.save(city);
  }

  async adminEnableCityForCompany(
    cityId: string,
    companyId: string,
  ): Promise<void> {
    const city = await this.citiesRepository.findOne({
      where: { id: cityId },
    });
    if (!city) {
      throw new NotFoundException('City not found');
    }

    await this.disabledRepository.delete({ companyId, cityId });
  }
}
