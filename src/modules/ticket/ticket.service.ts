import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/services/base.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { Ticket, TicketStatus } from './entities/ticket.entity';

@Injectable()
export class TicketService extends BaseService<Ticket> {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {
    super(ticketRepository);
  }

  async validate(qrCode: string, user: AuthenticatedUser) {
    const ticket = await this.findOne({
      where: { qrCode },
      relations: { bookingSeat: { booking: { trip: true } } },
    });

    if (ticket.status === TicketStatus.VALIDATED) {
      throw new BadRequestException('Ticket already validated');
    }

    if (ticket.status === TicketStatus.EXPIRED) {
      throw new BadRequestException('Ticket expired');
    }

    const agencyId = ticket.bookingSeat?.booking?.trip?.agencyId;

    if (agencyId) {
      const canValidate = user.memberships.some(
        (m) => m.agencyId === agencyId,
      );

      if (!canValidate) {
        throw new ForbiddenException('You cannot validate tickets for this agency');
      }
    }

    ticket.status = TicketStatus.VALIDATED;
    ticket.validatedAt = new Date();
    ticket.validatedBy = user.id;

    return this.ticketRepository.save(ticket);
  }
}
