const TOKEN_STORAGE_KEY = 'catalogo-ativos.token';

type Listener = () => void;
const unauthorizedListeners = new Set<Listener>();

export function readToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Sem localStorage (modo privado etc.): a sessão vale só até recarregar.
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // idem
  }
}

/** Avisa quem escuta (o AuthProvider) que a API recusou o token (401). */
export function notifyUnauthorized(): void {
  unauthorizedListeners.forEach((listener) => listener());
}

export function onUnauthorized(listener: Listener): () => void {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}
