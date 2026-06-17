import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuthenticatedUser } from '../types/authenticated-user.type';

type RequestWithUser = Request & {
  user?: AuthenticatedUser;
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !user.memberships?.length) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (user.type === 'SUPER_ADMIN') {
      return true;
    }

    const hasPermission = user.memberships.some((membership) =>
      requiredPermissions.some((required) =>
        membership.permissions.includes(required),
      ),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
