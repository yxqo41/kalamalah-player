import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

interface CacheEntry {
  html: string;
  etag: string;
  createdAt: number;
}

const memoryPrerenderCache = new Map<string, CacheEntry>();
const PRERENDER_CACHE_VERSION = 'v12';
const CACHE_DIR = join(process.cwd(), '.cache', 'prerender', PRERENDER_CACHE_VERSION);
let diskReady = false;

async function ensureDiskCacheDir(): Promise<void> {
  if (diskReady) return;
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    diskReady = true;
  } catch {
    // Ignore disk write issues in read-only environments
  }
}

function sanitizeKeyToFile(key: string): string {
  const safe = key.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^_+/, '') || 'index';
  return join(CACHE_DIR, `${safe}.html`);
}

function computeWeakEtag(html: string): string {
  const hash = Bun.hash(html).toString(36);
  return `W/"${hash}-${html.length.toString(36)}"`;
}

/**
 * Hybrid Server Prerender Cache:
 * - Serves pre-rendered immutable pages (Surahs, Juzs, Reciters, Mushaf pages, etc.) from RAM (<0.2ms) or Disk (.cache/prerender).
 * - If not yet prerendered, renders via `renderFn()`, stores in RAM + Disk, and returns with ETag + Cache-Control headers.
 */
export async function getOrPrerenderPage(
  routeKey: string,
  renderFn: () => Promise<string>,
  ttlMs = 1000 * 60 * 60 * 6
): Promise<{ html: string; etag: string; cacheHit: 'MEMORY' | 'DISK' | 'MISS' }> {
  const now = Date.now();
  const mem = memoryPrerenderCache.get(routeKey);
  if (mem && now - mem.createdAt < ttlMs) {
    return { html: mem.html, etag: mem.etag, cacheHit: 'MEMORY' };
  }

  await ensureDiskCacheDir();
  const filePath = sanitizeKeyToFile(routeKey);

  try {
    const diskHtml = await readFile(filePath, 'utf8');
    if (diskHtml && diskHtml.length > 100) {
      const etag = computeWeakEtag(diskHtml);
      memoryPrerenderCache.set(routeKey, { html: diskHtml, etag, createdAt: now });
      return { html: diskHtml, etag, cacheHit: 'DISK' };
    }
  } catch {
    // Disk cache miss
  }

  const html = await renderFn();
  const etag = computeWeakEtag(html);
  memoryPrerenderCache.set(routeKey, { html, etag, createdAt: now });

  // Persist asynchronously to disk
  writeFile(filePath, html, 'utf8').catch(() => {});

  return { html, etag, cacheHit: 'MISS' };
}
