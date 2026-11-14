import { fetchJuzDetail, fetchMushafPage, fetchSurahDetail } from './kalamalah-api';
import { getOrPrerenderPage } from './prerender-cache';
import { RECITERS_CATALOG } from './reciters-catalog';
import { renderHomePage } from './views/home';
import { renderJuzPageView, renderLanguagesPage, renderTajweedGuidePage } from './views/juz-tafseer';
import { renderMushafPageView } from './views/mushaf';
import { renderReciterProfilePage, renderRecitersDirectoryPage } from './views/reciters';
import { renderSurahPage } from './views/surah';

async function runPrerender(): Promise<void> {
  console.log('[Kalamalah] Starting Hybrid Prerender Warm-up...');
  await getOrPrerenderPage('home', async () => renderHomePage());
  await getOrPrerenderPage('reciters-dir', async () => renderRecitersDirectoryPage());
  await getOrPrerenderPage('tajweed-guide', async () => renderTajweedGuidePage());
  await getOrPrerenderPage('languages-index', async () => renderLanguagesPage());

  for (const r of RECITERS_CATALOG) {
    await getOrPrerenderPage(`reciter-${r.slug}`, async () => renderReciterProfilePage(r.slug));
  }

  for (const sId of [1, 2, 18, 36, 55, 56, 67, 112, 113, 114]) {
    const detail = await fetchSurahDetail(sId);
    await getOrPrerenderPage(`surah-${sId}`, async () => renderSurahPage({ surahDetail: detail }));
  }

  const p1 = await fetchMushafPage(1);
  await getOrPrerenderPage('mushaf-1', async () => renderMushafPageView(p1));

  const j1 = await fetchJuzDetail(1);
  await getOrPrerenderPage('juz-1', async () => renderJuzPageView(j1));

  console.log('[Kalamalah] Prerender cache warmed up in .cache/prerender.');
}

runPrerender();
