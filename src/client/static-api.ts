import type { NormalizedSurahTimings, AyahTimingSegment } from '../server/timings-service';
import type { BootstrapCatalog } from './quran-player';

const API_BASE = 'https://api.kalamalah.com';
const N8N_AI_WEBHOOK_URL =
  'https://n8n.srv787268.hstgr.cloud/webhook/0eaacdaa-e724-4565-b3b3-21b7f92a6059/chat';

let detectedStaticMode = false;

export function isStaticMode(): boolean {
  if (detectedStaticMode) return true;
  if (typeof window !== 'undefined' && (window as any).__KALAMALAH_STATIC__ === true) {
    return true;
  }
  return false;
}

export function markStaticMode(): void {
  detectedStaticMode = true;
}

async function fetchJsonOrNull<T>(url: string, timeoutMs = 8000): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('json') && !ct.includes('text/plain')) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function getReciterStaticAudioUrl(
  reciter: BootstrapCatalog['reciters'][number],
  surahNumber: number
): string {
  const padded = String(surahNumber).padStart(3, '0');
  if (reciter.kSlug && reciter.audioBase.includes('api.kalamalah.com/api/')) {
    return `https://api.kalamalah.com/api/${reciter.kSlug}/murattal/${padded}`;
  }
  if (reciter.audioBase) {
    if (reciter.audioBase.includes('verses.quran.com/Shatri')) {
      return `https://server11.mp3quran.net/shatri/${padded}.mp3`;
    }
    return `${reciter.audioBase.replace(/\/+$/, '')}/${padded}.mp3`;
  }
  return `https://cdn.islam-online.net/data/full/${reciter.iolSlug || reciter.slug}/${padded}.mp3`;
}

export function getDownloadUrl(
  reciter: BootstrapCatalog['reciters'][number],
  surahNumber: number
): string {
  if (isStaticMode()) {
    return getReciterStaticAudioUrl(reciter, surahNumber);
  }
  return `/api/download/${encodeURIComponent(reciter.slug)}/${surahNumber}`;
}

export function getAvatarProxyOrDirectUrl(
  reciter: BootstrapCatalog['reciters'][number]
): string {
  if (isStaticMode()) {
    return reciter.photo || `https://api.kalamalah.com/api/reciter-profile/${reciter.kSlug || reciter.slug}`;
  }
  return `/api/reciter-avatar/${encodeURIComponent(reciter.slug)}`;
}

export async function fetchSurahApi(
  surahNumber: number,
  translationEdition = 'en.sahih',
  tafseerEdition = 'ar.muyassar',
  catalog?: BootstrapCatalog,
  signal?: AbortSignal
): Promise<{
  ok: boolean;
  meta?: any;
  translationDir?: string;
  tafseerNameAr?: string;
  tafseerBookId?: number;
  ayahs: { n: number; text: string; tr: string; taf: string; p: number; j: number }[];
} | null> {
  if (!isStaticMode()) {
    try {
      const res = await fetch(
        `/api/surah/${surahNumber}?translation=${encodeURIComponent(translationEdition)}&tafseer=${encodeURIComponent(tafseerEdition)}`,
        { signal }
      );
      if (res.ok && (res.headers.get('content-type') || '').includes('json')) {
        return await res.json();
      }
      if (res.status === 404) markStaticMode();
    } catch {
      if (signal?.aborted) return null;
    }
  }

  // Client-side JS fallback (GitHub Pages / static build)
  const sMeta = catalog?.surahs?.find((s) => s.n === surahNumber);
  const [uthmaniRaw, transRes, tafRes] = await Promise.all([
    fetchJsonOrNull<any>(`${API_BASE}/api/quran/surah/${surahNumber}`).then(
      (r) => r ?? fetchJsonOrNull<any>(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`)
    ),
    fetchJsonOrNull<any>(
      `${API_BASE}/api/quran/surah/${surahNumber}?edition=${encodeURIComponent(translationEdition)}`
    ).then(
      (r) =>
        r ??
        fetchJsonOrNull<any>(
          `https://api.alquran.cloud/v1/surah/${surahNumber}/${encodeURIComponent(translationEdition)}`
        )
    ),
    fetchJsonOrNull<any>(
      `${API_BASE}/api/quran/surah/${surahNumber}?edition=${encodeURIComponent(tafseerEdition)}`
    ).then(
      (r) =>
        r ??
        fetchJsonOrNull<any>(
          `https://api.alquran.cloud/v1/surah/${surahNumber}/${encodeURIComponent(tafseerEdition)}`
        )
    ),
  ]);

  const rawAyahs =
    uthmaniRaw?.data?.ayahs ??
    uthmaniRaw?.ayahs ??
    (Array.isArray(uthmaniRaw?.data) ? uthmaniRaw.data : []);
  if (!Array.isArray(rawAyahs) || rawAyahs.length === 0) return null;

  const transAyahs = transRes?.data?.ayahs ?? transRes?.ayahs ?? [];
  const tafAyahs = tafRes?.data?.ayahs ?? tafRes?.ayahs ?? [];

  const ayahs = rawAyahs.map((a: any, i: number) => {
    let text = String(a.text ?? a.text_uthmani ?? '').replace(/^\uFEFF/, '').trim();
    if (i === 0 && surahNumber !== 1 && surahNumber !== 9) {
      const variants = [
        'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ',
        'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ',
        'بسم الله الرحمن الرحيم ',
      ];
      for (const b of variants) {
        if (text.startsWith(b) && text.length > b.length + 2) {
          text = text.slice(b.length).trim();
          break;
        }
      }
    }
    return {
      n: Number(a.numberInSurah ?? a.ayah_number ?? a.verse_number ?? i + 1),
      text,
      tr: String(transAyahs[i]?.text ?? ''),
      taf: String(tafAyahs[i]?.text ?? ''),
      p: Number(a.page ?? sMeta?.p ?? 1),
      j: Number(a.juz ?? sMeta?.j ?? 1),
    };
  });

  const transMeta = catalog?.translations?.find(
    (t: any) => t.editionId === translationEdition || t.code === translationEdition
  );
  const tafMeta = catalog?.tafseers?.find(
    (b: any) => b.editionId === tafseerEdition || String(b.id) === tafseerEdition
  );

  return {
    ok: true,
    meta: sMeta ? { number: sMeta.n, nameAr: sMeta.ar, nameEn: sMeta.en, ayahCount: sMeta.ay } : undefined,
    translationDir: transMeta?.dir ?? 'ltr',
    tafseerNameAr: tafMeta?.nameAr ?? '',
    tafseerBookId: tafMeta?.id ?? 1,
    ayahs,
  };
}

export async function fetchMushafPageApi(
  pageNumber: number,
  catalog?: BootstrapCatalog
): Promise<{
  page: number;
  juz: number;
  hizbQuarter: number;
  surahsOnPage: { n: number; ar: string; en: string }[];
  ayahs: { n: number; text: string; sNum: number; sAr: string; sEn: string; j: number; hq: number }[];
} | null> {
  const page = Math.max(1, Math.min(604, Math.floor(pageNumber)));
  let raw = await fetchJsonOrNull<any>(`${API_BASE}/api/quran/page/${page}`);
  let rawAyahs = raw?.data?.ayahs ?? raw?.ayahs;
  if (!Array.isArray(rawAyahs) || rawAyahs.length === 0) {
    raw = await fetchJsonOrNull<any>(`https://api.alquran.cloud/v1/page/${page}/quran-uthmani`);
    rawAyahs = raw?.data?.ayahs ?? [];
  }
  if (!Array.isArray(rawAyahs) || rawAyahs.length === 0) return null;

  const surahSet = new Map<number, { n: number; ar: string; en: string }>();
  const ayahs = rawAyahs.map((a: any, i: number) => {
    const sNum = Number(a.surah?.number ?? a.surah_number ?? 1);
    const sMeta = catalog?.surahs?.find((s) => s.n === sNum);
    const sAr = sMeta?.ar ?? a.surah?.name ?? '';
    const sEn = sMeta?.en ?? a.surah?.englishName ?? '';
    if (!surahSet.has(sNum)) surahSet.set(sNum, { n: sNum, ar: sAr, en: sEn });
    return {
      n: Number(a.numberInSurah ?? a.ayah_number ?? i + 1),
      text: String(a.text ?? ''),
      sNum,
      sAr,
      sEn,
      j: Number(a.juz ?? sMeta?.j ?? Math.ceil(page / 20)),
      hq: Number(a.hizbQuarter ?? 1),
    };
  });

  const first = ayahs[0];
  return {
    page,
    juz: first?.j ?? Math.ceil(page / 20),
    hizbQuarter: first?.hq ?? 1,
    surahsOnPage: Array.from(surahSet.values()),
    ayahs,
  };
}

export async function fetchJuzApi(
  juzNumber: number,
  catalog?: BootstrapCatalog
): Promise<{
  juz: number;
  groups: { surah: { n: number; ar: string; en: string; rev: string }; ayahs: { n: number; text: string }[] }[];
} | null> {
  const juz = Math.max(1, Math.min(30, Math.floor(juzNumber)));
  let raw = await fetchJsonOrNull<any>(`${API_BASE}/api/quran/juz/${juz}`);
  let rawAyahs = raw?.data?.ayahs ?? raw?.ayahs;
  if (!Array.isArray(rawAyahs) || rawAyahs.length === 0) {
    raw = await fetchJsonOrNull<any>(`https://api.alquran.cloud/v1/juz/${juz}/quran-uthmani`);
    rawAyahs = raw?.data?.ayahs ?? [];
  }
  if (!Array.isArray(rawAyahs) || rawAyahs.length === 0) return null;

  const groupMap = new Map<
    number,
    { surah: { n: number; ar: string; en: string; rev: string }; ayahs: { n: number; text: string }[] }
  >();
  for (let i = 0; i < rawAyahs.length; i++) {
    const a = rawAyahs[i];
    const sNum = Number(a.surah?.number ?? a.surah_number ?? 1);
    const sMeta = catalog?.surahs?.find((s) => s.n === sNum);
    let g = groupMap.get(sNum);
    if (!g) {
      g = {
        surah: {
          n: sNum,
          ar: sMeta?.ar ?? a.surah?.name ?? '',
          en: sMeta?.en ?? a.surah?.englishName ?? '',
          rev: sMeta?.rev ?? 'مكية',
        },
        ayahs: [],
      };
      groupMap.set(sNum, g);
    }
    g.ayahs.push({
      n: Number(a.numberInSurah ?? i + 1),
      text: String(a.text ?? ''),
    });
  }

  return { juz, groups: Array.from(groupMap.values()) };
}

export async function fetchTimingsApi(
  reciterSlug: string,
  surahNumber: number,
  catalog?: BootstrapCatalog,
  signal?: AbortSignal
): Promise<NormalizedSurahTimings | null> {
  if (!isStaticMode()) {
    try {
      const res = await fetch(`/api/timings/${encodeURIComponent(reciterSlug)}/${surahNumber}`, {
        signal,
      });
      if (res.ok && (res.headers.get('content-type') || '').includes('json')) {
        return (await res.json()) as NormalizedSurahTimings;
      }
      if (res.status === 404) markStaticMode();
    } catch {
      if (signal?.aborted) return null;
    }
  }

  const reciter =
    catalog?.reciters?.find((r) => r.slug === reciterSlug || String(r.id) === reciterSlug) ??
    catalog?.reciters?.[0];
  if (!reciter) return null;

  const defaultAudioUrl = getReciterStaticAudioUrl(reciter, surahNumber);

  // Source 1: Kalamalah API timings
  if (reciter.kSlug) {
    const json = await fetchJsonOrNull<any>(
      `${API_BASE}/api/timing/${reciter.kSlug}/murattal/${surahNumber}`,
      6000
    );
    const parsed = parseKalamalahTimings(json, reciter.slug, surahNumber, defaultAudioUrl);
    if (parsed && parsed.ayahs.length > 0) return parsed;
  }

  // Source 2: Quran.com QDC Word-by-Word
  if (reciter.qId) {
    const json = await fetchJsonOrNull<any>(
      `https://api.qurancdn.com/api/qdc/audio/reciters/${reciter.qId}/audio_files?chapter=${surahNumber}&segments=true`,
      6000
    );
    const parsed = parseQuranCdnTimings(json, reciter.slug, surahNumber, defaultAudioUrl);
    if (parsed && parsed.ayahs.length > 0) return parsed;
  }

  // Source 3: mp3quran.net ayah timings
  if (reciter.mp3Id) {
    const json = await fetchJsonOrNull<any>(
      `https://mp3quran.net/api/v3/ayat_timing?surah=${surahNumber}&read=${reciter.mp3Id}`,
      6000
    );
    const parsed = parseMp3QuranTimings(json, reciter.slug, surahNumber, defaultAudioUrl);
    if (parsed && parsed.ayahs.length > 0) return parsed;
  }

  return {
    reciterSlug: reciter.slug,
    surahNumber,
    audioUrl: defaultAudioUrl,
    mode: 'none',
    source: 'audio-only',
    ayahs: [],
  };
}

function parseKalamalahTimings(
  json: any,
  reciterSlug: string,
  surahNumber: number,
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
    const ayahNum = Number(item.ayah ?? item.ayah_number ?? item.verse_number ?? i + 1);
    const startMs = Number(item.start_ms ?? item.startMs ?? item.start_time ?? item.start ?? 0);
    const endMs = Number(item.end_ms ?? item.endMs ?? item.end_time ?? item.end ?? 0);
    const rawWords = item.words ?? item.word_timings ?? item.segments;
    let words: AyahTimingSegment['words'];
    if (Array.isArray(rawWords) && rawWords.length > 0) {
      hasWords = true;
      words = rawWords.map((w: any, idx: number) => {
        if (Array.isArray(w)) {
          return {
            wordIndex: Math.max(0, Number(w[0] ?? idx + 1) - 1),
            startMs: Number(w[1] ?? 0),
            endMs: Number(w[2] ?? 0),
          };
        }
        return {
          wordIndex: Number(w.word_index ?? w.wordIndex ?? idx),
          startMs: Number(w.start_ms ?? w.startMs ?? w.start ?? 0),
          endMs: Number(w.end_ms ?? w.endMs ?? w.end ?? 0),
        };
      });
    }
    ayahs.push({ ayah: ayahNum, startMs, endMs, words });
  }

  return {
    reciterSlug,
    surahNumber,
    audioUrl: data?.audio_url ?? data?.audioUrl ?? defaultAudioUrl,
    mode: hasWords ? 'word' : 'ayah',
    source: 'kalamalah',
    ayahs,
  };
}

function parseQuranCdnTimings(
  json: any,
  reciterSlug: string,
  surahNumber: number,
  defaultAudioUrl: string
): NormalizedSurahTimings | null {
  const file = json?.audio_files?.[0];
  const verseTimings = file?.verse_timings;
  if (!Array.isArray(verseTimings) || verseTimings.length === 0) return null;

  let hasWords = false;
  const ayahs: AyahTimingSegment[] = verseTimings.map((vt: any, idx: number) => {
    const keyParts = String(vt.verse_key ?? '').split(':');
    const ayahNum = Number(keyParts[1] ?? idx + 1);
    const startMs = Number(vt.timestamp_from ?? 0);
    const endMs = Number(vt.timestamp_to ?? 0);
    const rawSegs = vt.segments;
    let words: AyahTimingSegment['words'];
    if (Array.isArray(rawSegs) && rawSegs.length > 0) {
      hasWords = true;
      words = rawSegs
        .filter((s: any) => Array.isArray(s) && s.length >= 3)
        .map((s: any) => ({
          wordIndex: Math.max(0, Number(s[0]) - 1),
          startMs: Number(s[1]),
          endMs: Number(s[2]),
        }));
    }
    return { ayah: ayahNum, startMs, endMs, words };
  });

  return {
    reciterSlug,
    surahNumber,
    audioUrl: file?.audio_url ?? defaultAudioUrl,
    mode: hasWords ? 'word' : 'ayah',
    source: 'qurancdn',
    ayahs,
  };
}

function parseMp3QuranTimings(
  json: any,
  reciterSlug: string,
  surahNumber: number,
  defaultAudioUrl: string
): NormalizedSurahTimings | null {
  const list = Array.isArray(json) ? json : json?.ayahs ?? json?.data;
  if (!Array.isArray(list) || list.length === 0) return null;

  const ayahs: AyahTimingSegment[] = list
    .map((item: any) => ({
      ayah: Number(item.ayah ?? item.id ?? 0),
      startMs: Number(item.start_time ?? item.startMs ?? 0),
      endMs: Number(item.end_time ?? item.endMs ?? 0),
    }))
    .filter((a) => a.ayah > 0);

  if (ayahs.length === 0) return null;
  return {
    reciterSlug,
    surahNumber,
    audioUrl: defaultAudioUrl,
    mode: 'ayah',
    source: 'mp3quran',
    ayahs,
  };
}

export async function fetchTafseerAyahApi(
  bookId: number,
  surahNum: number,
  ayahNum: number,
  catalog?: BootstrapCatalog
): Promise<{
  ok: boolean;
  bookNameAr: string;
  authorAr: string;
  arabicText: string;
  tafseerText: string;
} | null> {
  if (!isStaticMode()) {
    try {
      const res = await fetch(`/api/tafseer/${bookId}/${surahNum}/${ayahNum}`);
      if (res.ok && (res.headers.get('content-type') || '').includes('json')) {
        return await res.json();
      }
      if (res.status === 404) markStaticMode();
    } catch {}
  }

  const book = catalog?.tafseers?.find((b: any) => Number(b.id) === bookId) ?? catalog?.tafseers?.[0];
  const editionId = book?.editionId || 'ar.muyassar';
  const detail = await fetchSurahApi(surahNum, 'en.sahih', editionId, catalog);
  const ayah = detail?.ayahs?.find((a) => a.n === ayahNum) ?? detail?.ayahs?.[0];
  return {
    ok: true,
    bookNameAr: book?.nameAr ?? 'التفسير الميسر',
    authorAr: book?.authorAr ?? '',
    arabicText: ayah?.text ?? '',
    tafseerText: ayah?.taf ?? '',
  };
}

export async function postAiChatApi(
  chatInput: string,
  sessionId: string
): Promise<{ ok: boolean; reply: string }> {
  if (!isStaticMode()) {
    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatInput, sessionId }),
      });
      if (res.ok && (res.headers.get('content-type') || '').includes('json')) {
        return await res.json();
      }
      if (res.status === 404 || res.status === 405) markStaticMode();
    } catch {}
  }

  // Direct JS webhook call for static GitHub Pages host
  try {
    const res = await fetch(N8N_AI_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*',
      },
      body: JSON.stringify({ action: 'sendMessage', sessionId, chatInput }),
      signal: AbortSignal.timeout(25000),
    });
    const rawText = await res.text();
    let reply = '';
    if (rawText.includes('{"type":"') && rawText.includes('"content":')) {
      let combined = '';
      for (const line of rawText.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const chunk = JSON.parse(trimmed);
          if (typeof chunk.content === 'string') combined += chunk.content;
          else if (typeof chunk.output === 'string') combined += chunk.output;
          else if (typeof chunk.reply === 'string') combined += chunk.reply;
        } catch {}
      }
      if (combined.trim()) reply = combined.trim();
    }
    if (!reply) {
      try {
        const parsed = JSON.parse(rawText);
        const item = Array.isArray(parsed) ? parsed[0] : parsed;
        reply =
          item?.output || item?.reply || item?.text || item?.message || item?.response || '';
      } catch {
        reply = rawText.trim();
      }
    }
    return {
      ok: true,
      reply: reply || 'بارك الله فيك، لم أتمكن من استخراج الإجابة حالياً.',
    };
  } catch {
    return {
      ok: false,
      reply: 'تعذر الاتصال بالمساعد الذكي حالياً، يرجى المحاولة مرة أخرى.',
    };
  }
}
