import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { TicketService } from './ticket.service';
import { ValidateTicketDto } from './dto/validate-ticket.dto';

@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post('validate')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('ticket:validate')
  validate(
    @Body() dto: ValidateTicketDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketService.validate(dto.qrCode, user);
  }
}
