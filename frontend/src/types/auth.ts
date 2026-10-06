/** Usuário autenticado (`GET /auth/me`). Só o usuário "admin" tem `isAdmin`. */
export interface AuthUser {
  id: string;
  username: string;
  isAdmin: boolean;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: AuthUser;
}

/** Usuário como `GET /users` devolve (somente admin). */
export interface User extends AuthUser {
  createdAt: string;
}

export interface UserInput {
  username: string;
  password: string;
}
