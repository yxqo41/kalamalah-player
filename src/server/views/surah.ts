import { getSurahMeta, type SurahDetail } from '../kalamalah-api';
import { findReciter } from '../reciters-catalog';
import { getMistakesForSurah, TAJWEED_RULES } from '../tajweed-mistakes-data';
import { escapeHtml, renderIntervalsToArabicDigits, renderLayout } from './layout';

export interface SurahViewOptions {
  surahDetail: SurahDetail;
  fromAyah?: number;
  toAyah?: number;
  initialReciterSlug?: string;
}

export function isSpokenQuranWord(token: string): boolean {
  // True only if token contains at least one base Arabic letter (excludes standalone waqf/sajda/hizb marks like ۛ ۖ ۗ ۚ ۞ ۩)
  return /[\u0621-\u064A\u066E-\u06D3\u06FA-\u06FF]/.test(token);
}

export function tokenizeAyahWordsHtml(text: string, ayahNumberInSurah: number): string {
  const tokens = text.trim().split(/\s+/);
  let spokenIdx = 0;
  return tokens
    .map((tok) => {
      if (!isSpokenQuranWord(tok)) {
        return `<span class="quran-waqf" data-raw-word="${escapeHtml(tok)}">${escapeHtml(tok)}</span>`;
      }
      const idx = spokenIdx++;
      return `<span class="quran-word" data-ayah="${ayahNumberInSurah}" data-word-idx="${idx}" data-raw-word="${escapeHtml(tok)}">${escapeHtml(tok)}</span>`;
    })
    .join(' ');
}

export function renderSurahPage(opts: SurahViewOptions): string {
  const { meta, ayahs } = opts.surahDetail;
  const fromAyah = opts.fromAyah ? Math.max(1, Math.min(meta.ayahCount, opts.fromAyah)) : 1;
  const toAyah = opts.toAyah ? Math.max(fromAyah, Math.min(meta.ayahCount, opts.toAyah)) : meta.ayahCount;
  const filteredAyahs = ayahs.filter((a) => a.numberInSurah >= fromAyah && a.numberInSurah <= toAyah);

  const activeReciter = findReciter(opts.initialReciterSlug ?? 'haitham-al-dukhin');
  const mistakes = getMistakesForSurah(meta.number);
  const mistakeByAyah = new Map(mistakes.map((m) => [m.ayah, m]));

  const prevSurah = meta.number > 1 ? getSurahMeta(meta.number - 1) : null;
  const nextSurah = meta.number < 114 ? getSurahMeta(meta.number + 1) : null;

  const isRangeFiltered = fromAyah > 1 || toAyah < meta.ayahCount;

  const ayahsListHtml = filteredAyahs
    .map((a) => {
      const arAyahNum = renderIntervalsToArabicDigits(a.numberInSurah);
      const mistake = mistakeByAyah.get(a.numberInSurah);
      const mistakeBadgeHtml = mistake
        ? `<a href="#mistake-${a.numberInSurah}" class="ayah-mistake-alert" title="تنبيه تلاوة">تنبيه</a>`
        : '';

      return `<article class="ayah-block" id="ayah-${a.numberInSurah}" data-ayah="${a.numberInSurah}" data-page="${a.page}" data-juz="${a.juz}" data-raw-arabic="${escapeHtml(a.text)}">
        <div class="ayah-block-header">
          <div class="ayah-meta-pills">
            <a href="/mushaf-${a.page}" class="ayah-meta-chip">ص ${renderIntervalsToArabicDigits(a.page)}</a>
            ${mistakeBadgeHtml}
          </div>

          <div class="ayah-action-buttons">
            <button type="button" class="ayah-tool-btn play-ayah-btn" data-play-ayah="${a.numberInSurah}" title="استماع" aria-label="تشغيل الآية ${a.numberInSurah}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </button>

            <button type="button" class="ayah-tool-btn tafseer-ayah-btn" data-open-tafseer="${a.numberInSurah}" title="التفسير">
              <span>التفسير</span>
            </button>

            <button type="button" class="ayah-tool-btn copy-ayah-btn" data-copy-ayah="${a.numberInSurah}" title="نسخ الآية">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            </button>

            <button type="button" class="ayah-tool-btn bookmark-ayah-btn" data-bookmark-ayah="${a.numberInSurah}" title="حفظ" aria-label="حفظ الآية ${a.numberInSurah}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
            </button>
          </div>
        </div>

        <div class="ayah-arabic-body quran-reading-text" dir="rtl">
          ${tokenizeAyahWordsHtml(a.text, a.numberInSurah)}
          <span class="ayah-end-symbol" data-ayah-marker="${a.numberInSurah}" title="الآية ${a.numberInSurah}">﴿${arAyahNum}﴾</span>
        </div>

        <div class="ayah-extras">
          <div class="ayah-translation ${a.translationText ? '' : 'hidden'}" dir="ltr" data-ayah-trans="${a.numberInSurah}">
            <p>${escapeHtml(a.translationText ?? '')}</p>
          </div>
          <div class="ayah-inline-tafseer hidden" data-inline-tafseer="${a.numberInSurah}">
            <div class="inline-tafseer-header">
              <strong class="inline-tafseer-book-name">التفسير الميسر (مجمع الملك فهد)</strong>
              <a href="/t-${meta.number}-1-${a.numberInSurah}" class="more-tafseer-link" data-tafseer-compare-link="${a.numberInSurah}">مقارنة التفاسير</a>
            </div>
            <p class="inline-tafseer-body-text">${escapeHtml(a.tafseerText ?? '')}</p>
          </div>
        </div>
      </article>`;
    })
    .join('\n');

  const mistakesSectionHtml =
    mistakes.length > 0
      ? `<section class="mistakes-section container" id="recitation-mistakes">
          <div class="mistakes-card">
            <div class="mistakes-header">
              <div>
                <h2 class="mistakes-title">أخطاء شائعة في تلاوة سورة ${escapeHtml(meta.nameAr)}</h2>
                <p class="mistakes-subtitle">تنبيهات أدائية وتجويدية لضبط الحركات ومخارج الحروف والمدود في آيات السورة.</p>
              </div>
              <a href="/tajweed" class="btn-outline-sm">دليل التجويد الكامل</a>
            </div>
            <div class="mistakes-grid">
              ${mistakes
                .map(
                  (m) => `<div class="mistake-item-card" id="mistake-${m.ayah}">
                    <div class="mistake-top-bar">
                      <span class="mistake-ayah-badge">الآية ${renderIntervalsToArabicDigits(m.ayah)}</span>
                      <button type="button" class="mistake-listen-correct-btn" data-play-ayah="${m.ayah}">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        <span>استمع للنطق الصحيح</span>
                      </button>
                    </div>
                    <div class="mistake-word-focus quran-reading-text">${escapeHtml(m.wordText)}</div>
                    <div class="mistake-comparison">
                      <div class="mistake-wrong">
                        <span class="mc-label">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
                          <span>الخطأ الشائع</span>
                        </span>
                        <p>${escapeHtml(m.wrongReading)}</p>
                      </div>
                      <div class="mistake-right">
                        <span class="mc-label">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                          <span>الصواب</span>
                        </span>
                        <p>${escapeHtml(m.correctReading)}</p>
                      </div>
                    </div>
                    <p class="mistake-explanation">${escapeHtml(m.explanationAr)}</p>
                  </div>`
                )
                .join('\n')}
            </div>
          </div>
        </section>`
      : '';

  const showBismillah = meta.number !== 1 && meta.number !== 9 && fromAyah === 1;

  const bodyContent = `
    <!-- Top Breadcrumbs Row -->
    <nav class="surah-breadcrumb-nav container" aria-label="مسار الصفحة">
      <div class="breadcrumb-trail">
        <a href="/" class="bc-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span>الرئيسية</span>
        </a>
        <span class="bc-sep">›</span>
        <a href="/#view-surah" class="bc-item">القرآن الكريم</a>
        <span class="bc-sep">›</span>
        <span class="bc-item current">سورة ${escapeHtml(meta.nameAr)}</span>
      </div>
    </nav>

    <!-- Surah Hero Card -->
    <section class="surah-hero container">
      <div class="surah-hero-card modern-quran-hero">
        <div class="surah-title-header">
          <h1 class="surah-display-title">سورة ${escapeHtml(meta.nameAr)}</h1>
          <div class="surah-hero-badges-row">
            <span class="hero-meta-badge" title="مكان النزول">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              <span id="hero-rev-text">${meta.revelationAr}</span>
            </span>
            <span class="hero-meta-badge" title="عدد الآيات">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              <span id="hero-ayah-count-text">${renderIntervalsToArabicDigits(meta.ayahCount)} آيات</span>
            </span>
          </div>
        </div>

        <!-- Quick Reciter Bar & Action Buttons -->
        <div class="surah-compact-action-row">
          <button type="button" id="open-share-modal-btn" class="surah-square-btn share-btn" title="مشاركة السورة" aria-label="مشاركة">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </button>

          <div class="surah-reciter-combobox-wrap">
            <label id="surah-reciter-dd-lbl" class="sr-only">القارئ المختار</label>
            <div id="surah-reciter-dropdown" data-sd-label="surah-reciter-dd-lbl" data-initial-reciter="${escapeHtml(activeReciter.slug)}"></div>
          </div>

          <button type="button" id="surah-filter-shortcut-btn" class="surah-square-btn filter-btn" title="تصفية الآيات" aria-label="تصفية الآيات">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          </button>
        </div>

        <!-- Hero Reciter Big Banner (Matching Screenshot 1:1) -->
        <div class="surah-listen-hero-box">
          <h2 class="surah-listen-hero-title">
            الاستماع لسورة ${escapeHtml(meta.nameAr)} بصوت القارئ <span id="hero-reciter-name-display">${escapeHtml(activeReciter.nameAr)}</span>
          </h2>
          <div class="surah-listen-cta-wrap">
            <button type="button" id="surah-hero-play-btn" class="surah-listen-pill-btn" data-play-surah="${meta.number}" data-play-reciter="${escapeHtml(activeReciter.slug)}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <span>استمع</span>
            </button>

            <a id="surah-download-btn" href="/api/download/${escapeHtml(activeReciter.slug)}/${meta.number}" class="btn-glass-sm" title="تحميل تلاوة السورة (MP3)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span data-i18n="btnDownload">تحميل MP3</span>
            </a>
          </div>
        </div>

        ${
          isRangeFiltered
            ? `<div class="range-active-banner" data-from="${fromAyah}" data-to="${toAyah}">
                <span id="range-banner-label">الآيات ${renderIntervalsToArabicDigits(fromAyah)} - ${renderIntervalsToArabicDigits(toAyah)}</span>
                <a href="/surah-${meta.number}" class="btn-outline-sm" data-i18n="showFullSurah">عرض السورة كاملة</a>
              </div>`
            : ''
        }
      </div>
    </section>

    <!-- Reading Settings & Interactive Tools Bar -->
    <section class="reading-toolbar-section container" id="reading-toolbar-section">
      <div class="reading-toolbar-collapsible-header">
        <button type="button" id="reading-toolbar-toggle-btn" class="reading-toolbar-collapse-trigger" aria-expanded="true" aria-controls="reading-toolbar-content" title="طي / توسيع شريط إعدادات القراءة">
          <div class="rtc-title-group">
            <svg class="rtc-settings-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
            <span class="rtc-main-label">إعدادات القراءة</span>
          </div>
          <span class="rtc-collapse-indicator">
            <svg class="rtc-arrow-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </span>
        </button>
      </div>

      <div id="reading-toolbar-content" class="reading-toolbar-collapsible-body">
        <div class="reading-toolbar">
        <div class="toolbar-group">
            <!-- Reading Fonts: Uthmani (Primary), Kitab, Amiri, Nastaleeq (Last) -->
          <div class="segmented-pills" role="group" aria-label="اختيار خط القراءة">
            <button type="button" class="seg-pill active" data-set-reading-font="uthmani">عثماني</button>
            <button type="button" class="seg-pill" data-set-reading-font="kitab">كتاب</button>
            <button type="button" class="seg-pill" data-set-reading-font="amiri">أميري</button>
            <button type="button" class="seg-pill" data-set-reading-font="nastaleeq">نستعليق</button>
          </div>

          <div class="stepper-box">
            <button type="button" id="font-size-dec" class="stepper-btn" title="تصغير الخط" aria-label="تصغير الخط">-</button>
            <span id="font-size-val" class="stepper-val">100%</span>
            <button type="button" id="font-size-inc" class="stepper-btn" title="تكبير الخط" aria-label="تكبير الخط">+</button>
          </div>

          <div class="segmented-pills" role="group" aria-label="نمط عرض الآيات">
            <button type="button" class="seg-pill active" data-reader-view="cards">آيات</button>
            <button type="button" class="seg-pill" data-reader-view="mushaf-flow">متصل</button>
            <button type="button" class="seg-pill" data-reader-view="tafseer-open">تفسير</button>
          </div>
        </div>

        <div class="toolbar-group toolbar-toggles">
          <button type="button" id="tajweed-color-toggle" class="tool-toggle-btn" aria-pressed="false">
            <span>التجويد</span>
          </button>

          <button type="button" id="diacritics-panel-toggle" class="tool-toggle-btn" aria-expanded="false">
            <span>التشكيل</span>
          </button>

          <button type="button" id="memorization-panel-toggle" class="tool-toggle-btn" aria-expanded="false">
            <span>الحفظ</span>
          </button>

          <button type="button" id="range-filter-toggle" class="tool-toggle-btn" aria-expanded="false">
            <span>النطاق</span>
          </button>
        </div>
      </div>

      <!-- Translation, Tafseer, & Quick Ayah Jump Bar -->
      <div class="surah-edition-selectors-bar">
        <div class="edition-picker-col">
          <label id="surah-trans-dd-lbl" class="edition-picker-label" data-i18n="btnTranslation">الترجمة</label>
          <div id="surah-translation-dropdown" data-sd-label="surah-trans-dd-lbl"></div>
        </div>
        <div class="edition-picker-col">
          <label id="surah-tafseer-dd-lbl" class="edition-picker-label" data-i18n="navTafseer">التفسير</label>
          <div id="surah-tafseer-dropdown" data-sd-label="surah-tafseer-dd-lbl"></div>
        </div>
        <div class="edition-picker-col">
          <label id="surah-ayah-jump-lbl" class="edition-picker-label" data-i18n="jumpToAyah">انتقل إلى آية</label>
          <div id="surah-ayah-jump-dropdown" data-sd-label="surah-ayah-jump-lbl" data-ayah-count="${meta.ayahCount}"></div>
        </div>
      </div>

      <!-- Collapsible Subpanel 1: Tajweed Legend & Schema -->
      <div id="tajweed-settings-panel" class="tool-subpanel hidden">
        <div class="subpanel-header">
          <strong>نظام تلوين أحكام التجويد</strong>
          <div class="segmented-pills">
            <button type="button" class="seg-pill active" data-tajweed-schema="printed">ألوان المصحف المطبوع (مبسط)</button>
            <button type="button" class="seg-pill" data-tajweed-schema="alquran">تفصيلي موسع</button>
          </div>
        </div>
        <div class="tajweed-legend-pills">
          ${TAJWEED_RULES.map(
            (r) => `<span class="tj-legend-item" style="--tj-color: ${r.printedColor}">
              <i class="tj-swatch"></i>
              <span>${escapeHtml(r.nameAr)}</span>
            </span>`
          ).join('\n')}
        </div>
      </div>

      <!-- Collapsible Subpanel 2: Diacritics / Tashkeel Filter -->
      <div id="diacritics-settings-panel" class="tool-subpanel hidden">
        <div class="subpanel-header">
          <strong>مستوى عرض التشكيل وعلامات الوقف</strong>
          <div class="segmented-pills">
            <button type="button" class="seg-pill active" data-tashkeel-preset="all">التشكيل الكامل</button>
            <button type="button" class="seg-pill" data-tashkeel-preset="basic-only">الحركات الأساسية فقط</button>
            <button type="button" class="seg-pill" data-tashkeel-preset="no-waqf">إخفاء علامات الوقف</button>
            <button type="button" class="seg-pill" data-tashkeel-preset="rasm-only">رسم الكلمات بدون تشكيل</button>
          </div>
        </div>
      </div>

      <!-- Collapsible Subpanel 3: Memorization Mode -->
      <div id="memorization-settings-panel" class="tool-subpanel hidden">
        <div class="subpanel-header">
          <strong>وضع اختبار الحفظ (اضغط على أي كلمة مخفية لإظهارها)</strong>
          <div class="segmented-pills">
            <button type="button" class="seg-pill active" data-memo-density="0">إيقاف الإخفاء</button>
            <button type="button" class="seg-pill" data-memo-density="0.25">إخفاء ٢٥٪</button>
            <button type="button" class="seg-pill" data-memo-density="0.5">إخفاء ٥٠٪</button>
            <button type="button" class="seg-pill" data-memo-density="0.75">إخفاء ٧٥٪</button>
            <button type="button" class="seg-pill" data-memo-density="1">إخفاء جميع الكلمات</button>
          </div>
          <button type="button" id="memo-reveal-all-btn" class="btn-outline-sm">إظهار الكل مؤقتاً</button>
        </div>
      </div>

      <!-- Collapsible Subpanel 4: Ayah Range Filter & In-Surah Search -->
      <div id="range-settings-panel" class="tool-subpanel hidden">
        <div class="range-filter-form">
          <div class="range-inputs">
            <label>من الآية
              <input type="number" id="range-from-input" min="1" max="${meta.ayahCount}" value="${fromAyah}" />
            </label>
            <label>إلى الآية
              <input type="number" id="range-to-input" min="1" max="${meta.ayahCount}" value="${toAyah}" />
            </label>
            <button type="button" id="apply-range-btn" class="btn-primary-gold sm" data-surah="${meta.number}">تطبيق النطاق</button>
          </div>
          <div class="in-surah-search">
            <input type="search" id="in-surah-search-input" placeholder="ابحث عن كلمة داخل سورة ${escapeHtml(meta.nameAr)}..." aria-label="ابحث داخل السورة" />
          </div>
        </div>
      </div>
      </div>
    </section>

    <!-- Main Quran Reader Container -->
    <section class="surah-reader-section container">
      ${
        showBismillah
          ? `<div class="bismillah-banner quran-reading-text" aria-label="بسم الله الرحمن الرحيم">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </div>`
          : ''
      }

      <div id="surah-ayahs-wrapper" class="surah-ayahs-wrapper" data-surah-number="${meta.number}" data-surah-name-ar="${escapeHtml(meta.nameAr)}" data-surah-name-en="${escapeHtml(meta.nameEn)}">
        ${ayahsListHtml}
      </div>
    </section>

    ${mistakesSectionHtml}

    <!-- Next / Previous Surah Footer Pagination -->
    <nav class="surah-pagination container" aria-label="التنقل بين السور">
      ${
        prevSurah
          ? `<a href="/surah-${prevSurah.number}" class="pagination-card prev">
              <span class="pag-dir">السورة السابقة</span>
              <strong>سورة ${escapeHtml(prevSurah.nameAr)} (${escapeHtml(prevSurah.nameEn)})</strong>
            </a>`
          : `<div></div>`
      }
      <a href="/mushaf-${meta.startPage}" class="pagination-card center">
        <span class="pag-dir">المصحف الشريف</span>
        <strong>قراءة من صفحة ${renderIntervalsToArabicDigits(meta.startPage)}</strong>
      </a>
      ${
        nextSurah
          ? `<a href="/surah-${nextSurah.number}" class="pagination-card next">
              <span class="pag-dir">السورة التالية</span>
              <strong>سورة ${escapeHtml(nextSurah.nameAr)} (${escapeHtml(nextSurah.nameEn)})</strong>
            </a>`
          : `<div></div>`
      }
    </nav>
  `;

  return renderLayout({
    title: `سورة ${meta.nameAr} (${meta.nameEn}) | تلاوة وتفسير وتجويد | كلام الله`,
    description: `استمع واقرأ سورة ${meta.nameAr} كاملة بالرسم العثماني مع التزامن الدقيق للكلمات والآيات بصوت القارئ ${activeReciter.nameAr} والتفسير الميسر.`,
    canonicalPath: isRangeFiltered
      ? `/view-${meta.number},from-${fromAyah},to-${toAyah}`
      : `/surah-${meta.number}`,
    activeNav: 'surahs',
    bodyContent,
    pageBootstrapData: {
      pageType: 'surah',
      surahNumber: meta.number,
      surahNameAr: meta.nameAr,
      surahNameEn: meta.nameEn,
      initialReciterSlug: activeReciter.slug,
      fromAyah,
      toAyah,
      ayahs: ayahs.map((a) => ({
        n: a.numberInSurah,
        text: a.text,
        tr: a.translationText ?? '',
        taf: a.tafseerText ?? '',
      })),
    },
  });
}
