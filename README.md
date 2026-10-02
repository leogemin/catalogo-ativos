# Catálogo de Ativos — Ciclo Consultoria

Monorepo da ferramenta de consulta de catálogos de ativos para inventário.

```
frontend/    App React + TypeScript (Vite), consumindo a API
backend/     API NestJS + TypeORM + PostgreSQL (CRUD de catálogos/itens, import/export CSV)
docker/      Scripts de inicialização do PostgreSQL
reference/   Protótipo HTML original
CLAUDE.md    Contexto de design e funcionalidades do protótipo
```

## Subindo tudo localmente

```bash
docker compose up -d postgres

cd backend
cp .env.example .env
npm install
npm run migration:run && npm run seed
npm run start:dev          # http://localhost:3000/api · Swagger em /api/docs

cd ../frontend
npm install
npm run dev                # http://localhost:5173
```

Detalhes em [`backend/README.md`](backend/README.md) e [`frontend/README.md`](frontend/README.md).
Em dev, o Vite faz proxy de `/api` para o backend na porta 3000.
