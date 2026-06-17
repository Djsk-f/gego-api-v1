import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../role/entities/role.entity';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UsersService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  controllers: [UserController],
  providers: [UsersService],
  exports: [TypeOrmModule, UsersService],
})
export class UserModule {}
