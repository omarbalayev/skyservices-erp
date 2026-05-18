# SkyServices ERP

ERP application for SkyServices Group MMC — equipment-rental operations: CRM, fleet, garage operations, warehouse/inventory, finance.

- **Production:** [https://erp.skyservices.az](https://erp.skyservices.az)
- **Stack:** Next.js 14 (App Router) · TypeScript · Prisma · PostgreSQL 16 · NextAuth v5 · Tailwind · shadcn-style UI
- **Spec:** see `SkyServices-ERP-Technical.md` and `SkyServices-ERP-BA-Analysis.md` (in the parent `WebApp/` folder).

## Local development

Prereqs: Node 20, PostgreSQL 16.

```bash
npm install
cp .env.example .env       # then edit DATABASE_URL + AUTH_SECRET
npx prisma migrate dev
npm run db:seed            # seeds an initial admin user
npm run dev                # http://localhost:3002
```

## Project layout

```
src/
├── app/
│   ├── (auth)/login/       — login page
│   ├── (app)/              — authenticated app shell (sidebar + routes)
│   │   └── dashboard/
│   └── api/
│       ├── auth/[...nextauth]/    — NextAuth handler
│       └── health/                — liveness probe
├── lib/
│   ├── auth.ts             — NextAuth config
│   ├── db.ts               — Prisma client singleton
│   ├── audit.ts            — audit-log helper
│   └── password.ts         — bcrypt helpers
└── components/ui/          — base UI primitives (button, input, label, card)
prisma/
├── schema.prisma           — DB schema
└── seed.ts                 — seed script
```

## Modules (planned — building incrementally)

| Phase | Module | Status |
|------|--------|--------|
| 0    | Foundations (auth, user/role, audit, base shell) | **in progress** |
| 1    | CRM (Client, MSA, Addendum, Lead, Request, Offer) | pending |
| 2    | Fleet + Garage operations | pending |
| 3    | Finance (Invoicing, Payments, WorksAct, e-Qaimə) | pending |
| 4    | Warehouse / Inventory | pending |
| 5    | CMS integration (webhook) | pending |
| 6    | Reports & dashboards | pending |

## Deploy

The server is provisioned via `server-setup.sh` (run once on the Hetzner VPS). Application deployment is via `deploy.sh` or the GitHub Actions workflow in `.github/workflows/deploy.yml`.
