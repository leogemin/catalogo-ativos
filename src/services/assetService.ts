import type { Asset, AssetInput, NonObjectItem } from '../types/asset';
import mockAssets from '../data/assets.json';
import mockNonObjectItems from '../data/nonObjects.json';

/**
 * Camada de acesso a dados do catálogo.
 *
 * Hoje ela serve dados mockados (JSON local) e mantém as escritas
 * (criação/edição) apenas em memória, simulando latência de rede — não há
 * backend nem persistência real ainda, então um reload perde as alterações.
 * Quando o backend existir, troque apenas o corpo de cada função por uma
 * chamada HTTP real (fetch/axios) — as assinaturas e os tipos retornados
 * já são o contrato esperado pelos hooks em `src/hooks`, então nenhum
 * componente precisa mudar.
 *
 * Exemplo de migração futura:
 *
 *   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
 *
 *   export async function fetchAssets(): Promise<Asset[]> {
 *     const response = await fetch(`${API_BASE_URL}/assets`);
 *     if (!response.ok) throw new Error('Falha ao carregar ativos');
 *     return response.json();
 *   }
 *
 *   export async function createAsset(input: AssetInput): Promise<Asset> {
 *     const response = await fetch(`${API_BASE_URL}/assets`, {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify(input),
 *     });
 *     if (!response.ok) throw new Error('Falha ao criar ativo');
 *     return response.json();
 *   }
 */

const MOCK_LATENCY_MS = 180;

function resolveAfterDelay<T>(value: T, ms = MOCK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `asset-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// TODO(backend): substituir por GET /assets quando a API existir.
export async function fetchAssets(): Promise<Asset[]> {
  const withIds: Asset[] = (mockAssets as AssetInput[]).map((item, index) => ({
    id: `seed-${index}`,
    ...item,
  }));
  return resolveAfterDelay(withIds);
}

// TODO(backend): substituir por GET /non-object-items quando a API existir.
export async function fetchNonObjectItems(): Promise<NonObjectItem[]> {
  return resolveAfterDelay(mockNonObjectItems as NonObjectItem[]);
}

// TODO(backend): substituir por POST /assets quando a API existir.
// Por enquanto só gera um id e "ecoa" os dados de volta — nada é persistido
// além do estado em memória do componente que chama esta função.
export async function createAsset(input: AssetInput): Promise<Asset> {
  const asset: Asset = { id: createId(), ...input };
  return resolveAfterDelay(asset);
}

// TODO(backend): substituir por PUT/PATCH /assets/:id quando a API existir.
export async function updateAsset(id: string, input: AssetInput): Promise<Asset> {
  const asset: Asset = { id, ...input };
  return resolveAfterDelay(asset);
}
