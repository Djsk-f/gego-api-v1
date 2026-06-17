import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../types/authenticated-user.type';
import { TenantContext } from '../types/tenant-context.type';

type RequestWithTenant = Request & {
  tenant?: TenantContext;
  user?: AuthenticatedUser;
};

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const companyId = this.getHeaderValue(request.headers['x-company-id']);

    // SUPER_ADMIN a accès à toutes les companies, headers optionnels
    if (user.type === 'SUPER_ADMIN') {
      request.tenant = { companyId, agencyId: this.getHeaderValue(request.headers['x-agency-id']) };
      return true;
    }

    if (!companyId) {
      throw new ForbiddenException('X-Company-Id header is required');
    }

    const hasCompany = user.memberships.some(
      (m) => m.companyId === companyId,
    );

    if (!hasCompany) {
      throw new ForbiddenException('Access denied for this company');
    }

    const agencyId = this.getHeaderValue(request.headers['x-agency-id']);

    if (agencyId) {
      const hasAgency = user.memberships.some(
        (m) => m.agencyId === agencyId,
      );

      if (!hasAgency) {
        throw new ForbiddenException('Access denied for this agency');
      }
    }

    request.tenant = {
      companyId,
      agencyId,
    };

    return true;
  }

  private getHeaderValue(
    value: string | string[] | undefined,
  ): string | undefined {
    if (Array.isArray(value)) {
      return value[0];
    }

    return value;
  }
}
