interface ImportMetaEnv {
  /** Base da API (padrão: /api, servido pelo proxy do Vite em dev). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
