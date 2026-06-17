import { UserType } from '../../user/entities/user.entity';

export type JwtPayload = {
  sub: string;
  type: UserType;
  jti: string;
};
