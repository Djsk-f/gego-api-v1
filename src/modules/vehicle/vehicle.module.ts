import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleMaintenanceLog } from './entities/vehicle-maintenance-log.entity';
import { VehicleController } from './vehicle.controller';
import { VehicleService } from './vehicle.service';
import { MaintenanceLogController } from './maintenance-log.controller';
import { MaintenanceLogService } from './maintenance-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle, VehicleMaintenanceLog])],
  controllers: [VehicleController, MaintenanceLogController],
  providers: [VehicleService, MaintenanceLogService],
  exports: [VehicleService, MaintenanceLogService],
})
export class VehicleModule {}
