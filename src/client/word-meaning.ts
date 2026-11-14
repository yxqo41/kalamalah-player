import { escapeHtml, getActiveLocale } from './i18n';
import type { QuranPlayerController } from './quran-player';

interface WordMeaningEntry {
  text: string;
  transliteration: string;
  translation: string;
  audioUrl?: string;
}

const chapterWordsCache = new Map<string, Map<number, WordMeaningEntry[]>>();
let activeWordAudio: HTMLAudioElement | null = null;

async function getChapterWordsMap(
  surahNum: number,
  langCode: string
): Promise<Map<number, WordMeaningEntry[]> | null> {
  const apiLang = ['en', 'fr', 'tr', 'id', 'ur'].includes(langCode) ? langCode : 'en';
  const cacheKey = `${surahNum}:${apiLang}`;
  const hit = chapterWordsCache.get(cacheKey);
  if (hit) return hit;

  try {
    const url = `https://api.quran.com/api/v4/verses/by_chapter/${surahNum}?language=${encodeURIComponent(apiLang)}&words=true&word_fields=text_uthmani,transliteration,translation&per_page=300`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    const verses = json?.verses;
    if (!Array.isArray(verses)) return null;

    const byAyah = new Map<number, WordMeaningEntry[]>();
    for (const v of verses) {
      const aNum = Number(v.verse_number || 0);
      if (!aNum || !Array.isArray(v.words)) continue;
      const entries: WordMeaningEntry[] = v.words
        .filter((w: any) => w.char_type_name === 'word')
        .map((w: any) => ({
          text: String(w.text_uthmani || w.text || ''),
          transliteration: String(w.transliteration?.text || ''),
          translation: String(w.translation?.text || ''),
          audioUrl: w.audio_url ? `https://audio.qurancdn.com/${String(w.audio_url).replace(/^\/+/, '')}` : undefined,
        }));
      byAyah.set(aNum, entries);
    }
    chapterWordsCache.set(cacheKey, byAyah);
    return byAyah;
  } catch {
    return null;
  }
}

export function initWordMeaningPopover(player: QuranPlayerController): void {
  let popoverEl = document.getElementById('word-meaning-popover');
  if (!popoverEl) {
    popoverEl = document.createElement('div');
    popoverEl.id = 'word-meaning-popover';
    popoverEl.className = 'word-meaning-popover hidden';
    popoverEl.setAttribute('role', 'dialog');
    popoverEl.setAttribute('aria-label', 'Word Meaning');
    document.body.appendChild(popoverEl);
  }

  let activeWordEl: HTMLElement | null = null;

  const hidePopover = () => {
    popoverEl?.classList.add('hidden');
    if (activeWordEl) {
      activeWordEl.classList.remove('is-word-selected');
      activeWordEl = null;
    }
  };

  const positionPopover = (target: HTMLElement) => {
    if (!popoverEl) return;
    const rect = target.getBoundingClientRect();
    const popW = Math.min(280, window.innerWidth - 24);
    popoverEl.style.width = `${popW}px`;
    popoverEl.classList.remove('hidden');

    const popH = popoverEl.offsetHeight || 130;
    let left = rect.left + rect.width / 2 - popW / 2;
    left = Math.max(12, Math.min(window.innerWidth - popW - 12, left));

    let top = rect.bottom + 10;
    if (top + popH > window.innerHeight - 12 && rect.top - popH - 10 > 12) {
      top = rect.top - popH - 10;
    }
    popoverEl.style.left = `${left}px`;
    popoverEl.style.top = `${top}px`;
  };

  document.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    if (popoverEl?.contains(target)) {
      const closeBtn = target.closest('[data-wmp-close]');
      if (closeBtn) hidePopover();
      return;
    }

    const wordEl = target.closest<HTMLElement>('.quran-word');
    if (!wordEl) {
      hidePopover();
      return;
    }

    // Do not open meaning popover if word is hidden in memorization test mode
    if (wordEl.classList.contains('is-memo-hidden') && !wordEl.classList.contains('is-memo-revealed')) {
      return;
    }

    // Only inside Surah reader or Mushaf/Juz reading text (skip inside fullscreen lyrics column where click seeks audio)
    if (wordEl.closest('#aml-ayahs-list')) {
      return;
    }

    const ayahNum = Number(wordEl.getAttribute('data-ayah') || 0);
    const wordIdx = Number(wordEl.getAttribute('data-word-idx') || -1);
    const surahSection = wordEl.closest<HTMLElement>('[data-surah-number], [data-surah]');
    const surahNum = Number(
      surahSection?.getAttribute('data-surah-number') ||
        surahSection?.getAttribute('data-surah') ||
        player.getCurrentSurahNumber() ||
        1
    );

    if (!ayahNum || wordIdx < 0) return;

    if (activeWordEl) activeWordEl.classList.remove('is-word-selected');
    activeWordEl = wordEl;
    activeWordEl.classList.add('is-word-selected');

    const rawWord = wordEl.getAttribute('data-raw-word') || wordEl.textContent || '';
    popoverEl.innerHTML = `
      <div class="wmp-head">
        <span class="wmp-arabic quran-reading-text" dir="rtl">${escapeHtml(rawWord)}</span>
        <button type="button" class="wmp-close" data-wmp-close aria-label="Close">×</button>
      </div>
      <div class="wmp-body">
        <span class="wmp-loading">Loading meaning...</span>
      </div>
    `;
    positionPopover(wordEl);

    const locale = getActiveLocale();
    const map = await getChapterWordsMap(surahNum, locale);
    const entry = map?.get(ayahNum)?.[wordIdx];

    if (activeWordEl !== wordEl) return;

    if (!entry) {
      popoverEl.innerHTML = `
        <div class="wmp-head">
          <span class="wmp-arabic quran-reading-text" dir="rtl">${escapeHtml(rawWord)}</span>
          <button type="button" class="wmp-close" data-wmp-close aria-label="Close">×</button>
        </div>
        <div class="wmp-body">
          <p class="wmp-meaning">Word meaning unavailable offline.</p>
          <div class="wmp-actions">
            <button type="button" class="wmp-btn" data-wmp-play-ayah>Play Ayah ${ayahNum}</button>
          </div>
        </div>
      `;
      positionPopover(wordEl);
      return;
    }

    popoverEl.innerHTML = `
      <div class="wmp-head">
        <span class="wmp-arabic quran-reading-text" dir="rtl">${escapeHtml(entry.text || rawWord)}</span>
        <button type="button" class="wmp-close" data-wmp-close aria-label="Close">×</button>
      </div>
      <div class="wmp-body">
        ${entry.transliteration ? `<div class="wmp-translit">${escapeHtml(entry.transliteration)}</div>` : ''}
        <p class="wmp-meaning">${escapeHtml(entry.translation || '—')}</p>
        <div class="wmp-actions">
          ${entry.audioUrl ? `<button type="button" class="wmp-btn" data-wmp-pronounce="${escapeHtml(entry.audioUrl)}">Pronounce</button>` : ''}
          <button type="button" class="wmp-btn secondary" data-wmp-play-ayah>Play Ayah ${ayahNum}</button>
        </div>
      </div>
    `;
    positionPopover(wordEl);

    popoverEl.querySelector<HTMLElement>('[data-wmp-pronounce]')?.addEventListener('click', (ev) => {
      const url = (ev.currentTarget as HTMLElement).getAttribute('data-wmp-pronounce');
      if (!url) return;
      try {
        activeWordAudio?.pause();
        activeWordAudio = new Audio(url);
        activeWordAudio.play().catch(() => {});
      } catch {}
    });

    popoverEl.querySelector<HTMLElement>('[data-wmp-play-ayah]')?.addEventListener('click', () => {
      player.playSurah(surahNum, undefined, ayahNum);
      hidePopover();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hidePopover();
  });
}
