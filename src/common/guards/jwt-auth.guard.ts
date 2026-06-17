import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthMembershipService } from '../../modules/auth/auth-membership.service';
import { UserStatus } from '../../modules/user/entities/user.entity';
import { UsersService } from '../../modules/user/user.service';
import { AuthenticatedUser } from '../types/authenticated-user.type';

type RequestWithUser = Request & {
  user?: AuthenticatedUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly authMembershipService: AuthMembershipService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        type: string;
      }>(token, {
        secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
      });
      const user = await this.usersService.findById(payload.sub, {
        agencyUserRoles: true,
        role: {
          permissions: true,
        },
      });

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Invalid user session');
      }

      const memberships = this.authMembershipService.buildMemberships(user);

      request.user = {
        id: user.id,
        email: user.email,
        phone: user.phone,
        type: user.type,
        memberships,
      };

      return true;
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Access token expired');
      }
      this.logger.warn(
        `JWT verification failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
