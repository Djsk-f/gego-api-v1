import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 5432),
    username: process.env.DATABASE_USERNAME ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? 'postgres',
    database: process.env.DATABASE_NAME ?? 'gego_api',
    autoLoadEntities: true,
    synchronize:
      process.env.NODE_ENV === 'production'
        ? false
        : process.env.DATABASE_SYNCHRONIZE === 'true',
    logging: process.env.DATABASE_LOGGING === 'true',
  }),
);
