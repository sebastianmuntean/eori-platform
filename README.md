# EORI Platform

Multi-tenant parish and diocese administration platform for the Romanian Orthodox context. Manages registry, events, accounting, HR, pilgrimages, catechesis, parishioners, cemeteries, online forms, and administration across organizational tenants.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19
- **UI**: Tailwind CSS
- **Validation**: Zod
- **i18n**: next-intl — locales `ro` (default), `en`, `it`
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Custom cookie sessions + RBAC

## Project Structure

```
├── src/
│   ├── app/           # Next.js App Router (pages + API routes)
│   ├── components/    # UI and domain components
│   ├── lib/           # Auth, services, permissions, utilities
│   ├── hooks/         # React hooks
│   └── locales/       # Translation files (ro, en, it)
├── database/
│   ├── schema/        # Drizzle schema definitions
│   ├── migrations/    # SQL migration scripts (apply manually)
│   └── client.ts      # Database client
└── …
```

There is no root `lib/` or `drizzle/` — schema and client live under `database/`.

## Database Migrations

Migrations are SQL files in `database/migrations/`. Apply them manually with your PostgreSQL client (`psql`, pgAdmin, etc.).

- **Generate** after schema changes: `npm run db:generate`
- **Do not** use `drizzle-kit push` / `drizzle-kit migrate` to apply migrations

## Getting Started

1. `npm install`
2. Copy env config and set `DATABASE_URL` in `.env.local`
3. Apply pending SQL migrations from `database/migrations/`
4. `npm run dev` (default port **4058**)

## Key Domains

| Domain | Description |
|--------|-------------|
| Registry | General register, documents, register configurations |
| Events | Church events and related workflows |
| Accounting | Invoices, payments, contracts, products, stock |
| HR | Staff and HR notifications |
| Pilgrimages | Pilgrimage management |
| Catechesis | Classes, students, lessons |
| Parishioners | Parishioner records |
| Cemeteries | Cemetery management |
| Online forms | Public forms and mapping datasets |
| Administration | Users, clients, dioceses, deaneries, parishes |
