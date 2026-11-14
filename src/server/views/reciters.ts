import { SURAHS_META } from '../kalamalah-api';
import { findReciter, getReciterPhotoUrl, getSurahAudioUrl, RECITERS_CATALOG } from '../reciters-catalog';
import { escapeHtml, renderIntervalsToArabicDigits, renderLayout } from './layout';

export function renderRecitersDirectoryPage(): string {
  const cardsHtml = RECITERS_CATALOG.map((r) => {
    const syncBadge = r.hasWordByWord
      ? `<span class="sync-tag wbw-tag" title="Word-by-Word">CC</span>`
      : r.hasAyahTimings
        ? `<span class="sync-tag cc-tag" title="Ayah Sync">CC</span>`
        : '';

    const photoUrl = getReciterPhotoUrl(r);
    return `<a href="/reciter-${r.slug}" class="reciter-dir-card" data-reciter-slug="${escapeHtml(r.slug)}" data-reciter-name="${escapeHtml(r.nameAr)} ${escapeHtml(r.nameEn.toLowerCase())}" data-sync-type="${r.hasWordByWord ? 'wbw' : r.hasAyahTimings ? 'cc' : 'audio'}">
      <div class="reciter-dir-top">
        <div class="reciter-dir-identity">
          <img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(r.nameAr)}" class="reciter-avatar-img lg" loading="lazy" onerror="this.src='/images/round-logo.png'" />
          <div class="reciter-dir-body">
            <h2 class="reciter-dir-title">${escapeHtml(r.nameEn)}</h2>
            <p class="reciter-en-name">${escapeHtml(r.nameAr)} · ${escapeHtml(r.riwayahAr)}</p>
          </div>
        </div>
        ${syncBadge}
      </div>
    </a>`;
  }).join('\n');

  const bodyContent = `
    <section class="page-hero container">
      <div class="page-hero-card">
        <h1 id="reciters-hero-title" data-reciters-count="${RECITERS_CATALOG.length}">Quran Reciters (${RECITERS_CATALOG.length})</h1>
        <p id="reciters-hero-desc" data-i18n="recitersHeroDesc">Listen to synchronized Quran recitations with word-by-word and ayah-level highlighting.</p>

        <div class="reciters-filter-bar">
          <div class="search-input-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="search" id="reciters-search-input" placeholder="Search reciter..." aria-label="Search reciter" />
          </div>
          <div class="segmented-pills" role="group" aria-label="Filter reciters by sync type">
            <button type="button" class="seg-pill active" data-filter-reciter="all">All Reciters (${RECITERS_CATALOG.length})</button>
            <button type="button" class="seg-pill" data-filter-reciter="wbw" data-i18n="wbwFilter">Word-by-Word</button>
            <button type="button" class="seg-pill" data-filter-reciter="cc" data-i18n="ccFilter">Ayah Sync</button>
          </div>
        </div>
      </div>
    </section>

    <section class="container">
      <div class="reciters-directory-grid" id="reciters-directory-grid">
        ${cardsHtml}
      </div>
    </section>
  `;

  return renderLayout({
    title: 'مشاهير قراء القرآن الكريم | التلاوات المتزامنة | كلام الله',
    canonicalPath: '/reciters',
    activeNav: 'reciters',
    bodyContent,
    pageBootstrapData: { pageType: 'reciters' },
  });
}

export function renderReciterProfilePage(idOrSlug: string): string {
  const reciter = findReciter(idOrSlug);
  const photoUrl = getReciterPhotoUrl(reciter);

  const surahsTableHtml = SURAHS_META.map((s) => {
    const arNum = renderIntervalsToArabicDigits(s.number);
    const audioUrl = getSurahAudioUrl(reciter, s.number);
    return `<div class="reciter-surah-row" data-surah-name="${escapeHtml(s.nameAr)} ${escapeHtml(s.nameEn.toLowerCase())}" data-surah-number="${s.number}">
      <div class="rs-left">
        <span class="rs-num">${arNum}</span>
        <div>
          <h3><a href="/reader-${s.number}-${reciter.slug}">سورة ${escapeHtml(s.nameAr)}</a></h3>
          <span class="rs-meta">${escapeHtml(s.nameEn)} / ${s.revelationAr} / ${renderIntervalsToArabicDigits(s.ayahCount)} آية</span>
        </div>
      </div>
      <div class="rs-actions">
        <button type="button" class="rs-play-btn" data-play-surah="${s.number}" data-play-reciter="${escapeHtml(reciter.slug)}" title="Play Surah ${escapeHtml(s.nameEn)}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          <span data-i18n="btnPlay">Play</span>
        </button>
        <a href="/api/download/${encodeURIComponent(reciter.slug)}/${s.number}" class="rs-dl-btn" title="Download MP3" aria-label="Download Surah ${escapeHtml(s.nameEn)}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </a>
      </div>
    </div>`;
  }).join('\n');

  const bodyContent = `
    <section class="reciter-profile-hero container">
      <div class="reciter-profile-card" data-reciter-slug="${escapeHtml(reciter.slug)}">
        <div class="rp-main">
          <img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(reciter.nameEn)}" class="reciter-avatar-img xl" onerror="this.src='/images/round-logo.png'" />
          <div class="rp-info">
            <div class="rp-badges">
              <span class="riwayah-chip">${escapeHtml(reciter.riwayahAr)}</span>
              <span class="riwayah-chip">${escapeHtml(reciter.countryAr)}</span>
              ${
                reciter.hasWordByWord
                  ? `<span class="sync-tag wbw-tag" data-i18n="wbwSyncTag">Word-by-Word</span>`
                  : reciter.hasAyahTimings
                    ? `<span class="sync-tag cc-tag" data-i18n="ccSyncTag">Ayah Sync</span>`
                    : ''
              }
            </div>
            <h1 id="rp-reciter-heading" data-name-ar="${escapeHtml(reciter.nameAr)}" data-name-en="${escapeHtml(reciter.nameEn)}">${escapeHtml(reciter.nameEn)}</h1>
            <p class="rp-en" id="rp-reciter-sub">${escapeHtml(reciter.nameAr)}</p>
            <p class="rp-bio" id="rp-reciter-bio" data-reciter-slug="${escapeHtml(reciter.slug)}" data-k-slug="${escapeHtml(reciter.kalamalahSlug || '')}" data-bio-en="${escapeHtml(reciter.bioEn)}" data-bio-ar="${escapeHtml(reciter.bioAr)}">${escapeHtml(reciter.bioEn)}</p>
          </div>
        </div>

        <div class="rp-controls">
          <div class="rp-cta-row">
            <button type="button" class="btn-primary-gold" data-play-surah="1" data-play-reciter="${escapeHtml(reciter.slug)}">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              <span data-i18n="btnPlay">Play</span>
            </button>
            <a href="/reciters" class="btn-outline-sm" data-i18n="allRecitersFilter">All Reciters</a>
          </div>
        </div>
      </div>
    </section>

    <section class="container">
      <div class="rp-surahs-toolbar">
        <h2 id="rp-surahs-heading" data-name-ar="${escapeHtml(reciter.nameAr)}" data-name-en="${escapeHtml(reciter.nameEn)}">Surahs (${escapeHtml(reciter.nameEn)}) — 114</h2>
        <div class="search-input-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="search" id="reciter-surah-filter-input" placeholder="Search surah..." aria-label="Search surah" />
        </div>
      </div>

      <div class="reciter-surahs-list" id="reciter-surahs-list">
        ${surahsTableHtml}
      </div>
    </section>
  `;

  return renderLayout({
    title: `القارئ ${reciter.nameAr} (${reciter.nameEn}) | المصحف المرتل المتزامن | كلام الله`,
    description: `${reciter.bioAr} استمع وحمّل المصحف المرتل كاملاً (114 سورة) مع المزامنة النصية للآيات والكلمات.`,
    canonicalPath: `/reciter-${reciter.slug}`,
    activeNav: 'reciters',
    bodyContent,
    pageBootstrapData: {
      pageType: 'reciter-profile',
      initialReciterSlug: reciter.slug,
    },
  });
}
