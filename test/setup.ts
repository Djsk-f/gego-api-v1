// Chargé avant TOUS les tests — définit les variables d'environnement
// nécessaires au bootstrap du module NestJS (ConfigModule validation).

process.env.NODE_ENV = process.env.NODE_ENV ?? 'development';
process.env.PORT = process.env.PORT ?? '3000';
process.env.API_PREFIX = process.env.API_PREFIX ?? 'api/v1';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? '*';

process.env.DATABASE_HOST = process.env.DATABASE_HOST ?? 'localhost';
process.env.DATABASE_PORT = process.env.DATABASE_PORT ?? '5432';
process.env.DATABASE_USERNAME = process.env.DATABASE_USERNAME ?? 'postgres';
process.env.DATABASE_PASSWORD = process.env.DATABASE_PASSWORD ?? 'root';
process.env.DATABASE_NAME = process.env.DATABASE_NAME ?? 'gego';
process.env.DATABASE_SYNCHRONIZE = process.env.DATABASE_SYNCHRONIZE ?? 'true';
process.env.DATABASE_LOGGING = process.env.DATABASE_LOGGING ?? 'false';

process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test-access-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? '30d';

process.env.RUN_SEED = 'true';
