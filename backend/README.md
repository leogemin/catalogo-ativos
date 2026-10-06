# Catálogo de Ativos — API

API REST em NestJS 12 + TypeORM 1 + PostgreSQL para gerenciar **catálogos** e
seus **itens** (ativos e "bienes no objeto"), com importação e exportação CSV.

## Rodando localmente

Pré-requisitos: Node.js ≥ 22.12 e Docker (para o PostgreSQL).

```bash
# na raiz do monorepo
docker compose up -d postgres

cd backend
cp .env.example .env
npm install
npm run migration:run   # cria o schema
npm run seed            # opcional: importa o catálogo original (936 ativos + 72 não objeto)
npm run start:dev
```

- Na primeira subida, o usuário `admin` é criado com a senha de `ADMIN_PASSWORD`.
- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/api/docs` (JSON em `/api/docs-json`)

> Se `npm install` falhar com `Cannot read properties of null (reading 'edgesOut')`,
> é um bug do npm 10 na resolução de peer deps; use `npx npm@11 install`.

## Scripts

| Script | O que faz |
| --- | --- |
| `start:dev` | API com watch |
| `build` / `start:prod` | Compila para `dist/` e roda |
| `migration:run` / `migration:revert` / `migration:show` | Migrations (via `dist/database/data-source.js`) |
| `migration:generate -- src/database/migrations/Nome` | Gera migration a partir das entidades (registre-a em `src/database/migrations/index.ts`) |
| `seed [-- arquivo.csv "Nome"]` | Cria um catálogo a partir de um CSV (padrão: `seeds/catalogo-maestro.csv`); idempotente |
| `test` | Testes unitários (Vitest) |
| `test:e2e` | Testes e2e contra PostgreSQL real, no banco `DB_NAME_TEST` (padrão `catalogo_ativos_test`, já criado pelo docker-compose) |
| `lint` / `format` | oxlint / Prettier |

## Arquitetura

Módulos: `catalogs`, `users` (entidade, repositório, hash de senha, CRUD do admin)
e `auth` (login, JWT, guard global, criação do admin). Camadas dentro de `src/modules/catalogs/`, com dependências apontando sempre para dentro:

```
presentation/    controllers, DTOs (validação + Swagger), mapeadores de resposta, pipe de CSV
      ↓
application/     casos de uso: CatalogsService, CatalogItemsService,
                 CatalogTransferService (import/export), CatalogCsvService (parse/serialize)
      ↓
domain/          entidades, enum de tipo, regras de validação de item,
                 contratos de repositório (classes abstratas)
      ↑
infrastructure/  implementações TypeORM dos repositórios
```

**Injeção de dependências:** os serviços dependem de `CatalogRepository` e
`CatalogItemRepository`, classes abstratas do domínio que servem de token no
container do Nest. O `CatalogsModule` liga cada uma à implementação TypeORM
(`{ provide: CatalogRepository, useClass: TypeOrmCatalogRepository }`), e os
testes unitários trocam por dublês pelo mesmo token.

**Erros:** a aplicação lança erros de domínio (`NotFoundError`, `ConflictError`,
`BusinessRuleError`, `InvalidInputError`) sem conhecer HTTP. O
`ApiExceptionFilter` converte esses erros, as exceções do Nest e as violações
do Postgres num formato único:

```json
{ "statusCode": 422, "code": "BUSINESS_RULE_VIOLATION", "message": "...", "details": { } }
```

## Autenticação

- Cada usuário tem só `username` e senha. O usuário **`admin`** é o único que
  pode listar, cadastrar e remover usuários; os demais apenas fazem login e usam a API.
- `POST /auth/login` devolve um JWT (HS256, validade `JWT_EXPIRES_IN` segundos).
  **Todas as outras rotas** exigem `Authorization: Bearer <token>` (guard global
  `AuthGuard`; rotas abertas usam `@Public()`, rotas do admin `@AdminOnly()`).
- A cada requisição o guard confirma que o usuário ainda existe: removido = 401
  mesmo com token válido.
- Senhas com `scrypt` (`node:crypto`, salt aleatório). Usernames são gravados em
  minúsculas (`Maria` e `maria` são o mesmo usuário).
- `admin` é criado na subida da API se não existir e `ADMIN_PASSWORD` estiver
  definida (`AdminBootstrapService`). Ele não pode ser removido.
- Erros: `401 UNAUTHORIZED` (sem token, token inválido/expirado, credenciais
  erradas) e `403 FORBIDDEN` (usuário comum em rota do admin).
- No Swagger, use **Authorize** com o token de `POST /auth/login`.

| Variável | Descrição |
| --- | --- |
| `JWT_SECRET` | Obrigatória (também na CLI de migrations), mín. 32 caracteres |
| `JWT_EXPIRES_IN` | Validade do token em segundos (padrão `28800` = 8 h) |
| `ADMIN_PASSWORD` | Senha inicial do `admin` (mín. 8); só usada se ele ainda não existir |

## Modelo de dados

- `catalogs`: `id` (uuid), `name` (único, sem diferenciar maiúsculas), `description`, timestamps.
- `catalog_items`: `id`, `catalog_id` (FK com `ON DELETE CASCADE`), `type`
  (`ASSET` | `NON_OBJECT`), `especie`, `categoria`, `suplementos`, `fijacion`, timestamps.
  - `ASSET` exige `categoria` (validado na aplicação e por `CHECK` no banco).
  - O "—" do dataset original vira `NULL`.
  - `especie` **não** é única: o dataset tem `ESPECTROMETRO` em duas categorias.
- `users`: `id`, `username` (único, minúsculo), `password_hash`, timestamps.
- Extensão `unaccent` para busca sem acento; `gen_random_uuid()` nativo (PG 13+).

## Endpoints

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/auth/login` | **Pública.** `{ username, password }` → `{ accessToken, tokenType, expiresIn, user }` |
| GET | `/auth/me` | Usuário do token (`id`, `username`, `isAdmin`) |
| GET / POST | `/users` | **Admin.** Lista / cadastra usuário (`{ username, password }`) |
| DELETE | `/users/:id` | **Admin.** Remove usuário (exceto o `admin`) |
| GET | `/catalogs?search=&page=&pageSize=` | Lista catálogos com `itemCounts` |
| POST | `/catalogs` | Cria catálogo vazio |
| GET / PATCH / DELETE | `/catalogs/:id` | Detalha / atualiza / remove (itens em cascata) |
| POST | `/catalogs/import` | Multipart: `file` + `name` [+ `description`, `skipInvalid`] → cria catálogo novo |
| POST | `/catalogs/:id/import?mode=append\|replace&skipInvalid=` | Multipart `file` → importa em catálogo existente |
| GET | `/catalogs/:id/export?type=&delimiter=comma\|semicolon` | Download CSV |
| GET | `/catalogs/:id/items` | Filtros: `type`, `search`, `categoria`, `fijacion`, `letter`, `sortBy`, `order`, paginação |
| GET | `/catalogs/:id/items/facets` | Categorias e fijaciones distintas + totais por tipo |
| POST | `/catalogs/:id/items` | Cria item |
| GET / PATCH / DELETE | `/catalogs/:id/items/:itemId` | Detalha / atualiza parcialmente / remove item |

`pageSize` vai até 500 (padrão 50). Na busca, `search` ignora acentos e
maiúsculas em `especie + categoria + suplementos + fijacion`, como no frontend.

## Formato CSV

```csv
tipo,categoria,especie,suplementos,fijacion
ASSET,MUEBLES,ACONDICIONADOR DE AIRE,MCA/MOD/POTENCIA EN BTU/H,A CERCA DE LA PLACA DEL FABRICANTE
NON_OBJECT,,ALFOMBRA - BIEN NO OBJETO,,
```

- Delimitador `,` ou `;` (detectado pelo cabeçalho); UTF-8, com ou sem BOM.
- Só `especie` é obrigatória no cabeçalho. Colunas em qualquer ordem, aceitando
  nomes em es/pt/en (`Espécie`, `Fixação da placa`, `Categoría`...). Colunas desconhecidas são ignoradas.
- `tipo` vazio = `ASSET`; aceita `ASSET`/`ativo`/`activo` e `NON_OBJECT`/`bien no objeto`/`bem não objeto`.
- Limites: 5 MB (`CSV_MAX_FILE_SIZE_MB`) e 20.000 linhas.
- **Por padrão a importação é atômica:** qualquer linha inválida devolve 422
  com a lista de linhas e nada é gravado. Com `skipInvalid=true`, as inválidas são
  puladas e aparecem no relatório. Um arquivo sem nenhuma linha válida sempre é
  rejeitado (evita um `replace` esvaziar o catálogo).
- A exportação gera o mesmo formato, com BOM, então reimporta sem perdas.
