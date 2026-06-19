import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Route } from './entities/route.entity';
import { RouteStop } from './entities/route-stop.entity';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

@Injectable()
export class RouteService {
  constructor(
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    @InjectRepository(RouteStop)
    private readonly routeStopRepository: Repository<RouteStop>,
  ) {}

  async create(dto: CreateRouteDto, companyId: string): Promise<Route> {
    if (dto.departureCityId === dto.arrivalCityId) {
      throw new BadRequestException('La ville de départ et la ville d\'arrivée doivent être différentes');
    }

    const route = this.routeRepository.create({
      companyId,
      name: dto.name,
      departureCityId: dto.departureCityId,
      arrivalCityId: dto.arrivalCityId,
      distanceKm: dto.distanceKm,
      baseDurationMin: dto.baseDurationMin,
      basePrice: dto.basePrice,
      status: dto.status,
    });

    const saved = await this.routeRepository.save(route);

    if (dto.stops && dto.stops.length > 0) {
      const stops = dto.stops.map((s) =>
        this.routeStopRepository.create({
          routeId: saved.id,
          cityId: s.cityId,
          stopOrder: s.stopOrder,
          stopDurationMin: s.stopDurationMin,
          distanceFromPrevKm: s.distanceFromPrevKm,
        }),
      );
      await this.routeStopRepository.save(stops);
    }

    return this.findById(saved.id, companyId);
  }

  async findAll(companyId: string): Promise<Route[]> {
    return this.routeRepository.find({
      where: { companyId },
      relations: {
        departureCity: true,
        arrivalCity: true,
        stops: { city: true },
      },
      order: { name: 'ASC' },
    });
  }

  async findById(id: string, companyId: string): Promise<Route> {
    const route = await this.routeRepository.findOne({
      where: { id, companyId },
      relations: {
        departureCity: true,
        arrivalCity: true,
        stops: { city: true },
      },
    });
    if (!route) {
      throw new NotFoundException('Ligne introuvable');
    }
    return route;
  }

  async update(id: string, companyId: string, dto: UpdateRouteDto): Promise<Route> {
    const route = await this.findById(id, companyId);

    if (dto.departureCityId && dto.arrivalCityId) {
      if (dto.departureCityId === dto.arrivalCityId) {
        throw new BadRequestException('La ville de départ et la ville d\'arrivée doivent être différentes');
      }
    }

    Object.assign(route, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.departureCityId !== undefined && { departureCityId: dto.departureCityId }),
      ...(dto.arrivalCityId !== undefined && { arrivalCityId: dto.arrivalCityId }),
      ...(dto.distanceKm !== undefined && { distanceKm: dto.distanceKm }),
      ...(dto.baseDurationMin !== undefined && { baseDurationMin: dto.baseDurationMin }),
      ...(dto.basePrice !== undefined && { basePrice: dto.basePrice }),
      ...(dto.status !== undefined && { status: dto.status }),
    });

    await this.routeRepository.save(route);

    return this.findById(id, companyId);
  }

  async remove(id: string, companyId: string): Promise<void> {
    const route = await this.findById(id, companyId);
    await this.routeRepository.remove(route);
  }

  async toggleStop(routeId: string, stopId: string, companyId: string): Promise<RouteStop> {
    const route = await this.findById(routeId, companyId);
    const stop = route.stops.find((s) => s.id === stopId);
    if (!stop) {
      throw new NotFoundException('Escale introuvable');
    }

    stop.isActive = !stop.isActive;
    return this.routeStopRepository.save(stop);
  }

  async addStop(routeId: string, companyId: string, cityId: string, stopOrder: number, stopDurationMin: number, distanceFromPrevKm?: number, priceFromPrev?: number): Promise<RouteStop> {
    await this.findById(routeId, companyId);

    const existing = await this.routeStopRepository.findOne({
      where: { routeId, stopOrder },
    });
    if (existing) {
      throw new BadRequestException(`Une escale avec l'ordre ${stopOrder} existe déjà`);
    }

    const stop = this.routeStopRepository.create({
      routeId,
      cityId,
      stopOrder,
      stopDurationMin,
      distanceFromPrevKm,
      priceFromPrev: priceFromPrev ?? 0,
    });

    return this.routeStopRepository.save(stop);
  }

  async removeStop(routeId: string, stopId: string, companyId: string): Promise<void> {
    await this.findById(routeId, companyId);
    const stop = await this.routeStopRepository.findOne({ where: { id: stopId, routeId } });
    if (!stop) {
      throw new NotFoundException('Escale introuvable');
    }
    await this.routeStopRepository.remove(stop);
  }
}
