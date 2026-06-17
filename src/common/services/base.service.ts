import { NotFoundException } from '@nestjs/common';
import { DeepPartial, FindManyOptions, FindOneOptions, FindOptionsWhere, Repository } from 'typeorm';

export abstract class BaseService<T extends { id: string }> {
  constructor(protected readonly repository: Repository<T>) {}

  async create(dto: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(dto);
    return this.repository.save(entity as T);
  }

  findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options ?? {});
  }

  async findOne(options: FindOneOptions<T>): Promise<T> {
    const entity = await this.repository.findOne(options);
    if (!entity) {
      throw new NotFoundException(`${this.repository.metadata.name} not found`);
    }
    return entity;
  }

  async findById(id: string, relations?: FindOneOptions<T>['relations']): Promise<T> {
    const entity = await this.repository.findOne({
      where: { id } as FindOptionsWhere<T>,
      relations,
    });
    if (!entity) {
      throw new NotFoundException(`${this.repository.metadata.name} not found`);
    }
    return entity;
  }

  async update(id: string, dto: DeepPartial<T>): Promise<T> {
    const entity = await this.findById(id);
    Object.assign(entity, dto);
    return this.repository.save(entity);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.findById(id);
    await this.repository.remove(entity);
  }
}
