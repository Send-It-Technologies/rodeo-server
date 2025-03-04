# Rodeo Server

An HTTP server built with [Hono](https://hono.dev/) with a postgres database integration using [Drizzle ORM](https://orm.drizzle.team/) and [Neon.tech](https://neon.tech/), and deployment ready for Cloudflare Workers.

## Prerequisites

- [Bun](https://bun.sh) Runtime
- Node.js (v18 or later)
- PostgreSQL database on [neon](https://neon.tech/)
- Cloudflare account (for deployment)

## Install

1. Clone the repository:

```bash
git clone https://github.com/Send-It-Technologies/rodeo-server.git
cd rodeo-server
```

2. Install dependencies:

```bash
bun install
```

3. Set up environment variables:
   - Copy `.dev.vars.example` to `.dev.vars`
   - Copy `wrangler.toml.example` to `wrangler.toml`

Add environment variables to both files. For example:

```env
DATABASE_URL=your_postgresql_connection_string
```

## Database

Write or update database schema in `/src/db/` and run the following to generate and push schema:

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

## Development

Run the following to start the development server. The server will start on `http://localhost:8787`.

```bash
bun run dev
```

## Deployment

This repo is configured for deployment to Cloudflare Workers:

```bash
bun run deploy
```

## Project Structure

```
hono-backend/
├── src/
│   ├── index.ts        # Main application entry
│   └── db/
│       └── schema.ts   # Database schema definitions
├── drizzle/            # Database migrations
├── .dev.vars.example   # Example environment variables
├── drizzle.config.ts   # Drizzle ORM configuration
├── migrate.ts          # Migration script
├── wrangler.toml       # Cloudflare Workers configuration
└── package.json
```

## Available Scripts

- `bun run dev` - Start development server with Wrangler
- `bun run deploy` - Deploy to Cloudflare Workers
- `npx drizzle-kit generate` - Generate database migrations
- `npx drizzle-kit push` - Create table(s)
