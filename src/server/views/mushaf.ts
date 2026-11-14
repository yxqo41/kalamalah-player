import type { AyahItem, SurahMeta } from '../kalamalah-api';
import { escapeHtml, renderIntervalsToArabicDigits, renderLayout } from './layout';
import { tokenizeAyahWordsHtml } from './surah';

export interface MushafPageViewProps {
  page: number;
  juz: number;
  hizbQuarter: number;
  surahsOnPage: SurahMeta[];
  ayahs: AyahItem[];
}

export function renderMushafPageView(props: MushafPageViewProps): string {
  const { page, juz, hizbQuarter, surahsOnPage, ayahs } = props;
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < 604 ? page + 1 : null;
  const hizbNumber = Math.ceil(hizbQuarter / 4);

  const surahNamesTitle = surahsOnPage.map((s) => `سورة ${s.nameAr}`).join('، ') || 'المصحف الشريف';
  const primarySurah = surahsOnPage[0];

  const groupedBlocks: { surahNumber: number; surahNameAr: string; ayahs: AyahItem[] }[] = [];
  for (const a of ayahs) {
    const sNum = a.surahNumber ?? 1;
    const last = groupedBlocks[groupedBlocks.length - 1];
    if (!last || last.surahNumber !== sNum) {
      groupedBlocks.push({
        surahNumber: sNum,
        surahNameAr: a.surahNameAr ?? '',
        ayahs: [a],
      });
    } else {
      last.ayahs.push(a);
    }
  }

  const mushafLinesHtml = groupedBlocks
    .map((group) => {
      const startsSurah = group.ayahs[0]?.numberInSurah === 1;
      const showBismillah = startsSurah && group.surahNumber !== 1 && group.surahNumber !== 9;
      return `<div class="mushaf-surah-segment" data-surah="${group.surahNumber}">
        ${
          startsSurah
            ? `<div class="mushaf-ornate-surah-banner">
                <span>سُورَةُ ${escapeHtml(group.surahNameAr)}</span>
              </div>`
            : ''
        }
        ${
          showBismillah
            ? `<div class="mushaf-bismillah quran-reading-text">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>`
            : ''
        }
        <div class="mushaf-justified-flow quran-reading-text" dir="rtl">
          ${group.ayahs
            .map((a) => {
              const arNum = renderIntervalsToArabicDigits(a.numberInSurah);
              return `<span class="mushaf-inline-ayah" id="ayah-${group.surahNumber}-${a.numberInSurah}" data-surah="${group.surahNumber}" data-ayah="${a.numberInSurah}">
                ${tokenizeAyahWordsHtml(a.text, a.numberInSurah)}
                <button type="button" class="mushaf-ayah-medallion" data-play-surah="${group.surahNumber}" data-play-ayah="${a.numberInSurah}" title="تشغيل الآية ${a.numberInSurah}">﴿${arNum}﴾</button>
              </span>`;
            })
            .join(' ')}
        </div>
      </div>`;
    })
    .join('\n');

  const bodyContent = `
    <section class="mushaf-viewer-section container">
      <!-- Top Mushaf Toolbar -->
      <div class="mushaf-toolbar">
        <div class="mushaf-nav-Cluster">
          ${
            prevPage
              ? `<a href="/mushaf-${prevPage}" class="btn-glass-sm">الصفحة السابقة (${renderIntervalsToArabicDigits(prevPage)})</a>`
              : `<span class="btn-glass-sm disabled">البداية</span>`
          }

          <div class="mushaf-page-picker-wrap">
            <label id="mushaf-viewer-dd-lbl" class="sr-only">اختر صفحة المصحف</label>
            <div id="mushaf-page-dropdown" data-sd-label="mushaf-viewer-dd-lbl" data-current-page="${page}"></div>
          </div>

          ${
            nextPage
              ? `<a href="/mushaf-${nextPage}" class="btn-glass-sm">الصفحة التالية (${renderIntervalsToArabicDigits(nextPage)})</a>`
              : `<span class="btn-glass-sm disabled">النهاية</span>`
          }
        </div>

        <!-- Strictly 3 Reading Fonts Switcher + Tajweed Toggle -->
        <div class="mushaf-font-controls">
          <div class="segmented-pills" role="group" aria-label="خط المصحف">
            <button type="button" class="seg-pill active" data-set-reading-font="uthmani">عثماني</button>
            <button type="button" class="seg-pill" data-set-reading-font="kitab">كتاب</button>
            <button type="button" class="seg-pill" data-set-reading-font="amiri">أميري</button>
            <button type="button" class="seg-pill" data-set-reading-font="nastaleeq">نستعليق</button>
          </div>
          <button type="button" id="tajweed-color-toggle" class="tool-toggle-btn" aria-pressed="false">
            <span class="color-dot"></span>
            <span>تلوين التجويد</span>
          </button>
          ${
            primarySurah
              ? `<button type="button" class="btn-primary-gold sm" data-play-surah="${primarySurah.number}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  <span>تشغيل التلاوة</span>
                </button>`
              : ''
          }
        </div>
      </div>

      <!-- Authentic Framed Mushaf Page Sheet -->
      <article class="mushaf-sheet-frame">
        <header class="mushaf-sheet-header">
          <span class="mushaf-hdr-right">${escapeHtml(surahNamesTitle)}</span>
          <span class="mushaf-hdr-center">صفحة ${renderIntervalsToArabicDigits(page)}</span>
          <span class="mushaf-hdr-left">الجزء ${renderIntervalsToArabicDigits(juz)} / الحزب ${renderIntervalsToArabicDigits(hizbNumber)}</span>
        </header>

        <div class="mushaf-sheet-inner" id="surah-ayahs-wrapper" data-surah-number="${primarySurah?.number ?? 1}">
          ${mushafLinesHtml}
        </div>

        <footer class="mushaf-sheet-footer">
          <span>${renderIntervalsToArabicDigits(page)}</span>
        </footer>
      </article>

      <!-- Bottom Quick Page Flipper -->
      <nav class="mushaf-bottom-flipper" aria-label="تقليب صفحات المصحف">
        ${
          prevPage
            ? `<a href="/mushaf-${prevPage}" class="btn-glass">الصفحة السابقة (${renderIntervalsToArabicDigits(prevPage)})</a>`
            : `<span></span>`
        }
        <a href="/surah-${primarySurah?.number ?? 1}" class="btn-outline-sm">عرض مع التفسير والترجمة</a>
        ${
          nextPage
            ? `<a href="/mushaf-${nextPage}" class="btn-primary-gold">الصفحة التالية (${renderIntervalsToArabicDigits(nextPage)})</a>`
            : `<span></span>`
        }
      </nav>
    </section>
  `;

  return renderLayout({
    title: `صفحة ${page} من المصحف الشريف (${surahNamesTitle}) | كلام الله`,
    description: `قراءة صفحة ${page} من المصحف الشريف برواية حفص عن عاصم (${surahNamesTitle}، الجزء ${juz}) بخط عثماني وأميري وكتاب مع التلاوة المتزامنة.`,
    canonicalPath: `/mushaf-${page}`,
    activeNav: 'mushaf',
    bodyContent,
    pageBootstrapData: {
      pageType: 'mushaf',
      page,
      surahNumber: primarySurah?.number ?? 1,
      surahNameAr: primarySurah?.nameAr ?? 'الفاتحة',
    },
  });
}
