import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { BCRYPT_ROUNDS } from '../../common/constants/bcrypt';
import { RefreshToken } from './entities/refresh-token.entity';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './types/jwt-payload.type';
import { AuthMembershipService } from './auth-membership.service';
import { mapAuthUser } from './auth-response.mapper';
import { User, UserStatus } from '../user/entities/user.entity';
import { UsersService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authMembershipService: AuthMembershipService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
  ) {}

  async register(dto: RegisterDto) {
    const identifier = dto.email ?? dto.phone;

    if (!identifier) {
      throw new BadRequestException('Email or phone is required');
    }

    const existingUser = await this.usersService.findByIdentifier(identifier);

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.usersService.createCustomer({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
    });

    return this.buildAuthResponse(user, []);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByIdentifierWithPassword(dto.identifier, {
      agencyUserRoles: true,
      role: {
        permissions: true,
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(user, user.agencyUserRoles ?? []);
  }

  async refresh(dto: RefreshTokenDto) {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const user = await this.usersService.findById(payload.sub, {
      agencyUserRoles: true,
      role: {
        permissions: true,
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.refreshTokensRepository.find({
      where: { userId: user.id },
    });
    const tokenRecord = await this.findMatchingRefreshToken(
      tokens,
      dto.refreshToken,
    );

    if (!tokenRecord || tokenRecord.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Si le token a déjà été révoqué, refuser le refresh (token rotation)
    if (tokenRecord.revokedAt) {
      throw new UnauthorizedException('Refresh token already revoked');
    }

    tokenRecord.revokedAt = new Date();
    await this.refreshTokensRepository.save(tokenRecord);

    return this.buildAuthResponse(user, user.agencyUserRoles ?? []);
  }

  async logout(dto: RefreshTokenDto) {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const activeTokens = await this.refreshTokensRepository.find({
      where: { userId: payload.sub },
    });
    const tokenRecord = await this.findMatchingRefreshToken(
      activeTokens,
      dto.refreshToken,
    );

    if (tokenRecord) {
      tokenRecord.revokedAt = new Date();
      await this.refreshTokensRepository.save(tokenRecord);
    }

    return { loggedOut: true };
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId, {
      agencyUserRoles: true,
      role: {
        permissions: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid user session');
    }

    return {
      user: mapAuthUser(user),
      memberships: this.authMembershipService.buildMemberships(user),
    };
  }

  private async buildAuthResponse(
    user: User,
    agencyUserRoles: User['agencyUserRoles'],
  ) {
    const payload: JwtPayload = {
      sub: user.id,
      type: user.type,
      jti: randomUUID(),
    };
    const accessExpiresIn = this.configService.getOrThrow<string>(
      'jwt.accessExpiresIn',
    );
    const refreshExpiresIn = this.configService.getOrThrow<string>(
      'jwt.refreshExpiresIn',
    );
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
      expiresIn: accessExpiresIn as never,
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      expiresIn: refreshExpiresIn as never,
    });

    await this.storeRefreshToken(user.id, refreshToken);

    return {
      user: mapAuthUser(user),
      accessToken,
      refreshToken,
      memberships: this.authMembershipService.buildMemberships(user),
    };
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    const tokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    const refreshExpiresIn = this.configService.getOrThrow<string>(
      'jwt.refreshExpiresIn',
    );
    const expiresAt = new Date(Date.now() + this.parseMs(refreshExpiresIn));
    const token = this.refreshTokensRepository.create({
      userId,
      tokenHash,
      expiresAt,
    });

    await this.refreshTokensRepository.save(token);
  }

  private parseMs(expiresIn: string): number {
    const numericPart = expiresIn.replace(/[^0-9.]/g, '');
    const value = parseFloat(numericPart);
    if (Number.isNaN(value)) {
      throw new Error(`Invalid expiresIn format: "${expiresIn}"`);
    }
    if (expiresIn.endsWith('d')) return value * 24 * 60 * 60 * 1000;
    if (expiresIn.endsWith('h')) return value * 60 * 60 * 1000;
    if (expiresIn.endsWith('m')) return value * 60 * 1000;
    if (expiresIn.endsWith('s')) return value * 1000;
    return value;
  }

  private async verifyRefreshToken(refreshToken: string) {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async findMatchingRefreshToken(
    tokens: RefreshToken[],
    refreshToken: string,
  ) {
    for (const token of tokens) {
      const matches = await bcrypt.compare(refreshToken, token.tokenHash);

      if (matches) {
        return token;
      }
    }

    return null;
  }
}
