import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() dto: CreateBookingDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bookingService.createBooking(dto, user.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findMyBookings(@CurrentUser() user: AuthenticatedUser) {
    return this.bookingService.findByUser(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bookingService.findByUserAndId(id, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bookingService.cancel(id, user.id);
  }
}
