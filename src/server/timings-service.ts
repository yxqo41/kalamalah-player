import { findReciter, getSurahAudioUrl, type ReciterInfo } from './reciters-catalog';

export interface WordTimingSegment {
  wordIndex: number; // 0-based index of word in the ayah
  startMs: number;
  endMs: number;
}

export interface AyahTimingSegment {
  ayah: number; // 1-based ayah number in surah
  startMs: number;
  endMs: number;
  words?: WordTimingSegment[];
}

export interface NormalizedSurahTimings {
  reciterSlug: string;
  surahNumber: number;
  audioUrl: string;
  mode: 'word' | 'ayah' | 'none';
  source: string;
  ayahs: AyahTimingSegment[];
}

const timingsMemoryCache = new Map<string, NormalizedSurahTimings>();

/**
 * Multi-source Quran Timings Resolver:
 * 1. api.kalamalah.com/api/timing/{reciter}/murattal/{surah} (Word-by-Word & Ayah JSON)
 * 2. api.qurancdn.com/api/qdc/audio/reciters/{id}/audio_files?chapter={surah}&segments=true (Quran.com Word-by-Word JSON)
 * 3. quran.islamonline.net/data/timings/{slug}/{surah_3digit}.txt (Line-by-line millisecond timings)
 * 4. mp3quran.net/api/v3/ayat_timing?surah={surah}&read={readId} (Ayah millisecond timings)
 */
export async function resolveSurahTimings(
  reciterIdOrSlug: string | number,
  surahNumber: number
): Promise<NormalizedSurahTimings> {
  const reciter = findReciter(reciterIdOrSlug);
  const surah = Math.max(1, Math.min(114, Math.floor(surahNumber)));
  const cacheKey = `${reciter.slug}:${surah}`;

  const cached = timingsMemoryCache.get(cacheKey);
  if (cached) return cached;

  const defaultAudioUrl = getSurahAudioUrl(reciter, surah);

  // Source 1: Kalamalah API Word-by-Word / Ayah JSON timings
  if (reciter.kalamalahSlug) {
    try {
      const url = `https://api.kalamalah.com/api/timing/${reciter.kalamalahSlug}/murattal/${surah}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const json = (await res.json()) as any;
        const parsed = parseKalamalahTimingsJson(json, reciter, surah, defaultAudioUrl);
        if (parsed && parsed.ayahs.length > 0) {
          timingsMemoryCache.set(cacheKey, parsed);
          return parsed;
        }
      }
    } catch {
      // Proceed to next configured source
    }
  }

  // Source 2: Quran.com (api.qurancdn.com) Word-by-Word segments
  if (reciter.qurancdnId) {
    try {
      const url = `https://api.qurancdn.com/api/qdc/audio/reciters/${reciter.qurancdnId}/audio_files?chapter=${surah}&segments=true`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const json = (await res.json()) as any;
        const parsed = parseQuranCdnTimingsJson(json, reciter, surah, defaultAudioUrl);
        if (parsed && parsed.ayahs.length > 0) {
          timingsMemoryCache.set(cacheKey, parsed);
          return parsed;
        }
      }
    } catch {
      // Proceed to next configured source
    }
  }

  // Source 3: quran.islamonline.net/data/timings/{slug}/{001..114}.txt (millisecond line-by-line format)
  if (reciter.islamOnlineTimingSlug) {
    try {
      const padded = String(surah).padStart(3, '0');
      const url = `https://quran.islamonline.net/data/timings/${reciter.islamOnlineTimingSlug}/${padded}.txt`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const txt = await res.text();
        const parsed = parseIslamOnlineTxtTimings(txt, reciter, surah, defaultAudioUrl);
        if (parsed && parsed.ayahs.length > 0) {
          timingsMemoryCache.set(cacheKey, parsed);
          return parsed;
        }
      }
    } catch {
      // Proceed to next configured source
    }
  }

  // Source 4: mp3quran.net/api/v3/ayat_timing?surah={surah}&read={readId}
  if (reciter.mp3QuranReadId) {
    try {
      const url = `https://mp3quran.net/api/v3/ayat_timing?surah=${surah}&read=${reciter.mp3QuranReadId}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const json = (await res.json()) as any;
        const parsed = parseMp3QuranTimingsJson(json, reciter, surah, defaultAudioUrl);
        if (parsed && parsed.ayahs.length > 0) {
          timingsMemoryCache.set(cacheKey, parsed);
          return parsed;
        }
      }
    } catch {
      // Fall through
    }
  }

  const emptyResult: NormalizedSurahTimings = {
    reciterSlug: reciter.slug,
    surahNumber: surah,
    audioUrl: defaultAudioUrl,
    mode: 'none',
    source: 'audio-only',
    ayahs: [],
  };
  return emptyResult;
}

function parseKalamalahTimingsJson(
  json: any,
  reciter: ReciterInfo,
  surah: number,
  defaultAudioUrl: string
): NormalizedSurahTimings | null {
  const data = json?.data ?? json;
  const rawList =
    data?.recitation_timings ??
    data?.ayahs ??
    data?.verses ??
    data?.timings ??
    data?.verse_timings ??
    (Array.isArray(data) ? data : null);
  if (!Array.isArray(rawList) || rawList.length === 0) return null;

  let hasWords = false;
  const ayahs: AyahTimingSegment[] = [];

  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    const verseStr = typeof item.verse === 'string' ? item.verse : typeof item.verse_key === 'string' ? item.verse_key : '';
    const ayahNum = Number(
      item.ayah ??
        item.ayah_number ??
        item.verse_number ??
        (verseStr.includes(':') ? verseStr.split(':')[1] : i + 1)
    );
    if (!ayahNum || ayahNum < 1) continue;

    const ts = item.timestamps ?? item;
    const startMs = Number(ts.start_ms ?? item.start_ms ?? item.timestamp_from ?? item.start ?? item.startTime ?? 0);
    const nextItem = rawList[i + 1];
    const nextTs = nextItem?.timestamps ?? nextItem;
    const nextStart = nextTs ? Number(nextTs.start_ms ?? nextItem?.start_ms ?? nextItem?.timestamp_from ?? startMs + 5000) : startMs + 6000;
    const endMs = Number(ts.end_ms ?? item.end_ms ?? item.timestamp_to ?? item.end ?? item.endTime ?? nextStart);

    const rawSegments = item.audio_segments ?? item.segments ?? item.words ?? [];
    const words: WordTimingSegment[] = [];

    if (Array.isArray(rawSegments)) {
      for (const seg of rawSegments) {
        if (Array.isArray(seg) && seg.length >= 3) {
          // Format: [word_index_1based, start_ms, end_ms]
          const wIdx = Math.max(0, Number(seg[0]) - 1);
          const wStart = Number(seg[1]);
          const wEnd = Number(seg[2]);
          if (!Number.isNaN(wStart) && !Number.isNaN(wEnd) && wEnd >= wStart) {
            words.push({ wordIndex: wIdx, startMs: wStart, endMs: wEnd });
          }
        } else if (seg && typeof seg === 'object') {
          const wIdx = Math.max(0, Number(seg.word_index ?? seg.word ?? seg.index ?? words.length + 1) - 1);
          const wStart = Number(seg.start_ms ?? seg.start ?? seg.timestamp_from ?? 0);
          const wEnd = Number(seg.end_ms ?? seg.end ?? seg.timestamp_to ?? wStart + 350);
          words.push({ wordIndex: wIdx, startMs: wStart, endMs: wEnd });
        }
      }
    }

    if (words.length > 0) hasWords = true;
    ayahs.push({
      ayah: ayahNum,
      startMs,
      endMs: endMs > startMs ? endMs : startMs + 4500,
      words: words.length > 0 ? words : undefined,
    });
  }

  const metaAudioUrl = data?.metadata?.recitation_info?.audio_url ?? data?.audio_url;
  const cleanAudioUrl =
    typeof metaAudioUrl === 'string' && metaAudioUrl.includes('api.kalamalah.com/api/')
      ? metaAudioUrl.replace(/\.mp3$/i, '')
      : defaultAudioUrl;

  return {
    reciterSlug: reciter.slug,
    surahNumber: surah,
    audioUrl: cleanAudioUrl,
    mode: hasWords ? 'word' : 'ayah',
    source: 'api.kalamalah.com',
    ayahs,
  };
}

function parseQuranCdnTimingsJson(
  json: any,
  reciter: ReciterInfo,
  surah: number,
  defaultAudioUrl: string
): NormalizedSurahTimings | null {
  const audioFile = json?.audio_files?.[0] ?? json?.audio_file;
  const verseTimings = audioFile?.verse_timings;
  if (!Array.isArray(verseTimings) || verseTimings.length === 0) return null;

  let hasWords = false;
  const ayahs: AyahTimingSegment[] = [];

  for (let i = 0; i < verseTimings.length; i++) {
    const vt = verseTimings[i];
    const verseKey = String(vt.verse_key ?? `${surah}:${i + 1}`);
    const ayahNum = Number(verseKey.split(':')[1] ?? i + 1);
    const startMs = Number(vt.timestamp_from ?? 0);
    const endMs = Number(vt.timestamp_to ?? startMs + 5000);

    const words: WordTimingSegment[] = [];
    if (Array.isArray(vt.segments)) {
      for (const seg of vt.segments) {
        if (Array.isArray(seg) && seg.length >= 3) {
          const wIdx = Math.max(0, Number(seg[0]) - 1);
          const wStart = Number(seg[1]);
          const wEnd = Number(seg[2]);
          if (!Number.isNaN(wStart) && !Number.isNaN(wEnd) && wEnd >= wStart) {
            words.push({ wordIndex: wIdx, startMs: wStart, endMs: wEnd });
          }
        }
      }
    }

    if (words.length > 0) hasWords = true;
    ayahs.push({
      ayah: ayahNum,
      startMs,
      endMs: endMs > startMs ? endMs : startMs + 4500,
      words: words.length > 0 ? words : undefined,
    });
  }

  return {
    reciterSlug: reciter.slug,
    surahNumber: surah,
    audioUrl: audioFile?.audio_url ?? defaultAudioUrl,
    mode: hasWords ? 'word' : 'ayah',
    source: 'api.qurancdn.com',
    ayahs,
  };
}

/**
 * Parses quran.islamonline.net/data/timings/{reciter}/{001..114}.txt
 * Each line is a millisecond timestamp where line index i corresponds to Ayah (i + 1).
 */
export function parseIslamOnlineTxtTimings(
  txt: string,
  reciter: ReciterInfo,
  surah: number,
  defaultAudioUrl: string
): NormalizedSurahTimings | null {
  const lines = txt
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && /^\d+(\.\d+)?$/.test(l))
    .map((l) => Math.round(Number(l)));

  if (lines.length === 0) return null;

  const ayahs: AyahTimingSegment[] = [];
  for (let i = 0; i < lines.length; i++) {
    const startMs = lines[i]!;
    const nextMs = lines[i + 1];
    const endMs = nextMs !== undefined && nextMs > startMs ? nextMs : startMs + 6000;
    ayahs.push({
      ayah: i + 1,
      startMs,
      endMs,
    });
  }

  return {
    reciterSlug: reciter.slug,
    surahNumber: surah,
    audioUrl: defaultAudioUrl,
    mode: 'ayah',
    source: 'quran.islamonline.net',
    ayahs,
  };
}

function parseMp3QuranTimingsJson(
  json: any,
  reciter: ReciterInfo,
  surah: number,
  defaultAudioUrl: string
): NormalizedSurahTimings | null {
  if (!Array.isArray(json) || json.length === 0) return null;
  const ayahs: AyahTimingSegment[] = [];

  for (const row of json) {
    const ayahNum = Number(row.ayah);
    if (!ayahNum || ayahNum < 1) continue; // skip ayah 0 (isti'adha/basmalah intro)
    const startMs = Number(row.start_time ?? 0);
    const endMs = Number(row.end_time ?? startMs + 5000);
    ayahs.push({
      ayah: ayahNum,
      startMs,
      endMs: endMs > startMs ? endMs : startMs + 4500,
    });
  }

  if (ayahs.length === 0) return null;
  return {
    reciterSlug: reciter.slug,
    surahNumber: surah,
    audioUrl: defaultAudioUrl,
    mode: 'ayah',
    source: 'mp3quran.net',
    ayahs,
  };
}
