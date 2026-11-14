import {
  fetchSurahDetail,
  getSurahMeta,
  SURAHS_META,
  TAFSEER_BOOKS,
  TRANSLATION_EDITIONS,
  type AyahItem,
  type SurahMeta,
} from '../kalamalah-api';
import { TAJWEED_RULES } from '../tajweed-mistakes-data';
import { escapeHtml, renderIntervalsToArabicDigits, renderLayout } from './layout';
import { tokenizeAyahWordsHtml } from './surah';

export function renderJuzPageView(props: {
  juz: number;
  ayahs: AyahItem[];
  groups: { surah: SurahMeta; ayahs: AyahItem[] }[];
}): string {
  const { juz, groups } = props;
  const arJuz = renderIntervalsToArabicDigits(juz);
  const prevJuz = juz > 1 ? juz - 1 : null;
  const nextJuz = juz < 30 ? juz + 1 : null;

  const groupsHtml = groups
    .map((g) => {
      const revEn = g.surah.revelationType;
      return `<section class="juz-surah-section" data-surah="${g.surah.number}">
        <div class="juz-surah-header">
          <div>
            <h2><a href="/surah-${g.surah.number}" class="juz-surah-title-link" data-surah-number="${g.surah.number}" data-surah-name-ar="${escapeHtml(g.surah.nameAr)}" data-surah-name-en="${escapeHtml(g.surah.nameEn)}">Surah ${escapeHtml(g.surah.nameEn)} (${escapeHtml(g.surah.nameAr)})</a></h2>
            <span class="juz-surah-sub" data-rev="${escapeHtml(g.surah.revelationAr)}" data-ayah-count="${g.ayahs.length}">${escapeHtml(revEn)} · ${g.ayahs.length} Ayahs</span>
          </div>
          <div class="juz-surah-actions">
            <button type="button" class="btn-primary-gold sm" data-play-surah="${g.surah.number}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              <span data-i18n="btnPlay">Play</span>
            </button>
            <a href="/surah-${g.surah.number}" class="btn-glass-sm" data-i18n="showFullSurah">Show full Surah</a>
          </div>
        </div>
        <div class="mushaf-justified-flow quran-reading-text" dir="rtl">
          ${g.ayahs
            .map((a) => {
              const arNum = renderIntervalsToArabicDigits(a.numberInSurah);
              return `<span class="mushaf-inline-ayah" id="ayah-${g.surah.number}-${a.numberInSurah}">
                ${tokenizeAyahWordsHtml(a.text, a.numberInSurah)}
                <button type="button" class="mushaf-ayah-medallion" data-play-surah="${g.surah.number}" data-play-ayah="${a.numberInSurah}">﴿${arNum}﴾</button>
              </span>`;
            })
            .join(' ')}
        </div>
      </section>`;
    })
    .join('\n');

  const bodyContent = `
    <section class="page-hero container">
      <div class="page-hero-card" id="juz-hero-card" data-juz="${juz}" data-surah-count="${groups.length}">
        <h1 id="juz-hero-title">Juz ${juz} — Holy Quran</h1>
        <p id="juz-hero-desc">Contains ${groups.length} Surahs in Uthmani script with synchronized audio playback.</p>
        <div class="juz-nav-row">
          ${prevJuz ? `<a href="/juz-${prevJuz}" class="btn-glass-sm" data-juz-prev="${prevJuz}">← Juz ${prevJuz}</a>` : ''}
          <a href="/#view-juz" class="btn-outline-sm" data-i18n="navJuzs">Juzs</a>
          ${nextJuz ? `<a href="/juz-${nextJuz}" class="btn-primary-gold sm" data-juz-next="${nextJuz}">Juz ${nextJuz} →</a>` : ''}
        </div>
      </div>
    </section>

    <section class="container">
      ${groupsHtml}
    </section>
  `;

  return renderLayout({
    title: `Juz ${juz} | Holy Quran | Kalamalah`,
    canonicalPath: `/juz-${juz}`,
    activeNav: 'juzs',
    bodyContent,
    pageBootstrapData: {
      pageType: 'juz',
      juz,
      surahNumber: groups[0]?.surah.number ?? 1,
    },
  });
}

export async function renderTafseerPageView(opts: {
  bookId: number;
  surahNumber?: number;
  ayahNumber?: number;
}): Promise<string> {
  const book = TAFSEER_BOOKS.find((b) => b.id === opts.bookId) ?? TAFSEER_BOOKS[0]!;
  const surahNum = opts.surahNumber && opts.surahNumber >= 1 && opts.surahNumber <= 114 ? opts.surahNumber : 1;
  const surahDetail = await fetchSurahDetail(surahNum, 'en.sahih', book.editionId);
  const targetAyahs = opts.ayahNumber
    ? surahDetail.ayahs.filter((a) => a.numberInSurah === opts.ayahNumber)
    : surahDetail.ayahs;

  const booksTabsHtml = TAFSEER_BOOKS.map(
    (b) => `<a href="${opts.ayahNumber ? `/t-${surahNum}-${b.id}-${opts.ayahNumber}` : `/tafseer-${b.id}`}" class="seg-pill ${b.id === book.id ? 'active' : ''}">${escapeHtml(b.nameAr)}</a>`
  ).join('\n');

  const ayahsTafseerHtml = targetAyahs
    .map((a) => {
      return `<article class="tafseer-ayah-card" id="tafseer-ayah-${a.numberInSurah}">
        <div class="tafseer-ayah-header">
          <span class="ayah-number-ornament">﴿${renderIntervalsToArabicDigits(a.numberInSurah)}﴾</span>
          <div class="tafseer-ayah-links">
            <a href="/t-${surahNum}-${book.id}-${a.numberInSurah}" class="ayah-meta-chip">رابط مستقل للآية</a>
            <button type="button" class="ayah-tool-btn" data-play-surah="${surahNum}" data-play-ayah="${a.numberInSurah}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              <span>استماع</span>
            </button>
          </div>
        </div>
        <div class="tafseer-arabic-verse quran-reading-text" dir="rtl">
          ${escapeHtml(a.text)} ﴿${renderIntervalsToArabicDigits(a.numberInSurah)}﴾
        </div>
        <div class="tafseer-explanation-box">
          <div class="tafseer-book-badge">${escapeHtml(book.nameAr)} (${escapeHtml(book.authorAr)})</div>
          <p>${escapeHtml(a.tafseerText || 'التفسير متاح عبر القائمة التفاعلية لكل آية.')}</p>
        </div>
      </article>`;
    })
    .join('\n');

  const bodyContent = `
    <section class="page-hero container">
      <div class="page-hero-card">
        <h1>${escapeHtml(book.nameAr)} / سورة ${escapeHtml(surahDetail.meta.nameAr)}</h1>
        <p>${escapeHtml(book.descriptionAr)} (${escapeHtml(book.authorAr)})</p>

        <div class="tafseer-books-bar">
          <div class="segmented-pills">${booksTabsHtml}</div>
        </div>

        <div class="tafseer-surah-quick-pills">
          ${SURAHS_META.slice(0, 18)
            .map(
              (s) =>
                `<a href="/t-${s.number}-${book.id}-1" class="filter-chip ${s.number === surahNum ? 'active' : ''}">سورة ${escapeHtml(s.nameAr)}</a>`
            )
            .join('\n')}
          <a href="/surah-${surahNum}" class="btn-outline-sm">العودة لصفحة السورة الكاملة</a>
        </div>
      </div>
    </section>

    <section class="container tafseer-list-section">
      ${ayahsTafseerHtml}
    </section>
  `;

  return renderLayout({
    title: `${book.nameAr} | سورة ${surahDetail.meta.nameAr} | كلام الله`,
    canonicalPath: opts.ayahNumber ? `/t-${surahNum}-${book.id}-${opts.ayahNumber}` : `/tafseer-${book.id}`,
    activeNav: 'tafseer',
    bodyContent,
    pageBootstrapData: {
      pageType: 'tafseer',
      bookId: book.id,
      surahNumber: surahNum,
    },
  });
}

export function renderTajweedGuidePage(): string {
  const rulesHtml = TAJWEED_RULES.map(
    (r) => `<article class="tajweed-rule-card" style="--rule-color: ${r.printedColor}">
      <div class="tr-top">
        <span class="tr-category">${escapeHtml(r.categoryAr)}</span>
        <span class="tr-color-pill" style="background: ${r.printedColor}">لون الحكم</span>
      </div>
      <h2>${escapeHtml(r.nameAr)}</h2>
      <p class="tr-en">${escapeHtml(r.nameEn)}</p>
      <p class="tr-desc">${escapeHtml(r.descriptionAr)}</p>
      <div class="tr-example-box quran-reading-text" dir="rtl">
        <span>${escapeHtml(r.exampleAr)}</span>
        <small>${escapeHtml(r.exampleRef)}</small>
      </div>
    </article>`
  ).join('\n');

  const bodyContent = `
    <section class="page-hero container">
      <div class="page-hero-card">
        <h1>أحكام التجويد الملون وضبط التلاوة</h1>
        <p>دليل تطبيقي لأحكام النون الساكنة والتنوين، المدود، القلقلة، والتفخيم والترقيق مع أمثلة مباشرة من القرآن الكريم.</p>
      </div>
    </section>

    <section class="container">
      <div class="tajweed-rules-grid">
        ${rulesHtml}
      </div>
    </section>
  `;

  return renderLayout({
    title: 'دليل أحكام التجويد الملون | كلام الله',
    canonicalPath: '/tajweed',
    activeNav: 'tajweed',
    bodyContent,
  });
}

export async function renderLanguagesPage(activeLangCode?: string): Promise<string> {
  const activeEdition =
    TRANSLATION_EDITIONS.find((e) => e.code === activeLangCode) ?? TRANSLATION_EDITIONS[0]!;
  const sampleSurah = await fetchSurahDetail(1, activeEdition.editionId);

  const editionsHtml = TRANSLATION_EDITIONS.map(
    (e) => `<a href="/language-${e.code}" class="lang-edition-card ${e.code === activeEdition.code ? 'active' : ''}">
      <div class="le-top">
        <span class="le-code">${escapeHtml(e.code.toUpperCase())}</span>
        <strong>${escapeHtml(e.languageNameEn)}</strong>
      </div>
      <h3>${escapeHtml(e.languageNameAr)}</h3>
      <p>${escapeHtml(e.translatorName)}</p>
    </a>`
  ).join('\n');

  const sampleVersesHtml = sampleSurah.ayahs
    .map(
      (a) => `<div class="lang-sample-row">
        <p class="quran-reading-text" dir="rtl">${escapeHtml(a.text)} ﴿${renderIntervalsToArabicDigits(a.numberInSurah)}﴾</p>
        <p class="lang-sample-trans" dir="${activeEdition.dir}">${escapeHtml(a.translationText || '')}</p>
      </div>`
    )
    .join('\n');

  const bodyContent = `
    <section class="page-hero container">
      <div class="page-hero-card">
        <h1>ترجمات معاني القرآن الكريم للغات العالمية</h1>
        <p>اختر اللغة لاستعراض ترجمة معاني الآيات الكريمة جنباً إلى جنب مع النص القرآني بالرسم العثماني.</p>
      </div>
    </section>

    <section class="container">
      <div class="lang-editions-grid">
        ${editionsHtml}
      </div>

      <div class="lang-preview-panel">
        <div class="lang-preview-header">
          <h2>نموذج الترجمة المختارة: ${escapeHtml(activeEdition.languageNameAr)} (${escapeHtml(activeEdition.translatorName)})</h2>
          <a href="/surah-1" class="btn-primary-gold sm">فتح القارئ الكامل</a>
        </div>
        <div class="lang-samples-list">
          ${sampleVersesHtml}
        </div>
      </div>
    </section>
  `;

  return renderLayout({
    title: `ترجمات معاني القرآن الكريم (${activeEdition.languageNameAr}) | كلام الله`,
    canonicalPath: activeLangCode ? `/language-${activeEdition.code}` : '/languages',
    activeNav: 'languages',
    bodyContent,
  });
}
