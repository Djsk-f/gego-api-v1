import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthMembershipService } from './auth-membership.service';
import { AuthService } from './auth.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { UserModule } from '../user/user.module';

@Global()
@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([RefreshToken]),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthMembershipService],
  exports: [AuthService, AuthMembershipService, JwtModule, UserModule],
})
export class AuthModule {}
