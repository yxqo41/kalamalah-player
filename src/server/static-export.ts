import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fetchJuzDetail, fetchMushafPage, fetchSurahDetail, TRANSLATION_EDITIONS, TAFSEER_BOOKS } from './kalamalah-api';
import { RECITERS_CATALOG } from './reciters-catalog';
import { renderHomePage } from './views/home';
import { renderAiAssistantPage, renderAsmaUlHusnaPage, renderDuasPage } from './views/islamic-pages';
import {
  renderJuzPageView,
  renderLanguagesPage,
  renderTafseerPageView,
  renderTajweedGuidePage,
} from './views/juz-tafseer';
import { renderLayout } from './views/layout';
import { renderMushafPageView } from './views/mushaf';
import { renderReciterProfilePage, renderRecitersDirectoryPage } from './views/reciters';
import { renderSurahPage } from './views/surah';

const ROOT = process.cwd();
const DIST_DIR = join(ROOT, 'dist');
const PUBLIC_DIR = join(ROOT, 'public');
const MAIN_FONTS_DIR = join(ROOT, 'main', 'fonts');
const MAIN_ICONS_DIR = join(ROOT, 'main', 'icons');
const CUSTOM_DOMAIN = (process.env.CUSTOM_DOMAIN || 'kalamalah.com').trim();

function markHtmlStatic(html: string): string {
  return html.replace('</head>', '<script>window.__KALAMALAH_STATIC__=true;</script>\n</head>');
}

async function writeHtmlSlug(slugPath: string, html: string): Promise<void> {
  const marked = markHtmlStatic(html);
  const clean = slugPath.replace(/^\/+|\/+$/g, '');
  if (!clean) {
    await writeFile(join(DIST_DIR, 'index.html'), marked, 'utf8');
    return;
  }
  await writeFile(join(DIST_DIR, `${clean}.html`), marked, 'utf8');
}

async function runStaticExport(): Promise<void> {
  console.log('[Kalamalah Static] Preparing dist/ directory...');
  await rm(DIST_DIR, { recursive: true, force: true });
  await mkdir(DIST_DIR, { recursive: true });

  // 1. Copy public/ assets and main/ fallback fonts & icons
  await cp(PUBLIC_DIR, DIST_DIR, { recursive: true });
  if (existsSync(join(PUBLIC_DIR, 'favicon', 'site.webmanifest'))) {
    await cp(join(PUBLIC_DIR, 'favicon', 'site.webmanifest'), join(DIST_DIR, 'site.webmanifest'));
  }
  if (existsSync(MAIN_FONTS_DIR)) {
    await mkdir(join(DIST_DIR, 'fonts'), { recursive: true });
    await cp(MAIN_FONTS_DIR, join(DIST_DIR, 'fonts'), { recursive: true, force: false });
  }
  if (existsSync(MAIN_ICONS_DIR)) {
    await mkdir(join(DIST_DIR, 'icons'), { recursive: true });
    await cp(MAIN_ICONS_DIR, join(DIST_DIR, 'icons'), { recursive: true });
  }

  // 2. GitHub Pages config files
  await writeFile(join(DIST_DIR, '.nojekyll'), '', 'utf8');
  if (CUSTOM_DOMAIN) {
    await writeFile(join(DIST_DIR, 'CNAME'), `${CUSTOM_DOMAIN}\n`, 'utf8');
  }

  // 3. Smart SPA/Slug Fallback 404.html (handles any dynamic slug via static-router.ts)
  const fallback404 = renderLayout({
    title: 'Kalamalah | Holy Quran',
    bodyContent: `
      <div id="static-route-placeholder" class="container" style="padding:64px 16px;text-align:center;">
        <p style="color:var(--text-secondary);font-size:1rem;">Loading...</p>
      </div>
    `,
  });
  await writeFile(join(DIST_DIR, '404.html'), markHtmlStatic(fallback404), 'utf8');

  // 4. Core offline-renderable pages
  await writeHtmlSlug('', renderHomePage());
  await writeHtmlSlug('reciters', renderRecitersDirectoryPage());
  await writeHtmlSlug('tajweed', renderTajweedGuidePage());
  await writeHtmlSlug('duas', renderDuasPage());
  await writeHtmlSlug('names', renderAsmaUlHusnaPage());
  await writeHtmlSlug('ai', renderAiAssistantPage());

  for (const r of RECITERS_CATALOG) {
    await writeHtmlSlug(`reciter-${r.slug}`, renderReciterProfilePage(r.slug));
  }

  // 5. Optional full API-backed prerender (enabled via STATIC_FULL=1 or CI=true)
  const includeFull = process.env.STATIC_FULL === '1' || process.env.CI === 'true';
  if (includeFull) {
    console.log('[Kalamalah Static] Pre-rendering Surahs, Juzs, Languages & Tafseer...');
    try {
      await writeHtmlSlug('languages', await renderLanguagesPage());
      for (const lang of TRANSLATION_EDITIONS.slice(0, 6)) {
        await writeHtmlSlug(`language-${lang.code}`, await renderLanguagesPage(lang.code));
      }
    } catch (e) {
      console.warn('[Kalamalah Static] Skipped languages prerender:', e);
    }

    try {
      const p1 = await fetchMushafPage(1);
      await writeHtmlSlug('mushaf', renderMushafPageView(p1));
      await writeHtmlSlug('mushaf-1', renderMushafPageView(p1));
    } catch {}

    for (const b of TAFSEER_BOOKS) {
      try {
        await writeHtmlSlug(`tafseer-${b.id}`, await renderTafseerPageView({ bookId: b.id, surahNumber: 1 }));
      } catch {}
    }

    // Batch surahs (6 at a time)
    for (let s = 1; s <= 114; s += 6) {
      const batch = Array.from({ length: Math.min(6, 115 - s) }, (_, i) => s + i);
      await Promise.allSettled(
        batch.map(async (id) => {
          const detail = await fetchSurahDetail(id);
          await writeHtmlSlug(`surah-${id}`, renderSurahPage({ surahDetail: detail }));
        })
      );
    }

    // Batch juzs (5 at a time)
    for (let j = 1; j <= 30; j += 5) {
      const batch = Array.from({ length: Math.min(5, 31 - j) }, (_, i) => j + i);
      await Promise.allSettled(
        batch.map(async (id) => {
          const juzData = await fetchJuzDetail(id);
          await writeHtmlSlug(`juz-${id}`, renderJuzPageView(juzData));
        })
      );
    }
  }

  console.log(`[Kalamalah Static] Export complete in ${DIST_DIR} (CNAME: ${CUSTOM_DOMAIN || 'none'}).`);
}

runStaticExport();
