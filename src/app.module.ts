import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { AgencyModule } from './modules/agency/agency.module';
import { AuthModule } from './modules/auth/auth.module';
import { BookingModule } from './modules/booking/booking.module';
import { CompanyModule } from './modules/company/company.module';
import { DriverModule } from './modules/driver/driver.module';
import { PaymentModule } from './modules/payment/payment.module';
import { RatingModule } from './modules/rating/rating.module';
import { RoleModule } from './modules/role/role.module';
import { TicketModule } from './modules/ticket/ticket.module';
import { TripModule } from './modules/trip/trip.module';
import { UserModule } from './modules/user/user.module';
import { VehicleModule } from './modules/vehicle/vehicle.module';
import { LocationModule } from './modules/location/location.module';
import { RouteModule } from './modules/route/route.module';
 
const nodeEnv = process.env.NODE_ENV ?? 'development';
const envFilePath = `env/${nodeEnv === 'development' ? 'local' : nodeEnv}.env`;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
      load: [appConfig, databaseConfig, jwtConfig],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    DatabaseModule,
    CompanyModule,
    AgencyModule,
    UserModule,
    RoleModule,
    AuthModule,
    VehicleModule,
    TripModule,
    DriverModule,
    BookingModule,
    TicketModule,
    PaymentModule,
    RatingModule,
    LocationModule,
    RouteModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
