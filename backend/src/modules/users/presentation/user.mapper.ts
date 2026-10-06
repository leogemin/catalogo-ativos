import { isAdmin, type User } from '../domain/user.entity.js';
import type { UserResponseDto } from './dto/user.dto.js';

// Nunca expõe o hash da senha.
export function toUserResponse(user: User): UserResponseDto {
  return { id: user.id, username: user.username, isAdmin: isAdmin(user), createdAt: user.createdAt };
}
