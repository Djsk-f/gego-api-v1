import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Permission } from '../modules/role/entities/permission.entity';
import { Role } from '../modules/role/entities/role.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.getOrThrow<TypeOrmModuleOptions>('database'),
    }),
    TypeOrmModule.forFeature([Permission, Role]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class DatabaseModule {}
