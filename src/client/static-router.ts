import { escapeHtml } from './i18n';
import type { BootstrapCatalog } from './quran-player';
import {
  fetchJuzApi,
  fetchMushafPageApi,
  fetchSurahApi,
  getDownloadUrl,
  markStaticMode,
} from './static-api';

const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
function toArDigits(n: number | string): string {
  return String(n).replace(/\d/g, (d) => AR_DIGITS[Number(d)] ?? d);
}

function isSpokenWord(tok: string): boolean {
  return /[\u0621-\u064A\u066E-\u06D3\u06FA-\u06FF]/.test(tok);
}

function tokenizeWordsHtml(text: string, ayahNum: number): string {
  let idx = 0;
  return text
    .trim()
    .split(/\s+/)
    .map((tok) => {
      if (!isSpokenWord(tok)) {
        return `<span class="quran-waqf" data-raw-word="${escapeHtml(tok)}">${escapeHtml(tok)}</span>`;
      }
      return `<span class="quran-word" data-ayah="${ayahNum}" data-word-idx="${idx++}" data-raw-word="${escapeHtml(tok)}">${escapeHtml(tok)}</span>`;
    })
    .join(' ');
}

export async function resolveStaticRouteIfNeeded(catalog: BootstrapCatalog): Promise<boolean> {
  const placeholder = document.getElementById('static-route-placeholder');
  const mainEl = document.getElementById('main-content');
  if (!placeholder || !mainEl) return false;

  markStaticMode();
  const slug = window.location.pathname.replace(/^\/+|\/+$/g, '');
  if (!slug) return false;

  // 1) /surah-N, /view-N,from-A,to-B, /reader-N-SLUG
  let surahId = 0;
  let fromAyah = 1;
  let toAyah = 9999;
  let reciterSlug = 'haitham-al-dukhin';
  let isRange = false;

  const surahMatch = /^surah-(\d+)$/i.exec(slug);
  const rangeMatch = /^view-(\d+),from-(\d+),to-(\d+)$/i.exec(slug);
  const readerMatch = /^reader-(\d+)-([a-zA-Z0-9_-]+)$/i.exec(slug);

  if (surahMatch) {
    surahId = Number(surahMatch[1]);
  } else if (rangeMatch) {
    surahId = Number(rangeMatch[1]);
    fromAyah = Number(rangeMatch[2]);
    toAyah = Number(rangeMatch[3]);
    isRange = true;
  } else if (readerMatch) {
    surahId = Number(readerMatch[1]);
    reciterSlug = readerMatch[2]!;
  }

  if (surahId >= 1 && surahId <= 114) {
    const sMeta = catalog.surahs.find((s) => s.n === surahId) ?? catalog.surahs[0]!;
    const activeReciter =
      catalog.reciters.find((r) => r.slug === reciterSlug || String(r.id) === reciterSlug) ??
      catalog.reciters[0]!;

    const detail = await fetchSurahApi(surahId, 'en.sahih', 'ar.muyassar', catalog);
    if (!detail) return false;

    const clampedFrom = Math.max(1, Math.min(sMeta.ay, fromAyah));
    const clampedTo = Math.max(clampedFrom, Math.min(sMeta.ay, toAyah));
    const filtered = detail.ayahs.filter((a) => a.n >= clampedFrom && a.n <= clampedTo);
    const prevSurah = surahId > 1 ? catalog.surahs.find((s) => s.n === surahId - 1) : null;
    const nextSurah = surahId < 114 ? catalog.surahs.find((s) => s.n === surahId + 1) : null;
    const showBismillah = surahId !== 1 && surahId !== 9 && clampedFrom === 1;
    const dlHref = getDownloadUrl(activeReciter, surahId);

    const ayahsHtml = filtered
      .map((a) => {
        const arNum = toArDigits(a.n);
        return `<article class="ayah-block" id="ayah-${a.n}" data-ayah="${a.n}" data-page="${a.p}" data-juz="${a.j}" data-raw-arabic="${escapeHtml(a.text)}">
          <div class="ayah-block-header">
            <div class="ayah-meta-pills">
              <a href="/mushaf-${a.p}" class="ayah-meta-chip">p. ${a.p}</a>
            </div>
            <div class="ayah-action-buttons">
              <button type="button" class="ayah-tool-btn play-ayah-btn" data-play-ayah="${a.n}" title="Listen" aria-label="Play Ayah ${a.n}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </button>
              <button type="button" class="ayah-tool-btn tafseer-ayah-btn" data-open-tafseer="${a.n}" title="Tafseer">
                <span>Tafseer</span>
              </button>
              <button type="button" class="ayah-tool-btn copy-ayah-btn" data-copy-ayah="${a.n}" title="Copy Ayah">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              </button>
              <button type="button" class="ayah-tool-btn bookmark-ayah-btn" data-bookmark-ayah="${a.n}" title="Bookmark" aria-label="Bookmark Ayah ${a.n}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
              </button>
            </div>
          </div>
          <div class="ayah-arabic-body quran-reading-text" dir="rtl">
            ${tokenizeWordsHtml(a.text, a.n)}
            <span class="ayah-end-symbol" data-ayah-marker="${a.n}">﴿${arNum}﴾</span>
          </div>
          <div class="ayah-extras">
            <div class="ayah-translation ${a.tr ? '' : 'hidden'}" dir="ltr" data-ayah-trans="${a.n}">
              <p>${escapeHtml(a.tr)}</p>
            </div>
            <div class="ayah-inline-tafseer hidden" data-inline-tafseer="${a.n}">
              <div class="inline-tafseer-header">
                <strong class="inline-tafseer-book-name">التفسير الميسر</strong>
                <a href="/t-${surahId}-1-${a.n}" class="more-tafseer-link" data-tafseer-compare-link="${a.n}">Compare Tafseers</a>
              </div>
              <p class="inline-tafseer-body-text">${escapeHtml(a.taf)}</p>
            </div>
          </div>
        </article>`;
      })
      .join('\n');

    mainEl.innerHTML = `
      <nav class="surah-breadcrumb-nav container" aria-label="Breadcrumb">
        <div class="breadcrumb-trail">
          <a href="/" class="bc-item"><span>Home</span></a>
          <span class="bc-sep">›</span>
          <a href="/#view-surah" class="bc-item">Holy Quran</a>
          <span class="bc-sep">›</span>
          <span class="bc-item current">Surah ${escapeHtml(sMeta.en)}</span>
        </div>
      </nav>
      <section class="surah-hero container">
        <div class="surah-hero-card modern-quran-hero">
          <div class="surah-title-header">
            <h1 class="surah-display-title">Surah ${escapeHtml(sMeta.en)} (${escapeHtml(sMeta.ar)})</h1>
            <div class="surah-hero-badges-row">
              <span class="hero-meta-badge"><span id="hero-rev-text">${sMeta.rev === 'مكية' ? 'Meccan' : 'Medinan'}</span></span>
              <span class="hero-meta-badge"><span id="hero-ayah-count-text">${sMeta.ay} Ayahs</span></span>
            </div>
          </div>
          <div class="surah-compact-action-row">
            <button type="button" id="open-share-modal-btn" class="surah-square-btn share-btn" title="Share">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </button>
            <div class="surah-reciter-combobox-wrap">
              <label id="surah-reciter-dd-lbl" class="sr-only">Reciter</label>
              <div id="surah-reciter-dropdown" data-sd-label="surah-reciter-dd-lbl" data-initial-reciter="${escapeHtml(activeReciter.slug)}"></div>
            </div>
            <button type="button" id="surah-filter-shortcut-btn" class="surah-square-btn filter-btn" title="Filter">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            </button>
          </div>
          <div class="surah-listen-hero-box">
            <h2 class="surah-listen-hero-title">Listen to Surah <strong>${escapeHtml(sMeta.en)}</strong> recited by <span id="hero-reciter-name-display">${escapeHtml(activeReciter.en)}</span></h2>
            <div class="surah-listen-cta-wrap">
              <button type="button" id="surah-hero-play-btn" class="surah-listen-pill-btn" data-play-surah="${surahId}" data-play-reciter="${escapeHtml(activeReciter.slug)}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <span>Listen</span>
              </button>
              <a id="surah-download-btn" href="${escapeHtml(dlHref)}" class="btn-glass-sm" download>
                <span data-i18n="btnDownload">Download</span>
              </a>
            </div>
          </div>
          ${
            isRange
              ? `<div class="range-active-banner" data-from="${clampedFrom}" data-to="${clampedTo}">
                  <span id="range-banner-label">Ayah ${clampedFrom} - ${clampedTo}</span>
                  <a href="/surah-${surahId}" class="btn-outline-sm" data-i18n="showFullSurah">Show full Surah</a>
                </div>`
              : ''
          }
        </div>
      </section>
      <section class="reading-toolbar-section container" id="reading-toolbar-section">
        <div class="reading-toolbar-collapsible-header">
          <button type="button" id="reading-toolbar-toggle-btn" class="reading-toolbar-collapse-trigger" aria-expanded="true" aria-controls="reading-toolbar-content">
            <div class="rtc-title-group"><span class="rtc-main-label">Reading Settings</span></div>
            <span class="rtc-collapse-indicator"><svg class="rtc-arrow-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><polyline points="6 9 12 15 18 9"/></svg></span>
          </button>
        </div>
        <div id="reading-toolbar-content" class="reading-toolbar-collapsible-body">
          <div class="reading-toolbar">
            <div class="toolbar-group">
              <div class="segmented-pills">
                <button type="button" class="seg-pill active" data-set-reading-font="uthmani">Uthmani</button>
                <button type="button" class="seg-pill" data-set-reading-font="kitab">Kitab</button>
                <button type="button" class="seg-pill" data-set-reading-font="amiri">Amiri</button>
                <button type="button" class="seg-pill" data-set-reading-font="nastaleeq">Nastaleeq</button>
              </div>
              <div class="stepper-box">
                <button type="button" id="font-size-dec" class="stepper-btn">-</button>
                <span id="font-size-val" class="stepper-val">100%</span>
                <button type="button" id="font-size-inc" class="stepper-btn">+</button>
              </div>
              <div class="segmented-pills">
                <button type="button" class="seg-pill active" data-reader-view="cards">Ayahs</button>
                <button type="button" class="seg-pill" data-reader-view="mushaf-flow">Continuous</button>
                <button type="button" class="seg-pill" data-reader-view="tafseer-open">Tafseer</button>
              </div>
            </div>
            <div class="toolbar-group toolbar-toggles">
              <button type="button" id="tajweed-color-toggle" class="tool-toggle-btn"><span>Tajweed</span></button>
              <button type="button" id="diacritics-panel-toggle" class="tool-toggle-btn"><span>Diacritics</span></button>
              <button type="button" id="memorization-panel-toggle" class="tool-toggle-btn"><span>Memorize</span></button>
              <button type="button" id="range-filter-toggle" class="tool-toggle-btn"><span>Range</span></button>
            </div>
          </div>
          <div class="surah-edition-selectors-bar">
            <div class="edition-picker-col"><label id="surah-trans-dd-lbl" class="edition-picker-label" data-i18n="btnTranslation">Translation</label><div id="surah-translation-dropdown"></div></div>
            <div class="edition-picker-col"><label id="surah-tafseer-dd-lbl" class="edition-picker-label" data-i18n="navTafseer">Tafseer</label><div id="surah-tafseer-dropdown"></div></div>
            <div class="edition-picker-col"><label id="surah-ayah-jump-lbl" class="edition-picker-label" data-i18n="jumpToAyah">Jump to Ayah</label><div id="surah-ayah-jump-dropdown" data-ayah-count="${sMeta.ay}"></div></div>
          </div>
        </div>
      </section>
      <section class="surah-reader-section container">
        ${showBismillah ? `<div class="bismillah-banner quran-reading-text">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>` : ''}
        <div id="surah-ayahs-wrapper" class="surah-ayahs-wrapper" data-surah-number="${surahId}" data-surah-name-ar="${escapeHtml(sMeta.ar)}" data-surah-name-en="${escapeHtml(sMeta.en)}">
          ${ayahsHtml}
        </div>
      </section>
      <nav class="surah-pagination container">
        ${prevSurah ? `<a href="/surah-${prevSurah.n}" class="pagination-card prev"><span class="pag-dir">Previous Surah</span><strong>Surah ${escapeHtml(prevSurah.en)}</strong></a>` : '<div></div>'}
        <a href="/mushaf-${sMeta.p}" class="pagination-card center"><span class="pag-dir">Holy Mushaf</span><strong>Read from Page ${sMeta.p}</strong></a>
        ${nextSurah ? `<a href="/surah-${nextSurah.n}" class="pagination-card next"><span class="pag-dir">Next Surah</span><strong>Surah ${escapeHtml(nextSurah.en)}</strong></a>` : '<div></div>'}
      </nav>
    `;

    catalog.pageData = {
      pageType: 'surah',
      surahNumber: surahId,
      surahNameAr: sMeta.ar,
      surahNameEn: sMeta.en,
      initialReciterSlug: activeReciter.slug,
      ayahs: detail.ayahs.map((a) => ({ n: a.n, text: a.text, tr: a.tr, taf: a.taf })),
    };
    document.title = `Surah ${sMeta.en} (${sMeta.ar}) | Kalamalah`;
    return true;
  }

  // 2) /mushaf or /mushaf-N
  const mushafMatch = /^mushaf(?:-(\d+))?$/i.exec(slug);
  if (mushafMatch) {
    const pageNum = Math.max(1, Math.min(604, Number(mushafMatch[1] || 1)));
    const data = await fetchMushafPageApi(pageNum, catalog);
    if (!data) return false;
    const prevPage = pageNum > 1 ? pageNum - 1 : null;
    const nextPage = pageNum < 604 ? pageNum + 1 : null;
    const primary = data.surahsOnPage[0];
    const grouped: { sNum: number; sAr: string; ayahs: typeof data.ayahs }[] = [];
    for (const a of data.ayahs) {
      const last = grouped[grouped.length - 1];
      if (!last || last.sNum !== a.sNum) grouped.push({ sNum: a.sNum, sAr: a.sAr, ayahs: [a] });
      else last.ayahs.push(a);
    }
    const flowHtml = grouped
      .map((g) => {
        const starts = g.ayahs[0]?.n === 1;
        const bis = starts && g.sNum !== 1 && g.sNum !== 9;
        return `<div class="mushaf-surah-segment" data-surah="${g.sNum}">
          ${starts ? `<div class="mushaf-ornate-surah-banner"><span>سُورَةُ ${escapeHtml(g.sAr)}</span></div>` : ''}
          ${bis ? `<div class="mushaf-bismillah quran-reading-text">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>` : ''}
          <div class="mushaf-justified-flow quran-reading-text" dir="rtl">
            ${g.ayahs
              .map(
                (a) => `<span class="mushaf-inline-ayah" id="ayah-${g.sNum}-${a.n}">${tokenizeWordsHtml(a.text, a.n)} <button type="button" class="mushaf-ayah-medallion" data-play-surah="${g.sNum}" data-play-ayah="${a.n}">﴿${toArDigits(a.n)}﴾</button></span>`
              )
              .join(' ')}
          </div>
        </div>`;
      })
      .join('\n');

    mainEl.innerHTML = `
      <section class="mushaf-viewer-section container">
        <div class="mushaf-toolbar">
          <div class="mushaf-nav-Cluster">
            ${prevPage ? `<a href="/mushaf-${prevPage}" class="btn-glass-sm">← Page ${prevPage}</a>` : ''}
            <div class="mushaf-page-picker-wrap"><div id="mushaf-page-dropdown" data-current-page="${pageNum}"></div></div>
            ${nextPage ? `<a href="/mushaf-${nextPage}" class="btn-glass-sm">Page ${nextPage} →</a>` : ''}
          </div>
        </div>
        <article class="mushaf-sheet-frame">
          <header class="mushaf-sheet-header">
            <span>${escapeHtml(data.surahsOnPage.map((s) => s.en).join(', '))}</span>
            <span>Page ${pageNum}</span>
            <span>Juz ${data.juz}</span>
          </header>
          <div class="mushaf-sheet-inner" id="surah-ayahs-wrapper" data-surah-number="${primary?.n ?? 1}">${flowHtml}</div>
        </article>
      </section>
    `;
    catalog.pageData = { pageType: 'mushaf', mushafPage: pageNum, surahNumber: primary?.n ?? 1 };
    document.title = `Mushaf Page ${pageNum} | Kalamalah`;
    return true;
  }

  // 3) /juz-N
  const juzMatch = /^juz-(\d+)$/i.exec(slug);
  if (juzMatch) {
    const juzNum = Math.max(1, Math.min(30, Number(juzMatch[1])));
    const data = await fetchJuzApi(juzNum, catalog);
    if (!data) return false;
    const prevJuz = juzNum > 1 ? juzNum - 1 : null;
    const nextJuz = juzNum < 30 ? juzNum + 1 : null;
    const groupsHtml = data.groups
      .map(
        (g) => `<section class="juz-surah-section" data-surah="${g.surah.n}">
          <div class="juz-surah-header">
            <div>
              <h2><a href="/surah-${g.surah.n}" class="juz-surah-title-link" data-surah-number="${g.surah.n}" data-surah-name-ar="${escapeHtml(g.surah.ar)}" data-surah-name-en="${escapeHtml(g.surah.en)}">Surah ${escapeHtml(g.surah.en)} (${escapeHtml(g.surah.ar)})</a></h2>
              <span class="juz-surah-sub" data-rev="${escapeHtml(g.surah.rev)}" data-ayah-count="${g.ayahs.length}">${g.ayahs.length} Ayahs</span>
            </div>
            <div class="juz-surah-actions">
              <button type="button" class="btn-primary-gold sm" data-play-surah="${g.surah.n}"><span data-i18n="btnPlay">Play</span></button>
              <a href="/surah-${g.surah.n}" class="btn-glass-sm" data-i18n="showFullSurah">Show full Surah</a>
            </div>
          </div>
          <div class="mushaf-justified-flow quran-reading-text" dir="rtl">
            ${g.ayahs.map((a) => `<span class="mushaf-inline-ayah" id="ayah-${g.surah.n}-${a.n}">${tokenizeWordsHtml(a.text, a.n)} <button type="button" class="mushaf-ayah-medallion" data-play-surah="${g.surah.n}" data-play-ayah="${a.n}">﴿${toArDigits(a.n)}﴾</button></span>`).join(' ')}
          </div>
        </section>`
      )
      .join('\n');

    mainEl.innerHTML = `
      <section class="page-hero container">
        <div class="page-hero-card" id="juz-hero-card" data-juz="${juzNum}" data-surah-count="${data.groups.length}">
          <h1 id="juz-hero-title">Juz ${juzNum} — Holy Quran</h1>
          <p id="juz-hero-desc">Contains ${data.groups.length} Surahs in Uthmani script.</p>
          <div class="juz-nav-row">
            ${prevJuz ? `<a href="/juz-${prevJuz}" class="btn-glass-sm" data-juz-prev="${prevJuz}">← Juz ${prevJuz}</a>` : ''}
            <a href="/#view-juz" class="btn-outline-sm" data-i18n="navJuzs">Juzs</a>
            ${nextJuz ? `<a href="/juz-${nextJuz}" class="btn-primary-gold sm" data-juz-next="${nextJuz}">Juz ${nextJuz} →</a>` : ''}
          </div>
        </div>
      </section>
      <section class="container">${groupsHtml}</section>
    `;
    catalog.pageData = { pageType: 'juz', juz: juzNum, surahNumber: data.groups[0]?.surah.n ?? 1 };
    document.title = `Juz ${juzNum} | Kalamalah`;
    return true;
  }

  // 4) /t-SURAH-BOOK-AYAH or /tafseer-BOOK
  const singleTaf = /^t-(\d+)-(\d+)-(\d+)$/i.exec(slug);
  const tafBook = /^tafseer-(\d+)$/i.exec(slug);
  if (singleTaf || tafBook) {
    const bookId = Number(singleTaf ? singleTaf[2] : tafBook![1]);
    const sNum = Number(singleTaf ? singleTaf[1] : new URLSearchParams(window.location.search).get('surah') || 1);
    const ayahFilter = singleTaf ? Number(singleTaf[3]) : 0;
    const book = catalog.tafseers?.find((b) => Number(b.id) === bookId) ?? catalog.tafseers?.[0];
    const detail = await fetchSurahApi(sNum, 'en.sahih', book?.editionId || 'ar.muyassar', catalog);
    if (!detail) return false;
    const list = ayahFilter ? detail.ayahs.filter((a) => a.n === ayahFilter) : detail.ayahs;
    mainEl.innerHTML = `
      <section class="page-hero container"><div class="page-hero-card">
        <h1>${escapeHtml(book?.nameAr || 'Tafseer')} — Surah ${sNum}</h1>
        <a href="/surah-${sNum}" class="btn-outline-sm">Open Surah ${sNum}</a>
      </div></section>
      <section class="container tafseer-list-section">
        ${list
          .map(
            (a) => `<article class="tafseer-ayah-card">
              <div class="tafseer-ayah-header"><span class="ayah-number-ornament">﴿${toArDigits(a.n)}﴾</span></div>
              <div class="tafseer-arabic-verse quran-reading-text" dir="rtl">${escapeHtml(a.text)} ﴿${toArDigits(a.n)}﴾</div>
              <div class="tafseer-explanation-box"><p>${escapeHtml(a.taf || '')}</p></div>
            </article>`
          )
          .join('\n')}
      </section>
    `;
    document.title = `Tafseer Surah ${sNum} | Kalamalah`;
    return true;
  }

  return false;
}
