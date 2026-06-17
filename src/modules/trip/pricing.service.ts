import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { PricingRule } from './entities/pricing-rule.entity';

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(PricingRule)
    private readonly pricingRepository: Repository<PricingRule>,
  ) {}

  create(dto: DeepPartial<PricingRule>) {
    const rule = this.pricingRepository.create(dto);
    return this.pricingRepository.save(rule);
  }

  findAll(companyId: string, agencyId?: string) {
    return this.pricingRepository.find({
      where: { companyId, ...(agencyId ? { agencyId } : {}) },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, companyId: string, dto: Partial<PricingRule>) {
    const rule = await this.pricingRepository.findOne({
      where: { id, companyId },
    });
    if (!rule) throw new NotFoundException('Pricing rule not found');
    Object.assign(rule, dto);
    return this.pricingRepository.save(rule);
  }

  async remove(id: string, companyId: string) {
    const rule = await this.pricingRepository.findOne({
      where: { id, companyId },
    });
    if (!rule) throw new NotFoundException('Pricing rule not found');
    await this.pricingRepository.remove(rule);
  }
}
