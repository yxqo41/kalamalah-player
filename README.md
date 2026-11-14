# Kalamalah

Source code for **[kalamalah.com](https://kalamalah.com)** — a Holy Quran web reader and audio player built with TypeScript, Bun, and Hono.

## Features

- **Word-by-Word & Ayah Audio Sync**: Precision timestamp synchronization across reciters with a persistent player bar, speed controls, repeat modes, and a fullscreen reading view powered by GSAP and a WebGL dynamic background (`src/client/dybg.js`).
- **Mushaf & Juz Views**: Full 604-page Mushaf layout (`/mushaf-1` to `/mushaf-604`) and 30 Juz views (`/juz-1` to `/juz-30`).
- **Study & Reading Tools**: Inline and modal Tafseer books (`/tafseer-:id`, `/t-:surah-:tafseer-:ayah`), multilingual translations (`/languages`, `/language-:code`), Tajweed colorization & rules guide (`/tajweed`), diacritics filtering, memorization hide/reveal mode, word-by-word meanings, and local bookmarks.
- **Islamic Resources & AI Assistant**: Duas & Adhkar (`/duas`), 99 Names of Allah (`/names`), Reciters directory (`/reciters`, `/reciter-:slug`), and a Quran AI assistant (`/ai`).
- **Hybrid SSR + Static Export**: Runs as a live Hono SSR server with disk/memory prerender caching, or exports a complete static site (`dist/`) with `CNAME` (`kalamalah.com`) for GitHub Pages.

## Tech Stack

- **Runtime & Bundler**: [Bun](https://bun.sh/)
- **Server Framework**: [Hono](https://hono.dev/)
- **Language**: TypeScript (strict mode)
- **Client Motion**: [GSAP](https://gsap.com/) + custom WebGL mesh backdrop
- **Package Manager**: `pnpm` (or `bun install` in CI/Docker)

## Project Structure

```text
├── .github/workflows/   # GitHub Pages static build & deploy workflow
├── public/              # Static CSS, fonts, icons, images, favicons, bundled JS
├── src/
│   ├── client/          # Browser app, audio player, i18n, reading tools, static router
│   └── server/          # Hono SSR server, API/timings services, prerender cache, static export
│       └── views/       # HTML view renderers
├── Dockerfile           # Container image running the Bun + Hono SSR server
├── package.json
└── tsconfig.json
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.x+)
- [pnpm](https://pnpm.io/) (optional, for local package management)

### Install & Run Locally

```bash
bun install
bun run build:client
bun run dev
```

The server starts on `http://localhost:3000` (override with `PORT`).

### Available Scripts

| Script | Description |
| --- | --- |
| `bun run dev` | Start the Hono SSR server with file watching |
| `bun run start` | Start the SSR server without watch mode |
| `bun run build:client` | Bundle and minify `src/client/app.ts` into `public/js/app.js` |
| `bun run build:static` | Build client bundle and export static HTML + `CNAME` to `dist/` |
| `bun run prerender` | Pre-warm the server prerender cache |
| `bunx tsc --noEmit` | Type-check all server and client TypeScript |

## Deployment

### GitHub Pages (Static)

Pushes to `main` or `master` trigger `.github/workflows/deploy-pages.yml`, which type-checks the project, runs `STATIC_FULL=1 bun run build:static`, generates `dist/CNAME` set to `kalamalah.com` (overridable via `CUSTOM_DOMAIN`), and deploys `./dist` to GitHub Pages.

### Docker (SSR Server)

```bash
docker build -t kalamalah-player .
docker run -p 3000:3000 kalamalah-player
```

## License

See [LICENSE](./LICENSE).
