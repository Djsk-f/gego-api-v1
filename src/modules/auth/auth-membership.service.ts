import { Injectable } from '@nestjs/common';
import { AgencyUserRoleStatus } from '../role/entities/agency-user-role.entity';
import { User, UserType } from '../user/entities/user.entity';
import { Membership } from '../../common/types/authenticated-user.type';

@Injectable()
export class AuthMembershipService {
  buildMemberships(user: User): Membership[] {
    if (user.type === UserType.SUPER_ADMIN) {
      return [
        {
          companyId: '*',
          agencyId: undefined,
          role: 'SUPER_ADMIN',
          permissions: user.role?.permissions?.map((p) => p.name) ?? [],
        },
      ];
    }

    if (user.type === UserType.COMPANY_ADMIN) {
      return [
        {
          companyId: user.companyId ?? '',
          agencyId: undefined,
          role: 'COMPANY_ADMIN',
          permissions: user.role?.permissions?.map((p) => p.name) ?? [],
        },
      ];
    }

    const roleName = user.role?.name ?? user.type;
    const permissions = user.role?.permissions?.map((p) => p.name) ?? [];

    return (user.agencyUserRoles ?? [])
      .filter((aur) => aur.status === AgencyUserRoleStatus.ACTIVE)
      .map((aur) => ({
        companyId: aur.companyId,
        agencyId: aur.agencyId,
        role: roleName,
        permissions,
      }));
  }
}
