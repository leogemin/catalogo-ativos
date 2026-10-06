# Catálogo de Activos — Ciclo Consultoría

App React + TypeScript (Vite) para consulta do catálogo de activos e bienes
no objeto. Ver `../CLAUDE.md` para o contexto completo de design e
funcionalidades portados do protótipo original (`../reference/legacy-prototype.html`).
Os dados vêm da API em `../backend` (NestJS + PostgreSQL).

## Rodando localmente

Com a API rodando (ver `../backend/README.md`):

```bash
cp .env.example .env   # opcional; os padrões já servem para dev
npm install
npm run dev            # http://localhost:5173
```

Em dev, o front chama `/api` no próprio Vite, que faz proxy para
`API_PROXY_TARGET` (padrão `http://localhost:3000`). Em produção, defina
`VITE_API_BASE_URL` com a URL pública da API antes do `npm run build`.

```bash
npm run build    # build de produção (tsc -b && vite build)
npm run preview  # serve o build de produção localmente
npm run lint      # oxlint
```

## Estrutura

- `src/services/apiClient.ts` — `fetch` com base configurável, query string e
  erros tipados (`ApiError` com `status`, `code`, `message`, `details`, no
  formato único do backend).
- `src/services/catalogService.ts` — chamadas da API usadas pela tela:
  catálogos, itens paginados, facets, criar e editar item.
- `src/hooks/` — `useAsyncResource` (busca por chave com cancelamento via
  `AbortController`, mantém o resultado anterior enquanto recarrega e expõe
  `reload`), `useCatalogData` (`useCatalogs`, `useCatalogItems`,
  `useCatalogFacets`), `useDebouncedValue` e `useAssetMutations`.
- `src/components/` — componentes de UI, organizados por bloco da tela
  (Topbar, HeroSection, Toolbar, AssetGrid, AssetList, NonObjectGrid,
  Pagination, AssetDetailModal, AssetFormModal, common/).
- `src/pages/CatalogPage.tsx` — orquestra catálogo selecionado, filtros,
  paginação e modais.
- `src/i18n/` — configuração do `i18next`/`react-i18next` e os dicionários
  `locales/es.json` (padrão) e `locales/pt.json`. O idioma é selecionável
  pela UI (Topbar) e persistido em `localStorage`.

## Autenticação

- Sem sessão, o app mostra só a tela de login (`pages/LoginPage.tsx`).
- `auth/AuthProvider.tsx` guarda o token em `localStorage`, valida-o em
  `GET /auth/me` ao abrir o app e expõe `useAuth()` (`status`, `user`, `login`, `logout`).
- `services/apiClient.ts` envia `Authorization: Bearer <token>` em toda
  requisição; qualquer 401 limpa o token e volta para o login.
- Na Topbar, `UserMenu` mostra o usuário e o botão **Salir**. Para o `admin`,
  aparece também **Usuarios**, que abre `UsersModal` (listar, cadastrar e remover usuários).

## Integração com a API

- **Catálogo:** a Topbar tem um seletor com os catálogos da API; a escolha
  fica em `localStorage` e, se o catálogo guardado deixar de existir, a tela
  usa o primeiro da lista.
- **Filtros e paginação no servidor:** busca, categoria, fijación, letra e
  página viram query params de `GET /catalogs/:id/items` (28 itens por página
  em ativos, 40 em não objeto). A busca espera 300 ms sem digitação antes de
  consultar; a normalização sem acento é feita pelo PostgreSQL (`unaccent`).
  Só a aba ativa faz requisições.
- **Selects e estatísticas** vêm de `GET /catalogs/:id/items/facets`.
- **Campos vazios:** a API devolve `null`, exibido como "—" (`displayValue`).
- **Carregamento:** na primeira carga aparece a mensagem de "carregando";
  depois, ao trocar filtro/página, o resultado anterior fica esmaecido até
  chegar o novo, sem piscar a tela.

## Internacionalização

A interface está disponível em **espanhol** (idioma original do catálogo,
padrão) e **português**. Os dados do catálogo em si (nomes de espécies,
categorias, critérios de fijação) permanecem em espanhol, pois refletem o
conteúdo real do inventário — apenas os textos de interface são traduzidos.

## Criar / editar ativos

O botão **"+ Nuevo activo"** (acima da grade de resultados) e o botão
**"Editar"** dentro da ficha de um ativo abrem o mesmo modal
(`AssetFormModal`), com validação dos campos obrigatórios (`especie`,
`categoria`, `fijacion`) e autocomplete (`<datalist>`) das categorias e
critérios de fijação do catálogo.

Ao salvar, o formulário chama `POST /catalogs/:id/items` ou
`PATCH /catalogs/:id/items/:itemId`. Em caso de sucesso a página atual e as
facets são recarregadas; em caso de erro (validação do backend, API fora do
ar) o modal continua aberto com a mensagem de erro. Suplementos vazio é
enviado como `null`.

## Estilos: SCSS + BEM, mobile-first

Cada componente tem seu próprio arquivo `Componente.module.scss` (CSS
Modules + Sass), com um único bloco BEM por arquivo:

```scss
.asset-card {
  // bloco
  &__title { ... }              // elemento: .asset-card__title
  &__meta-value--plate { ... }  // modificador: .asset-card__meta-value--plate
}
```

No componente, classes sem hífen usam acesso por ponto
(`styles.asset__title` não se aplica aqui pois o bloco tem hífen — use
`styles['asset-card__title']`); blocos sem hífen no nome (ex.: `tabs`,
`detail`) podem usar `styles.tabs__tab`.

Breakpoints ficam centralizados em `src/styles/_breakpoints.scss` como
mixins **mobile-first** (`@include from-xs/-sm/-md/-lg/-xl`, todos
`min-width`). O estilo base de cada arquivo é sempre o layout de telefone;
os `@include` acrescentam regras para telas maiores — nunca o contrário.
Breakpoints: `480 / 640 / 900 / 1200 / 1500px`. O topbar/toolbar viram
sticky só a partir de `900px`; grids de cartões vão de 1 coluna (telefone)
a 4 (desktop).
