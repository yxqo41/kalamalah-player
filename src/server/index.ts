import { Hono } from 'hono';
import { join, resolve, sep } from 'node:path';
import {
  fetchJuzDetail,
  fetchMushafPage,
  fetchSurahDetail,
  getSurahMeta,
  TAFSEER_BOOKS,
  TRANSLATION_EDITIONS,
} from './kalamalah-api';
import { getOrPrerenderPage } from './prerender-cache';
import { findReciter, getReciterPhotoUrl, getSurahAudioUrl, RECITERS_CATALOG } from './reciters-catalog';
import { resolveSurahTimings } from './timings-service';
import { renderHomePage } from './views/home';
import {
  renderAiAssistantPage,
  renderAsmaUlHusnaPage,
  renderDuasPage,
} from './views/islamic-pages';
import {
  renderJuzPageView,
  renderLanguagesPage,
  renderTafseerPageView,
  renderTajweedGuidePage,
} from './views/juz-tafseer';
import { renderMushafPageView } from './views/mushaf';
import { buildRobotsTxt, buildSitemapXml } from './views/layout';
import { renderNotFoundPage } from './views/not-found';
import { renderReciterProfilePage, renderRecitersDirectoryPage } from './views/reciters';
import { renderSurahPage } from './views/surah';

const app = new Hono();
const PUBLIC_DIR = join(process.cwd(), 'public');
const PUBLIC_FONTS_DIR = join(process.cwd(), 'public', 'fonts');
const PUBLIC_ICONS_DIR = join(process.cwd(), 'public', 'icons');
const MAIN_FONTS_DIR = join(process.cwd(), 'main', 'fonts');
const MAIN_ICONS_DIR = join(process.cwd(), 'main', 'icons');

function resolveSafePublicPath(baseDir: string, reqPath: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(reqPath);
  } catch {
    return null;
  }
  const rel = decoded.replace(/^\/+/, '');
  if (!rel || rel.includes('..') || rel.includes('\\') || rel.includes('\0')) {
    return null;
  }
  const root = resolve(baseDir);
  const full = resolve(root, rel);
  if (!full.startsWith(root + sep)) {
    return null;
  }
  return full;
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
};

function getMimeType(filePath: string): string {
  const dot = filePath.lastIndexOf('.');
  const ext = dot !== -1 ? filePath.slice(dot).toLowerCase() : '';
  return MIME_TYPES[ext] ?? 'application/octet-stream';
}

// Helper to send prerendered HTML with ETag & Cache-Control
async function sendPrerendered(
  c: any,
  cacheKey: string,
  renderFn: () => Promise<string>
): Promise<Response> {
  const { html, etag, cacheHit } = await getOrPrerenderPage(cacheKey, renderFn);
  const ifNoneMatch = c.req.header('if-none-match');
  if (ifNoneMatch && ifNoneMatch === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        'X-Kalamalah-Prerender': cacheHit,
      },
    });
  }
  return c.html(html, 200, {
    ETag: etag,
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
    'X-Kalamalah-Prerender': cacheHit,
  });
}

// ============================================================================
// 1. STATIC ASSETS (/favicon/*, /images/*, /css/*, /js/*, /site.webmanifest)
// ============================================================================
app.get('/site.webmanifest', async () => {
  const file = Bun.file(join(PUBLIC_DIR, 'favicon', 'site.webmanifest'));
  return new Response(file, {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
});

app.get('/favicon/*', async (c) => {
  const safePath = resolveSafePublicPath(PUBLIC_DIR, c.req.path);
  if (!safePath) return c.notFound();
  const file = Bun.file(safePath);
  if (await file.exists()) {
    return new Response(file, {
      headers: {
        'Content-Type': getMimeType(safePath),
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }
  return c.notFound();
});

app.get('/images/*', async (c) => {
  const safePath = resolveSafePublicPath(PUBLIC_DIR, c.req.path);
  if (!safePath) return c.notFound();
  const file = Bun.file(safePath);
  if (await file.exists()) {
    return new Response(file, {
      headers: {
        'Content-Type': getMimeType(safePath),
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }
  return c.notFound();
});

app.get('/css/*', async (c) => {
  const safePath = resolveSafePublicPath(PUBLIC_DIR, c.req.path);
  if (!safePath) return c.notFound();
  const file = Bun.file(safePath);
  if (await file.exists()) {
    return new Response(file, {
      headers: {
        'Content-Type': 'text/css; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
  return c.notFound();
});

app.get('/js/*', async (c) => {
  const safePath = resolveSafePublicPath(PUBLIC_DIR, c.req.path);
  if (!safePath) return c.notFound();
  const file = Bun.file(safePath);
  if (await file.exists()) {
    return new Response(file, {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
  return c.notFound();
});

app.get('/fonts/*', async (c) => {
  let fileName = '';
  try {
    fileName = decodeURIComponent(c.req.path.replace(/^\/fonts\/+/, ''));
  } catch {
    return c.notFound();
  }
  if (!fileName || fileName.includes('..') || fileName.includes('/') || fileName.includes('\\') || fileName.includes('\0')) {
    return c.notFound();
  }
  const pubFile = Bun.file(join(PUBLIC_FONTS_DIR, fileName));
  if (await pubFile.exists()) {
    return new Response(pubFile, {
      headers: {
        'Content-Type': getMimeType(fileName),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }
  const mainFile = Bun.file(join(MAIN_FONTS_DIR, fileName));
  if (await mainFile.exists()) {
    return new Response(mainFile, {
      headers: {
        'Content-Type': getMimeType(fileName),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }
  return c.notFound();
});

app.get('/icons/*', async (c) => {
  let fileName = '';
  try {
    fileName = decodeURIComponent(c.req.path.replace(/^\/icons\/+/, ''));
  } catch {
    return c.notFound();
  }
  if (!fileName || fileName.includes('..') || fileName.includes('/') || fileName.includes('\\') || fileName.includes('\0')) {
    return c.notFound();
  }
  const pubFile = Bun.file(join(PUBLIC_ICONS_DIR, fileName));
  if (await pubFile.exists()) {
    return new Response(pubFile, {
      headers: {
        'Content-Type': getMimeType(fileName),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }
  const fallbackFile = Bun.file(join(MAIN_ICONS_DIR, fileName));
  if (await fallbackFile.exists()) {
    return new Response(fallbackFile, {
      headers: {
        'Content-Type': getMimeType(fileName),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }
  return c.notFound();
});

app.get('/api/reciter-avatar/:slug', async (c) => {
  const slug = c.req.param('slug').trim();
  const reciter = RECITERS_CATALOG.find(
    (r) => r.slug === slug || r.kalamalahSlug === slug || String(r.id) === slug
  );
  const targetUrl = reciter
    ? getReciterPhotoUrl(reciter)
    : `https://api.kalamalah.com/api/reciter-profile/${encodeURIComponent(slug)}`;
  try {
    const res = await fetch(targetUrl, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const ct = res.headers.get('content-type') || 'image/jpeg';
      const buf = await res.arrayBuffer();
      return new Response(buf, {
        headers: {
          'Content-Type': ct,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }
  } catch {}
  const fallbackFile = Bun.file(join(PUBLIC_DIR, 'images', 'round-logo.png'));
  return new Response(fallbackFile, {
    headers: {
      'Content-Type': 'image/png',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

// ============================================================================
// 2. LIVE JSON API ENDPOINTS (Audio Timings, Surah Data, Tafseer, Reciters)
// ============================================================================
app.get('/api/reciters', (c) => {
  return c.json({ ok: true, reciters: RECITERS_CATALOG });
});

app.get('/api/timings/:reciter/:surah', async (c) => {
  const reciterParam = c.req.param('reciter');
  const surahNum = Number(c.req.param('surah') || 1);
  const timings = await resolveSurahTimings(reciterParam, surahNum);
  return c.json(timings, 200, {
    'Cache-Control': 'public, max-age=86400',
  });
});

app.get('/api/surah/:id', async (c) => {
  const surahId = Number(c.req.param('id') || 1);
  const transEdition = c.req.query('translation') || 'en.sahih';
  const tafEdition = c.req.query('tafseer') || 'ar.muyassar';
  const detail = await fetchSurahDetail(surahId, transEdition, tafEdition);
  const transMeta =
    TRANSLATION_EDITIONS.find((e) => e.editionId === transEdition || e.code === transEdition) ??
    TRANSLATION_EDITIONS[0]!;
  const tafMeta =
    TAFSEER_BOOKS.find((b) => b.editionId === tafEdition || String(b.id) === tafEdition) ??
    TAFSEER_BOOKS[0]!;
  return c.json({
    ok: true,
    meta: detail.meta,
    translationEdition: transMeta.editionId,
    translationName: transMeta.languageNameAr,
    translationDir: transMeta.dir,
    tafseerEdition: tafMeta.editionId,
    tafseerNameAr: tafMeta.nameAr,
    tafseerBookId: tafMeta.id,
    ayahs: detail.ayahs.map((a) => ({
      n: a.numberInSurah,
      text: a.text,
      tr: a.translationText ?? '',
      taf: a.tafseerText ?? '',
      p: a.page,
      j: a.juz,
    })),
  });
});

app.get('/api/download/:reciter/:surah', async (c) => {
  const reciterParam = c.req.param('reciter');
  const surahNum = Math.max(1, Math.min(114, Number(c.req.param('surah') || 1)));
  const reciter = findReciter(reciterParam);
  const surahMeta = getSurahMeta(surahNum);
  const timings = await resolveSurahTimings(reciter.slug, surahNum).catch(() => null);
  const audioUrl = timings?.audioUrl || getSurahAudioUrl(reciter, surahNum);
  const padded = String(surahNum).padStart(3, '0');
  const safeFileName = `Kalamalah-${padded}-${surahMeta.nameEn.replace(/[^a-zA-Z0-9_-]/g, '')}-${reciter.slug}.mp3`;

  try {
    const upstream = await fetch(audioUrl, {
      headers: { 'User-Agent': 'KalamalahPlayer/1.0' },
      signal: AbortSignal.timeout(25000),
    });
    if (upstream.ok && upstream.body) {
      return new Response(upstream.body, {
        status: 200,
        headers: {
          'Content-Type': upstream.headers.get('content-type') || 'audio/mpeg',
          'Content-Disposition': `attachment; filename="${safeFileName}"`,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }
  } catch {}
  return c.redirect(audioUrl, 302);
});

const N8N_AI_WEBHOOK_URL =
  'https://n8n.srv787268.hstgr.cloud/webhook/0eaacdaa-e724-4565-b3b3-21b7f92a6059/chat';

app.post('/api/ai-chat', async (c) => {
  try {
    const body = (await c.req.json().catch(() => ({}))) as {
      chatInput?: string;
      message?: string;
      sessionId?: string;
    };
    const chatInput = String(body.chatInput || body.message || '').trim().slice(0, 4000);
    const sessionId = String(body.sessionId || 'kalamalah-web-session').trim().slice(0, 128);
    if (!chatInput) {
      return c.json({ ok: false, error: 'يرجى كتابة سؤالك أولاً.' }, 400);
    }

    const res = await fetch(N8N_AI_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*',
      },
      body: JSON.stringify({
        action: 'sendMessage',
        sessionId,
        chatInput,
      }),
      signal: AbortSignal.timeout(25000),
    });

    const rawText = await res.text();
    let reply = '';

    // Handle ndjson streaming formats (e.g. {"type":"begin"}...{"type":"item","content":"..."}...{"type":"end"})
    if (rawText.includes('{"type":"') && rawText.includes('"content":')) {
      const lines = rawText.split('\n');
      let combined = '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const chunk = JSON.parse(trimmed);
          if (typeof chunk.content === 'string') {
            combined += chunk.content;
          } else if (typeof chunk.output === 'string') {
            combined += chunk.output;
          } else if (typeof chunk.reply === 'string') {
            combined += chunk.reply;
          }
        } catch {}
      }
      if (combined.trim()) {
        reply = combined.trim();
      }
    }

    if (!reply) {
      try {
        const parsed = JSON.parse(rawText);
        const item = Array.isArray(parsed) ? parsed[0] : parsed;
        reply =
          item?.output ||
          item?.reply ||
          item?.text ||
          item?.message ||
          item?.response ||
          (typeof item === 'string' ? item : '');
      } catch {
        reply = rawText.trim();
      }
    }

    // If reply itself is still JSON-encoded or ndjson string, parse it again
    if (typeof reply === 'string' && reply.includes('{"type":"') && reply.includes('"content":')) {
      const lines = reply.split('\n');
      let nestedCombined = '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const chunk = JSON.parse(trimmed);
          if (typeof chunk.content === 'string') {
            nestedCombined += chunk.content;
          }
        } catch {}
      }
      if (nestedCombined.trim()) {
        reply = nestedCombined.trim();
      }
    }

    if (!reply) {
      reply = 'بارك الله فيك. لم أتمكن من استخراج الإجابة حالياً، يرجى إعادة المحاولة بعد قليل.';
    }

    return c.json({ ok: true, reply });
  } catch {
    return c.json(
      {
        ok: false,
        reply: 'تعذر الاتصال بخادم المساعد الذكي حالياً. يرجى المحاولة مرة أخرى.',
      },
      200
    );
  }
});

app.get('/api/tafseer/:bookId/:surah/:ayah', async (c) => {
  const bookId = Number(c.req.param('bookId') || 1);
  const surahNum = Number(c.req.param('surah') || 1);
  const ayahNum = Number(c.req.param('ayah') || 1);
  const book = TAFSEER_BOOKS.find((b) => b.id === bookId) ?? TAFSEER_BOOKS[0]!;
  const detail = await fetchSurahDetail(surahNum, 'en.sahih', book.editionId);
  const targetAyah = detail.ayahs.find((a) => a.numberInSurah === ayahNum) ?? detail.ayahs[0];
  return c.json({
    ok: true,
    bookNameAr: book.nameAr,
    authorAr: book.authorAr,
    surahNumber: surahNum,
    surahNameAr: detail.meta.nameAr,
    ayahNumber: ayahNum,
    arabicText: targetAyah?.text ?? '',
    tafseerText: targetAyah?.tafseerText ?? '',
  });
});

// ============================================================================
// 3. SMART PHP-STYLE SSR & PRERENDERED ROUTES
// ============================================================================

app.get('/robots.txt', (c) => {
  return c.text(buildRobotsTxt(), 200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, max-age=86400',
  });
});

app.get('/sitemap.xml', (c) => {
  return c.body(buildSitemapXml(), 200, {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=86400',
  });
});

// Home Page
app.get('/', async (c) => {
  return sendPrerendered(c, 'home', async () => renderHomePage());
});
app.get('/index.php', (c) => c.redirect('/', 301));

// Reciters Directory
app.get('/reciters', async (c) => {
  return sendPrerendered(c, 'reciters-dir', async () => renderRecitersDirectoryPage());
});

// Tajweed Guide
app.get('/tajweed', async (c) => {
  return sendPrerendered(c, 'tajweed-guide', async () => renderTajweedGuidePage());
});

// Translations / Languages Directory
app.get('/languages', async (c) => {
  return sendPrerendered(c, 'languages-index', async () => renderLanguagesPage());
});

// Duas & Adhkar Page
app.get('/duas', async (c) => {
  return sendPrerendered(c, 'duas-page', async () => renderDuasPage());
});

// 99 Names of Allah (Asma ul Husna)
app.get('/names', async (c) => {
  return sendPrerendered(c, 'asma-ul-husna', async () => renderAsmaUlHusnaPage());
});
app.get('/asma-ul-husna', (c) => c.redirect('/names', 301));

// Kalamalah AI Assistant Page
app.get('/ai', async (c) => {
  return sendPrerendered(c, 'ai-assistant', async () => renderAiAssistantPage());
});

// Mushaf Root Redirect
app.get('/mushaf', (c) => c.redirect('/mushaf-1', 302));

// Dynamic Smart Route Dispatcher (matches /surah-1, /view-2,from-255,to-257, /reciter-1, /reader-1-haitham-al-dukhin, /mushaf-1, /juz-1, /tafseer-1, /t-1-1-1, /language-en)
app.get('/:slug', async (c) => {
  const slug = c.req.param('slug').trim();

  // 1) /surah-{id}
  const surahMatch = /^surah-(\d+)$/i.exec(slug);
  if (surahMatch) {
    const surahId = Number(surahMatch[1]);
    if (surahId >= 1 && surahId <= 114) {
      return sendPrerendered(c, `surah-${surahId}`, async () => {
        const detail = await fetchSurahDetail(surahId);
        return renderSurahPage({ surahDetail: detail });
      });
    }
  }

  // 2) /view-{id},from-{from},to-{to}
  const viewRangeMatch = /^view-(\d+),from-(\d+),to-(\d+)$/i.exec(slug);
  if (viewRangeMatch) {
    const surahId = Number(viewRangeMatch[1]);
    const fromAyah = Number(viewRangeMatch[2]);
    const toAyah = Number(viewRangeMatch[3]);
    if (surahId >= 1 && surahId <= 114) {
      return sendPrerendered(c, `view-${surahId}-${fromAyah}-${toAyah}`, async () => {
        const detail = await fetchSurahDetail(surahId);
        return renderSurahPage({ surahDetail: detail, fromAyah, toAyah });
      });
    }
  }

  // 3) /reader-{surah}-{reciterSlugOrId}
  const readerMatch = /^reader-(\d+)-([a-zA-Z0-9_-]+)$/i.exec(slug);
  if (readerMatch) {
    const surahId = Number(readerMatch[1]);
    const reciterKey = readerMatch[2]!;
    if (surahId >= 1 && surahId <= 114) {
      return sendPrerendered(c, `reader-${surahId}-${reciterKey}`, async () => {
        const detail = await fetchSurahDetail(surahId);
        return renderSurahPage({ surahDetail: detail, initialReciterSlug: reciterKey });
      });
    }
  }

  // 4) /reciter-{idOrSlug}
  const reciterMatch = /^reciter-([a-zA-Z0-9_-]+)$/i.exec(slug);
  if (reciterMatch) {
    const reciterKey = reciterMatch[1]!;
    return sendPrerendered(c, `reciter-${reciterKey}`, async () =>
      renderReciterProfilePage(reciterKey)
    );
  }

  // 5) /mushaf-{page}
  const mushafMatch = /^mushaf-(\d+)$/i.exec(slug);
  if (mushafMatch) {
    const pageNum = Number(mushafMatch[1]);
    if (pageNum >= 1 && pageNum <= 604) {
      return sendPrerendered(c, `mushaf-${pageNum}`, async () => {
        const pageData = await fetchMushafPage(pageNum);
        return renderMushafPageView(pageData);
      });
    }
  }

  // 6) /juz-{id}
  const juzMatch = /^juz-(\d+)$/i.exec(slug);
  if (juzMatch) {
    const juzNum = Number(juzMatch[1]);
    if (juzNum >= 1 && juzNum <= 30) {
      return sendPrerendered(c, `juz-${juzNum}`, async () => {
        const juzData = await fetchJuzDetail(juzNum);
        return renderJuzPageView(juzData);
      });
    }
  }

  // 7) /tafseer-{id}
  const tafseerMatch = /^tafseer-(\d+)$/i.exec(slug);
  if (tafseerMatch) {
    const tafseerId = Number(tafseerMatch[1]);
    const surahQuery = Number(c.req.query('surah') || 1);
    return sendPrerendered(c, `tafseer-${tafseerId}-s${surahQuery}`, async () =>
      renderTafseerPageView({ bookId: tafseerId, surahNumber: surahQuery })
    );
  }

  // 8) /t-{surah}-{tafseer}-{ayah}
  const singleTafseerMatch = /^t-(\d+)-(\d+)-(\d+)$/i.exec(slug);
  if (singleTafseerMatch) {
    const surahNum = Number(singleTafseerMatch[1]);
    const tafseerId = Number(singleTafseerMatch[2]);
    const ayahNum = Number(singleTafseerMatch[3]);
    return sendPrerendered(c, `t-${surahNum}-${tafseerId}-${ayahNum}`, async () =>
      renderTafseerPageView({ bookId: tafseerId, surahNumber: surahNum, ayahNumber: ayahNum })
    );
  }

  // 9) /language-{code}
  const langMatch = /^language-([a-z]{2,5})$/i.exec(slug);
  if (langMatch) {
    const code = langMatch[1]!.toLowerCase();
    return sendPrerendered(c, `language-${code}`, async () => renderLanguagesPage(code));
  }

  // Fallback to 404
  return c.html(renderNotFoundPage(c.req.path), 404);
});

app.notFound((c) => {
  return c.html(renderNotFoundPage(c.req.path), 404);
});

// Background Prerender Warm-up for instant 0ms response on key static routes
async function warmUpPrerenderCache(): Promise<void> {
  try {
    await getOrPrerenderPage('home', async () => renderHomePage());
    await getOrPrerenderPage('reciters-dir', async () => renderRecitersDirectoryPage());
    await getOrPrerenderPage('tajweed-guide', async () => renderTajweedGuidePage());
    for (const sId of [1, 18, 36, 55, 67, 112]) {
      await getOrPrerenderPage(`surah-${sId}`, async () => {
        const detail = await fetchSurahDetail(sId);
        return renderSurahPage({ surahDetail: detail });
      });
    }
  } catch {
    // Non-blocking warm-up
  }
}

const PORT = Number(process.env.PORT || 3000);

console.log(`🌙 Kalamalah Player SSR & Prerender Server running at http://localhost:${PORT}`);
warmUpPrerenderCache();

export default {
  port: PORT,
  fetch: app.fetch,
};
