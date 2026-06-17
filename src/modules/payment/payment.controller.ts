import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PaymentService } from './payment.service';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('booking:confirm')
  initiate(
    @Body() dto: InitiatePaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentService.initiate(dto.bookingId, dto.provider, dto.phone, user);
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('booking:confirm')
  confirm(
    @Body() dto: ConfirmPaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentService.confirm(dto.transactionRef, user);
  }

  @Get('status/:bookingId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('booking:read')
  status(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentService.findPaymentStatus(bookingId, user);
  }
}
