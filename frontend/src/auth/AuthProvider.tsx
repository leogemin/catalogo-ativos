import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ApiError, isAbortError } from '../services/apiClient';
import { fetchCurrentUser, login as loginRequest } from '../services/authService';
import { clearToken, onUnauthorized, readToken, storeToken } from '../services/tokenStorage';
import type { AuthUser } from '../types/auth';
import { AuthContext, type AuthContextValue, type AuthStatus } from './AuthContext';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
}

/**
 * Sessão do usuário: o token fica em localStorage e é validado em
 * `GET /auth/me` ao abrir o app. Qualquer 401 da API encerra a sessão.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => ({
    status: readToken() ? 'checking' : 'anonymous',
    user: null,
  }));

  useEffect(() => onUnauthorized(() => setState({ status: 'anonymous', user: null })), []);

  useEffect(() => {
    if (state.status !== 'checking') return;
    const controller = new AbortController();
    fetchCurrentUser(controller.signal).then(
      (user) => setState({ status: 'authenticated', user }),
      (error: unknown) => {
        if (isAbortError(error)) return;
        // Token recusado: o apiClient já limpou. Falha de rede: pede login de novo.
        if (!(error instanceof ApiError && error.status === 401)) clearToken();
        setState({ status: 'anonymous', user: null });
      },
    );
    return () => controller.abort();
  }, [state.status]);

  const login = useCallback(async (username: string, password: string) => {
    const response = await loginRequest(username, password);
    storeToken(response.accessToken);
    setState({ status: 'authenticated', user: response.user });
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setState({ status: 'anonymous', user: null });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status: state.status, user: state.user, login, logout }),
    [state, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
