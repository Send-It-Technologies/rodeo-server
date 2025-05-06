# SendIt Server

An HTTP server built with [Hono](https://hono.dev/) and deployment ready for Cloudflare Workers.

## Prerequisites

- [Bun](https://bun.sh) Runtime
- Node.js (v18 or later)
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
├── .dev.vars.example   # Example environment variables
├── migrate.ts          # Migration script
├── wrangler.toml       # Cloudflare Workers configuration
└── package.json
```

## Available Scripts

- `bun run dev` - Start development server with Wrangler
- `bun run deploy` - Deploy to Cloudflare Workers
