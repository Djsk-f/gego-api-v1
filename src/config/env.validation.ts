import { plainToInstance } from 'class-transformer';
import {
  IsBooleanString,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsIn(['development', 'test', 'staging', 'production'])
  @IsOptional()
  NODE_ENV?: string;

  @IsNumberString()
  @IsOptional()
  PORT?: string;

  @IsString()
  @IsOptional()
  API_PREFIX?: string;

  @IsString()
  @IsOptional()
  CORS_ORIGIN?: string;

  @IsString()
  @IsOptional()
  DATABASE_HOST?: string;

  @IsNumberString()
  @IsOptional()
  DATABASE_PORT?: string;

  @IsString()
  @IsOptional()
  DATABASE_USERNAME?: string;

  @IsString()
  @IsOptional()
  DATABASE_PASSWORD?: string;

  @IsString()
  @IsOptional()
  DATABASE_NAME?: string;

  @IsBooleanString()
  @IsOptional()
  DATABASE_SYNCHRONIZE?: string;

  @IsBooleanString()
  @IsOptional()
  DATABASE_LOGGING?: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_SECRET?: string;

  @IsString()
  @IsOptional()
  JWT_REFRESH_SECRET?: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRES_IN?: string;

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: false,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
