# Catálogo de Activos — Ciclo Consultoría

App React + TypeScript (Vite) para consulta do catálogo de activos e bienes
no objeto. Ver `CLAUDE.md` para o contexto completo de design e
funcionalidades portados do protótipo original (`reference/legacy-prototype.html`).

## Rodando localmente

```bash
npm install
npm run dev
```

```bash
npm run build    # build de produção (tsc -b && vite build)
npm run preview  # serve o build de produção localmente
npm run lint      # oxlint
```

## Estrutura

- `src/data/` — dados mockados do catálogo (`assets.json`, `nonObjects.json`),
  extraídos do protótipo original.
- `src/services/assetService.ts` — camada de acesso a dados. Hoje serve os
  mocks simulando latência de rede; é o único lugar a alterar quando o
  backend real existir (basta trocar o corpo das funções por chamadas
  `fetch`/`axios` — a assinatura `Promise<Asset[]>` / `Promise<string[]>`
  já é o contrato esperado pelos hooks).
- `src/hooks/` — `useAssets`/`useNonObjectItems` (consumo assíncrono dos
  dados), `useAssetOptions` (opções de filtro derivadas),
  `useFilteredCatalog` (filtragem), `usePagination` e `useAssetMutations`
  (criar/editar, ver seção abaixo).
- `src/components/` — componentes de UI, organizados por bloco da tela
  (Topbar, HeroSection, Toolbar, AssetGrid, AssetList, NonObjectGrid,
  Pagination, AssetDetailModal, AssetFormModal, common/).
- `src/pages/CatalogPage.tsx` — orquestra estado e composição da tela.
- `src/i18n/` — configuração do `i18next`/`react-i18next` e os dicionários
  `locales/es.json` (padrão) e `locales/pt.json`. O idioma é selecionável
  pela UI (Topbar) e persistido em `localStorage`.

## Internacionalização

A interface está disponível em **espanhol** (idioma original do catálogo,
padrão) e **português**. Os dados do catálogo em si (nomes de espécies,
categorias, critérios de fijação) permanecem em espanhol, pois refletem o
conteúdo real do inventário — apenas os textos de interface são traduzidos.

## Criar / editar ativos (sem backend ainda)

O botão **"+ Novo activo"** (acima da grade de resultados) e o botão
**"Editar"** dentro da ficha de um ativo abrem o mesmo modal
(`AssetFormModal`), com validação dos campos obrigatórios (`especie`,
`categoria`, `fijacion`) e autocomplete (`<datalist>`) das categorias e
critérios de fijação já existentes no catálogo.

Ao salvar, o formulário chama `createAsset`/`updateAsset` em
`src/services/assetService.ts` — hoje mocks que só geram um `id`
(`crypto.randomUUID()`) e devolvem os dados depois de uma latência
simulada. O resultado é aplicado por cima da lista buscada via `useMemo`
em `CatalogPage` (sem mutar o array original), então a UI reflete a
alteração imediatamente. **Não há persistência real**: um reload do
navegador volta ao dataset original, já que não existe backend conectado.
Quando ele existir, basta reescrever o corpo de `createAsset`/`updateAsset`
para chamadas HTTP reais — o hook `useAssetMutations` e o componente do
formulário não precisam mudar.

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
