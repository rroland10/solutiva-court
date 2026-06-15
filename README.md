# Solutiva Court - Next Generation Justice

A decentralized dispute resolution platform built with a modern full-stack TypeScript architecture.

**Repository:** [github.com/rroland10/solutiva-court](https://github.com/rroland10/solutiva-court)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | **Next.js 15**, **React 19**, **Tailwind CSS**, **TypeScript** |
| Backend | **Express.js**, **Node.js**, **TypeScript** |
| Database | **PostgreSQL** via **Prisma** ORM |
| Queue | **BullMQ** with **Redis** |
| AI | OpenAI-compatible API for dispute analysis |
| SEO | Next.js Metadata API, `sitemap.xml`, `robots.txt` |
| Indexing | **Google Indexing API** (optional) |
| Infrastructure | **Docker**, **Docker Compose** |
| On-chain (Sepolia / Base) | **AVF ERC-223**, collateral escrow, outcome anchoring, wallet auth |
| Off-chain | Disputes, jury votes, AI, activity feed, SSE, SEO |

## Hybrid architecture (Sepolia + optional Base)

Default testnet targets **Ethereum Sepolia** with the official [EthereumCommonwealth/AVF_Token](https://github.com/EthereumCommonwealth/AVF_Token) (ERC-223):

- Sepolia: [0x45D39B5C…](https://sepolia.etherscan.io/address/0x45D39B5C90685AF368EecbacB6EB7bbA6f9B1936)
- Source fix ([937de59](https://github.com/EthereumCommonwealth/AVF_Token/commit/937de593aeeab167b1d8bec85922c2b7a5355041)): initializes `_totalSupply` in constructor (required for `mint` cap checks)
- Deposits use `transfer(escrow, amount, data)` → escrow implements `tokenReceived` (not `tokenFallback`)

| On-chain | Off-chain (this stack) |
|----------|------------------------|
| Wallet identity | Dispute text, search, filters |
| AVF ERC-223 token | AI summaries & suggestions |
| Collateral escrow | Activity feed, SSE, SEO |
| Outcome anchoring | Jury UX, fast vote tallying |
| Optional jury mints | Vote aggregation in PostgreSQL |

Deploy escrow + registry against the existing Sepolia AVF token:

```bash
AVF_TOKEN_ADDRESS=0x45D39B5C90685AF368EecbacB6EB7bbA6f9B1936 \
DEPLOYER_PRIVATE_KEY=0x... \
npm run deploy:sepolia --workspace=@solutiva/contracts
```

**Note:** On-chain jury mints require `AVF_REWARDS_ON_CHAIN=true` and a relayer wallet that owns `AVF_Token`. Otherwise rewards stay off-chain (PostgreSQL cache) while balances can still sync from Sepolia.

## Project Structure

```
solutiva-court/
├── apps/
│   ├── web/          # Next.js frontend (React + Tailwind)
│   └── api/          # Express.js API server
├── packages/
│   └── contracts/    # AVF, DisputeEscrow, OutcomeRegistry (Base L2)
├── prisma/           # PostgreSQL schema (Prisma)
├── docker-compose.yml
└── package.json      # npm workspaces monorepo
```

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose

### 1. Start infrastructure

```bash
npm run docker:up
```

This starts PostgreSQL (port **5437**) and Redis (port **6382**). If those ports are in use, update `docker-compose.yml` and `.env` accordingly.

### 2. Configure environment

```bash
cp .env.example .env
```

### 3. Install dependencies

```bash
npm install
```

### 4. Set up database

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

For an existing database that still has the legacy `drtBalance` column, rename it once:

```bash
docker exec solutiva-postgres psql -U solutiva -d solutiva_court -c 'ALTER TABLE "User" RENAME COLUMN "drtBalance" TO "avfBalance";'
```

### 5. Run development servers

```bash
npm run dev
```

If the web app shows module errors after upgrades, clear the Next.js cache:

```bash
npm run dev:clean
```

- **Web**: http://localhost:3000
- **API**: http://localhost:4000

Use path routes to deep-link tabs and cases:

- `http://localhost:3000/disputes`
- `http://localhost:3000/disputes/<dispute-id>`

### Disputes list filters (URL query params)

Share or bookmark filtered views:

| Param | Values | Example |
|-------|--------|---------|
| `status` | `ACTIVE`, `PENDING`, `RESOLVED`, `CANCELLED` | `/disputes?status=ACTIVE` |
| `mine` | `1` (cases you filed) | `/disputes?mine=1` |
| `category` | `CONTRACT`, `PAYMENT`, `SERVICE`, `INTELLECTUAL`, `EMPLOYMENT` | `/disputes?category=CONTRACT` |
| `q` | search text | `/disputes?q=payment` |

Combine params: `/disputes?status=PENDING&mine=1`

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| `1` | Dashboard |
| `2` | Disputes |
| `3` | Jury Pool |
| `4` | Profile |
| `v` | Vote now (when a jury vote is pending) |
| `p` | Review pending case (when activation is needed) |
| `n` | New dispute (Dashboard or Disputes page) |
| `m` | Toggle my cases filter (Disputes page) |
| `f` | Clear all filters (Disputes page) |
| `a` | Filter active disputes (Disputes page) |
| `s` | Filter my pending cases (Disputes page) |
| `/` | Focus search (Disputes page) |
| `t` | Toggle light / dark theme |
| `?` | Show shortcuts help |

### AVF rewards

| Action | Reward |
|--------|--------|
| First vote on a case | +10 AVF, +1 trust score (max 100) |
| Case resolved (per voter) | +25 AVF |
| Majority-side voter bonus | +5 AVF (when outcome is not a tie) |

Resolved cases store a **jury outcome** (`plaintiff`, `defendant`, or `tie`) based on vote majority.

**Status transitions** (plaintiff only): `PENDING` → `ACTIVE` | `CANCELLED`; `ACTIVE` → `RESOLVED` | `CANCELLED`. Resolved and cancelled cases cannot be reopened.

### Smoke test

With the API running:

```bash
npm run smoke        # API + web
npm run smoke:api    # API health + endpoints
npm run smoke:web    # Web routes render (requires dev server)
npm run verify       # Build + smoke (starts production web on :3099 for web tests)
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/disputes/counts` | Dispute counts by status and category (optional `?plaintiffId=`) |
| GET | `/api/disputes` | List disputes (optional `?status=`, `?q=`, `?category=`, `?plaintiffId=`, `?userId=` for per-case `userVote`) |
| GET | `/api/disputes/:id` | Dispute detail with votes (optional `?userId=` for `userVote`) |
| GET | `/api/disputes/active/voting` | Active case for jury voting (optional `?userId=`) |
| POST | `/api/disputes/:id/analyze` | Run AI analysis on a dispute |
| POST | `/api/disputes/:id/suggest-resolution` | AI resolution suggestion from jury votes |
| POST | `/api/disputes/:id/vote` | Submit jury vote (jury members only, active disputes) |
| PATCH | `/api/disputes/:id/status` | Update dispute status (requires `userId` matching plaintiff) |
| POST | `/api/disputes` | Create dispute (optional `status: PENDING`; queues AI + SEO jobs) |
| GET | `/api/stats` | Platform statistics |
| GET | `/api/stats/activities` | Recent platform activity |
| GET | `/api/stats/activities/stream` | SSE stream of platform activity (10s refresh) |
| GET | `/api/stats/queues` | BullMQ job counts (AI + SEO) |
| GET | `/api/users/demo` | Demo user profile |
| GET | `/api/users/:id/stats` | User participation stats |
| GET | `/api/users/:id/history` | Recent disputes filed and votes cast |
| PATCH | `/api/users/:id/jury` | Toggle jury pool membership |
| PATCH | `/api/users/:id` | Update user profile |
| GET | `/api/chain/config` | Base L2 hybrid config & contract addresses |
| GET | `/api/chain/health` | Base RPC / contract readiness |
| GET | `/api/chain/balance/:wallet` | AVF balance from Base (when enabled) |
| POST | `/api/ai/analyze` | AI dispute analysis |
| POST | `/api/ai/index-url` | Google Indexing API |

## Background Jobs (BullMQ)

- **dispute-processing**: AI analysis of new disputes
- **seo-indexing**: Google Indexing API notifications for new dispute pages

## Theme

The web app supports **light**, **dark**, and **system** appearance. Use the header toggle, Profile → Appearance, or press **`t`**. Preference is stored in `localStorage` (`solutiva-theme`) and applied before first paint to avoid flash.

## Docker

### Development (Postgres + Redis only)

```bash
npm run docker:up             # PostgreSQL :5437, Redis :6382
npm run docker:down           # Stop services
```

### Production (full stack in containers)

Builds and runs API + web + Postgres + Redis. Stop any host servers on **:3000** and **:4000** first.

```bash
npm run docker:prod:up        # Build images, start stack, seed DB
npm run docker:prod:logs      # Follow logs
npm run docker:prod:down      # Tear down stack
```

- **Web:** http://localhost:3000  
- **API:** http://localhost:4000/health  

### Host production (no Docker for app tier)

```bash
npm run start:prod            # build + start API and web on :4000 / :3000
npm run verify                # build + smoke tests (web on :3099)
```

## Cloud deploy

**Docker (VPS / Railway / Fly.io):** use `docker-compose.prod.yml` with env from `.env.production.example`. Set public `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_API_URL` **before building the web image** — Next.js embeds those at build time.

```bash
cp .env.production.example .env
# edit .env with your public URLs and secrets
npm run docker:prod:up
```

**Render:** connect the repo and apply [`render.yaml`](./render.yaml) as a Blueprint. After the API deploys, set `NEXT_PUBLIC_API_URL` on **solutiva-web** to the API service URL (e.g. `https://solutiva-api.onrender.com`), then redeploy web.

**Split hosting:** deploy `apps/web` to Vercel and `apps/api` to any Node host with Postgres + Redis. Set the same `NEXT_PUBLIC_*` vars in Vercel project settings at build time.

**CI:** GitHub Actions runs build + smoke on every push to `main` (see `.github/workflows/ci.yml`). Dependabot opens weekly npm PRs (see `.github/dependabot.yml`).

## License

MIT
