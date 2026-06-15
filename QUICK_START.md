# Quick Start

## Prerequisites

- Node.js 20+
- Docker & Docker Compose

## Development (recommended)

```bash
npm install
cp .env.example .env
npm run docker:up          # Postgres :5437, Redis :6382
npm run db:generate
npm run db:push
npm run db:seed
npm run dev                # Web :3000, API :4000
```

Open **http://localhost:3000**

## Production on this machine

```bash
npm run docker:prod:up     # Full stack in Docker
# or
npm run start:prod         # Build + run on host (:3000 / :4000)
```

## Verify

```bash
npm run smoke              # API + web (dev servers must be running)
npm run verify             # Build + smoke (starts prod web on :3099)
```

## Legacy `index.html`

The root `index.html` only redirects to the Next.js app. Use `npm run dev` or Docker instead of opening it directly.

See [README.md](./README.md) for API routes, keyboard shortcuts, and hybrid on-chain setup.
