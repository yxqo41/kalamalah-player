import { SURAHS_META, JUZ_META } from '../kalamalah-api';
import { renderIslamOnlineRecommendationBanner } from './islamic-pages';
import { escapeHtml, renderIntervalsToArabicDigits, renderLayout } from './layout';

export function renderHomePage(): string {
  const surahsGridHtml = SURAHS_META.map((s) => {
    return `<article class="surah-card" data-surah-number="${s.number}" data-surah-name="${escapeHtml(s.nameAr)} ${escapeHtml(s.nameEn.toLowerCase())}" data-revelation="${s.revelationType.toLowerCase()}">
      <a href="/surah-${s.number}" class="surah-card-main">
        <span class="surah-num-badge">${s.number}</span>
        <div class="surah-card-info">
          <h3 class="surah-name-ar">Surah ${escapeHtml(s.nameEn)} (${escapeHtml(s.nameAr)})</h3>
          <div class="surah-card-meta">
            <span>${escapeHtml(s.revelationType)}</span>
            <span>·</span>
            <span>${s.ayahCount} Ayahs</span>
          </div>
        </div>
      </a>
      <button type="button" class="quick-play-surah-btn" data-play-surah="${s.number}" title="Play Surah ${escapeHtml(s.nameEn)}" aria-label="Play Surah ${escapeHtml(s.nameEn)}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      </button>
    </article>`;
  }).join('\n');

  const juzsGridHtml = JUZ_META.map((j) => {
    const startSurah = SURAHS_META.find((s) => s.number === j.startSurahNumber);
    const startEn = startSurah ? startSurah.nameEn : j.startSurahNameAr;
    return `<a href="/juz-${j.number}" class="juz-card" data-juz-number="${j.number}" data-juz-title-ar="${escapeHtml(j.titleAr)}" data-start-surah="${j.startSurahNumber}">
      <div class="juz-card-top">
        <span class="juz-badge">${j.number}</span>
        <span class="juz-page-tag">p. ${j.startPage}</span>
      </div>
      <div class="juz-card-body">
        <h3 class="juz-name-ar">Juz ${j.number} (${escapeHtml(j.titleAr)})</h3>
        <p class="juz-start-info">Surah ${escapeHtml(startEn)}</p>
      </div>
    </a>`;
  }).join('\n');

  const bodyContent = `
    <section class="browse-section container" id="browse-quran">
      <div class="browse-toolbar">
        <div class="browse-tabs" role="tablist" aria-label="Browse Quran">
          <button type="button" role="tab" aria-selected="true" class="browse-tab active" data-switch-tab="view-surah">
            <span>Surahs</span>
            <span class="tab-count">114</span>
          </button>
          <button type="button" role="tab" aria-selected="false" class="browse-tab" data-switch-tab="view-juz">
            <span>Juzs</span>
            <span class="tab-count">30</span>
          </button>
          <button type="button" role="tab" aria-selected="false" class="browse-tab" data-switch-tab="view-page">
            <span>Mushaf</span>
            <span class="tab-count">604</span>
          </button>
        </div>

        <div class="browse-filters" id="surah-filter-controls">
          <div id="surah-search-wrapper" class="search-input-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="search" id="home-surah-search" placeholder="Search surah..." aria-label="Search surah" autocomplete="off" />
          </div>

          <div class="revelation-filter-pills" role="group" aria-label="Filter by revelation">
            <button type="button" class="filter-chip active" data-filter-rev="all">All</button>
            <button type="button" class="filter-chip" data-filter-rev="meccan">Meccan</button>
            <button type="button" class="filter-chip" data-filter-rev="medinan">Medinan</button>
          </div>
        </div>
      </div>

      <!-- Tab 1: 114 Surahs Grid -->
      <div id="view-surah" class="tab-panel active" role="tabpanel">
        <div class="surahs-grid" id="home-surahs-grid">
          ${surahsGridHtml}
        </div>
      </div>

      <!-- Tab 2: 30 Juzs Grid -->
      <div id="view-juz" class="tab-panel hidden" role="tabpanel">
        <div class="juzs-grid">
          ${juzsGridHtml}
        </div>
      </div>

      <!-- Tab 3: 604 Mushaf Pages Jumper & Quick Grid -->
      <div id="view-page" class="tab-panel hidden" role="tabpanel">
        <div class="mushaf-jumper-card">
          <div class="mushaf-jumper-header">
            <div>
              <h2>المصحف الشريف (٦٠٤ صفحة)</h2>
              <p>انتقل مباشرة إلى أي صفحة من صفحات المصحف الشريف.</p>
            </div>
            <div class="mushaf-jumper-dropdown-wrap">
              <label id="mushaf-page-dd-lbl" class="field-label">اختر رقم الصفحة</label>
              <div id="home-mushaf-page-dropdown" data-sd-label="mushaf-page-dd-lbl"></div>
            </div>
          </div>

          <div class="mushaf-quick-pages-grid">
            ${[1, 2, 50, 100, 150, 200, 250, 293, 300, 350, 400, 450, 500, 550, 582, 604]
              .map(
                (p) => `<a href="/mushaf-${p}" class="mushaf-page-pill">
                  <span class="mp-num">صفحة ${renderIntervalsToArabicDigits(p)}</span>
                  <span class="mp-juz">الجزء ${renderIntervalsToArabicDigits(Math.min(30, Math.ceil(p / 20)))}</span>
                </a>`
              )
              .join('\n')}
          </div>
        </div>
      </div>
    </section>

    <!-- Islamic Knowledge & Ecosystem Cards (Duas, 99 Names, AI Chatbot, Developer Story) -->
    <section class="tools-showcase container" aria-label="أدوات وموسوعات كلام الله">
      <div class="tools-grid">
        <article class="tool-feature-card">
          <h2>الأدعية القرآنية والأذكار النبوية</h2>
          <p>موسوعة متكاملة لأدعية القرآن الكريم (ربنا...)، أذكار الصباح والمساء، وأدعية الفرج والشفاء مع عداد تسبيح تفاعلي.</p>
          <a href="/duas" class="btn-primary-gold sm">تصفح الأدعية والأذكار</a>
        </article>

        <article class="tool-feature-card">
          <h2>أسماء الله الحسنى (٩٩ اسماً)</h2>
          <p>استعرض أسماء الله الحسنى التسعة والتسعين بالخط القرآني مع شرح معانيها الجليلة باللغتين العربية والإنجليزية.</p>
          <a href="/names" class="btn-primary-gold sm">استعراض الأسماء الحسنى</a>
        </article>

        <article class="tool-feature-card">
          <h2>المساعد القرآني الذكي (Kalamalah AI)</h2>
          <p>اسأل الذكاء الاصطناعي عن معاني الآيات، السور، أحكام التجويد، والأدعية المناسبة لكل حال.</p>
          <a href="/ai" class="btn-primary-gold sm">فتح المساعد الذكي</a>
        </article>
      </div>
    </section>

    ${renderIslamOnlineRecommendationBanner()}
  `;

  return renderLayout({
    title: 'كلام الله | القرآن الكريم',
    canonicalPath: '/',
    activeNav: 'home',
    bodyContent,
    pageBootstrapData: {
      pageType: 'home',
    },
  });
}
