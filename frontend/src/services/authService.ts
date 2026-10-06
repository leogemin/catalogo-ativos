import type { AuthUser, LoginResponse, User, UserInput } from '../types/auth';
import { apiRequest } from './apiClient';

export function login(username: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', { method: 'POST', body: { username, password } });
}

export function fetchCurrentUser(signal?: AbortSignal): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/me', { signal });
}

export function fetchUsers(signal?: AbortSignal): Promise<User[]> {
  return apiRequest<User[]>('/users', { signal });
}

export function createUser(input: UserInput): Promise<User> {
  return apiRequest<User>('/users', { method: 'POST', body: input });
}

export function deleteUser(userId: string): Promise<void> {
  return apiRequest<void>(`/users/${userId}`, { method: 'DELETE' });
}
