import { PartialType } from '@nestjs/mapped-types';
import { CreateMaintenanceLogDto } from './create-maintenance-log.dto';

export class UpdateMaintenanceLogDto extends PartialType(CreateMaintenanceLogDto) {}
