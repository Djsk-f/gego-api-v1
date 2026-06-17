import { User } from '../user/entities/user.entity';

export function mapAuthUser(user: User) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    type: user.type,
    status: user.status,
  };
}
