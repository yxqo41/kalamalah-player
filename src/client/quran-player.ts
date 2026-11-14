import gsap from 'gsap';
// @ts-ignore - Local WebGL dybg engine
import dybg from './dybg.js';
import type { NormalizedSurahTimings } from '../server/timings-service';
import { AmlAyahAnimator } from './aml-ayah-animator';
import { formatLocaleDigits, getActiveLocale, isRtlLocale, t } from './i18n';
import { colorizeArabicWordTajweed, toggleBookmarkAyah } from './reading-tools';
import { ScrollController } from './scroll-controller';
import {
  fetchSurahApi,
  fetchTimingsApi,
  getAvatarProxyOrDirectUrl,
  getDownloadUrl,
} from './static-api';

export interface BootstrapCatalog {
  surahs: {
    n: number;
    ar: string;
    en: string;
    ay: number;
    rev: string;
    p: number;
    j: number;
  }[];
  reciters: {
    id: number;
    slug: string;
    kSlug?: string;
    qId?: number;
    iolSlug?: string;
    mp3Id?: number;
    ar: string;
    en: string;
    riwayah: string;
    wbw: boolean;
    cc: boolean;
    audioBase: string;
    photo?: string;
  }[];
  tafseers?: { id: number; editionId: string; nameAr: string; authorAr: string }[];
  translations?: { code: string; editionId: string; languageNameAr: string; languageNameEn: string; dir: string }[];
  pageData?: {
    pageType?: string;
    surahNumber?: number;
    surahNameAr?: string;
    surahNameEn?: string;
    initialReciterSlug?: string;
    juz?: number;
    mushafPage?: number;
    ayahs?: { n: number; text: string; tr?: string; taf?: string }[];
  };
}

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
function toArDigits(n: number | string): string {
  return String(n).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)] ?? d);
}

function formatTimeSec(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export class QuranPlayerController {
  private audioEl: HTMLAudioElement;
  private catalog: BootstrapCatalog;
  private scrollController: ScrollController | null = null;
  private animator = new AmlAyahAnimator();

  private currentSurahNumber = 1;
  private currentReciterSlug = 'haitham-al-dukhin';
  private currentTimings: NormalizedSurahTimings | null = null;
  private currentAyahsData: { n: number; text: string; tr?: string; taf?: string }[] = [];

  private activeAyahNumber = 1;
  private syncOffsetMs = 0;
  private repeatMode: 'off' | 'surah' | 'ayah' = 'off';
  private speeds = [0.75, 1, 1.25, 1.5, 2];
  private speedIndex = 1;
  private showFullscreenTranslation = true;
  private showFullscreenTajweed = false;
  private fullscreenBgMode: 'dybg' | 'islamic' | 'off' = 'islamic';
  private islamicBgIndex = 0;
  private islamicActiveSlot: 'a' | 'b' = 'a';
  private islamicBgTimer: ReturnType<typeof setInterval> | null = null;

  private static readonly ISLAMIC_BACKGROUNDS: string[] = [
    // Kaaba & Masjid al-Haram (Makkah)
    'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?auto=format&fit=crop&w=1920&q=85',
    // Kaaba Tawaf Night Golden Glow
    'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1920&q=85',
    // Masjid an-Nabawi Green Dome & Umbrellas (Madinah)
    'https://images.unsplash.com/photo-1580418827493-f2b22c0a76cb?auto=format&fit=crop&w=1920&q=85',
    // Grand Mosque Architecture & Courtyards
    'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=1920&q=85',
    // Makkah Clock Tower & Haram Horizon
    'https://images.unsplash.com/photo-1537181534458-45dcee76ae90?auto=format&fit=crop&w=1920&q=85',
    // Islamic Mosque Dome & Sanctuary Lights
    'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1920&q=85',
  ];

  private rafId: number | null = null;
  private lastFrameTime = performance.now();
  private onReciterExternalChange?: (slug: string) => void;
  private dybgInstance: any = null;
  private lastDybgReciterSlug = '';
  private loadAbortController: AbortController | null = null;
  private wakeLockSentinel: any = null;
  private lastMediaPositionUpdateMs = 0;
  private pendingRestoreTimeSec = 0;
  private lastSavedPlaybackMs = 0;
  private static readonly PLAYBACK_STORAGE_KEY = 'kalamalah_last_playback_v1';

  constructor(catalog: BootstrapCatalog, onReciterExternalChange?: (slug: string) => void) {
    this.catalog = catalog;
    this.onReciterExternalChange = onReciterExternalChange;
    this.audioEl = document.getElementById('kalamalah-audio-el') as HTMLAudioElement;

    const amlScrollEl = document.getElementById('aml-scroll-container');
    if (amlScrollEl) {
      this.scrollController = new ScrollController(amlScrollEl);
      let userScrollTimer: ReturnType<typeof setTimeout> | null = null;
      const onUserScroll = () => {
        amlScrollEl.classList.add('HideLineBlur', 'is-user-scrolling');
        this.animator.setUserScrolling(true);
        if (userScrollTimer) clearTimeout(userScrollTimer);
        userScrollTimer = setTimeout(() => {
          amlScrollEl.classList.remove('HideLineBlur', 'is-user-scrolling');
          this.animator.setUserScrolling(false);
        }, 650);
      };
      amlScrollEl.addEventListener('wheel', onUserScroll, { passive: true });
      amlScrollEl.addEventListener('touchmove', onUserScroll, { passive: true });
    }
    try {
      const savedBg = localStorage.getItem('kalamalah_fs_bg_mode');
      if (savedBg === 'dybg' || savedBg === 'islamic' || savedBg === 'off') {
        this.fullscreenBgMode = savedBg;
      }
    } catch {}
    this.initDybgCanvas();
    this.applyFullscreenBgMode();

    let savedPlayback: {
      surahNumber?: number;
      reciterSlug?: string;
      timeSec?: number;
      ayahNumber?: number;
    } | null = null;
    try {
      const raw = localStorage.getItem(QuranPlayerController.PLAYBACK_STORAGE_KEY);
      if (raw) savedPlayback = JSON.parse(raw);
    } catch {}

    const pd = catalog.pageData;

    // Restore saved reciter unless explicitly overridden by /reader-{surah}-{reciter}
    if (pd?.initialReciterSlug && catalog.reciters.some((r) => r.slug === pd.initialReciterSlug)) {
      this.currentReciterSlug = pd.initialReciterSlug;
      try {
        localStorage.setItem('kalamalah_reciter_slug', pd.initialReciterSlug);
      } catch {}
    } else {
      const savedReciter =
        localStorage.getItem('kalamalah_reciter_slug') || savedPlayback?.reciterSlug;
      if (savedReciter && catalog.reciters.some((r) => r.slug === savedReciter)) {
        this.currentReciterSlug = savedReciter;
      }
    }

    // Restore last listened Surah & exact timestamp when returning (or resuming same Surah)
    if (pd?.pageType === 'surah' && pd?.surahNumber) {
      this.currentSurahNumber = pd.surahNumber;
      if (savedPlayback?.surahNumber === pd.surahNumber && (savedPlayback.timeSec || 0) > 1) {
        this.pendingRestoreTimeSec = savedPlayback.timeSec || 0;
        if (savedPlayback.ayahNumber && savedPlayback.ayahNumber > 1) {
          this.activeAyahNumber = savedPlayback.ayahNumber;
        }
        this.audioEl.preload = 'metadata';
      }
    } else if (
      savedPlayback?.surahNumber &&
      savedPlayback.surahNumber >= 1 &&
      savedPlayback.surahNumber <= 114
    ) {
      this.currentSurahNumber = savedPlayback.surahNumber;
      if ((savedPlayback.timeSec || 0) > 1) {
        this.pendingRestoreTimeSec = savedPlayback.timeSec || 0;
        if (savedPlayback.ayahNumber && savedPlayback.ayahNumber > 1) {
          this.activeAyahNumber = savedPlayback.ayahNumber;
        }
        this.audioEl.preload = 'metadata';
      }
    } else if (pd?.surahNumber) {
      this.currentSurahNumber = pd.surahNumber;
    }

    if (Array.isArray(pd?.ayahs) && pd.ayahs.length > 0) {
      this.currentAyahsData = pd.ayahs;
    }

    this.initMediaSessionHandlers();
    this.bindUIEvents();
    this.loadTrackMetadata(this.currentSurahNumber, this.currentReciterSlug, false);
  }

  public getCurrentReciterSlug(): string {
    return this.currentReciterSlug;
  }

  public getCurrentSurahNumber(): number {
    return this.currentSurahNumber;
  }

  public async setReciter(reciterSlug: string, autoPlay = false): Promise<void> {
    if (!reciterSlug) return;
    const wasPlaying = !this.audioEl.paused;
    const resumeSec = this.audioEl.currentTime || this.pendingRestoreTimeSec || 0;
    this.currentReciterSlug = reciterSlug;
    try {
      localStorage.setItem('kalamalah_reciter_slug', reciterSlug);
    } catch {}
    if (resumeSec > 1) {
      this.pendingRestoreTimeSec = resumeSec;
    }
    this.savePlaybackState(true);
    this.onReciterExternalChange?.(reciterSlug);
    await this.loadTrackMetadata(this.currentSurahNumber, reciterSlug, autoPlay || wasPlaying);
  }

  public async playSurah(surahNumber: number, reciterSlug?: string, startAyah?: number): Promise<void> {
    const targetReciter = reciterSlug || this.currentReciterSlug;
    if (reciterSlug && reciterSlug !== this.currentReciterSlug) {
      this.currentReciterSlug = reciterSlug;
      try {
        localStorage.setItem('kalamalah_reciter_slug', reciterSlug);
      } catch {}
      this.onReciterExternalChange?.(reciterSlug);
    }
    this.pendingRestoreTimeSec = 0;
    this.savePlaybackState(true, surahNumber, targetReciter, startAyah || 1, 0);

    await this.loadTrackMetadata(surahNumber, targetReciter, true, startAyah);
  }

  private savePlaybackState(
    force = false,
    surahOverride?: number,
    reciterOverride?: string,
    ayahOverride?: number,
    timeOverride?: number
  ): void {
    const now = performance.now();
    if (!force && now - this.lastSavedPlaybackMs < 1500) return;
    if (!force && this.pendingRestoreTimeSec > 0) return;
    this.lastSavedPlaybackMs = now;
    try {
      const payload = {
        surahNumber: surahOverride ?? this.currentSurahNumber,
        reciterSlug: reciterOverride ?? this.currentReciterSlug,
        ayahNumber: ayahOverride ?? this.activeAyahNumber,
        timeSec: timeOverride ?? (this.audioEl.currentTime || 0),
        updatedAt: Date.now(),
      };
      localStorage.setItem(QuranPlayerController.PLAYBACK_STORAGE_KEY, JSON.stringify(payload));
      localStorage.setItem('kalamalah_reciter_slug', payload.reciterSlug);
    } catch {}
  }

  public seekToAyah(ayahNumber: number, autoPlay = true): void {
    this.activeAyahNumber = ayahNumber;
    const locale = getActiveLocale();
    const barAyahLbl = document.getElementById('qp-bar-current-ayah-label');
    if (barAyahLbl) {
      barAyahLbl.textContent = `${t('ayahPrefix', locale)} ${formatLocaleDigits(ayahNumber, locale)}`;
    }
    const seg = this.currentTimings?.ayahs.find((a) => a.ayah === ayahNumber);
    if (seg) {
      this.audioEl.currentTime = Math.max(0, (seg.startMs - this.syncOffsetMs) / 1000);
      this.startSyncLoop();
      if (autoPlay && this.audioEl.paused) {
        this.audioEl.play().catch(() => {});
      }
    } else if (autoPlay && this.audioEl.paused) {
      this.audioEl.play().catch(() => {});
    }
  }

  public setSurahAyahsData(ayahs: { n: number; text: string; tr?: string; taf?: string }[]): void {
    if (!Array.isArray(ayahs) || ayahs.length === 0) return;
    this.currentAyahsData = ayahs;
    if (this.catalog.pageData && this.catalog.pageData.surahNumber === this.currentSurahNumber) {
      this.catalog.pageData.ayahs = ayahs;
    }
    this.renderFullscreenAyahsList();
    this.rebindAnimator();
  }

  private async loadTrackMetadata(
    surahNumber: number,
    reciterSlug: string,
    autoPlay: boolean,
    startAyah?: number
  ): Promise<void> {
    if (this.loadAbortController) {
      this.loadAbortController.abort();
    }
    const abortCtrl = new AbortController();
    this.loadAbortController = abortCtrl;

    this.currentSurahNumber = surahNumber;
    this.activeAyahNumber = startAyah && startAyah > 1 ? startAyah : 1;

    const amlScrollEl = document.getElementById('aml-scroll-container');
    if (amlScrollEl) {
      amlScrollEl.scrollTop = 0;
      amlScrollEl.classList.remove('HideLineBlur', 'is-user-scrolling');
    }
    this.animator.setUserScrolling(false);

    const surahMeta =
      this.catalog.surahs.find((s) => s.n === surahNumber) ?? this.catalog.surahs[0]!;
    const reciterMeta =
      this.catalog.reciters.find((r) => r.slug === reciterSlug) ?? this.catalog.reciters[0]!;

    this.updateNowPlayingLabels(surahMeta, reciterMeta);

    const pageMatchesSurah =
      this.catalog.pageData?.surahNumber === surahNumber &&
      Array.isArray(this.catalog.pageData?.ayahs) &&
      this.catalog.pageData.ayahs.length === surahMeta.ay;

    const [timingsRes, surahRes] = await Promise.all([
      fetchTimingsApi(reciterSlug, surahNumber, this.catalog, abortCtrl.signal).catch(() => null),
      pageMatchesSurah
        ? Promise.resolve({ ayahs: this.catalog.pageData!.ayahs! })
        : fetchSurahApi(surahNumber, 'en.sahih', 'ar.muyassar', this.catalog, abortCtrl.signal).catch(
            () => null
          ),
    ]);

    if (abortCtrl.signal.aborted) return;

    if (surahRes?.ayahs && Array.isArray(surahRes.ayahs)) {
      this.currentAyahsData = surahRes.ayahs;
    }

    this.currentTimings = timingsRes;
    const audioUrl =
      timingsRes?.audioUrl ||
      `${reciterMeta.audioBase}/${String(surahNumber).padStart(3, '0')}.mp3`;

    if (this.audioEl.src !== audioUrl) {
      this.audioEl.src = audioUrl;
      this.audioEl.playbackRate = this.speeds[this.speedIndex] ?? 1;
    }

    const syncBadgeEl = document.getElementById('qp-bar-sync-badge');
    const amlSyncPillEl = document.getElementById('aml-sync-mode-pill');
    if (timingsRes?.mode === 'word') {
      if (syncBadgeEl) syncBadgeEl.textContent = 'مزامنة الكلمات WBW';
      if (amlSyncPillEl) amlSyncPillEl.textContent = 'مزامنة دقيقة كلمة بكلمة';
    } else if (timingsRes?.mode === 'ayah') {
      if (syncBadgeEl) syncBadgeEl.textContent = 'مزامنة الآيات CC';
      if (amlSyncPillEl) amlSyncPillEl.textContent = `مزامنة الآيات (${timingsRes.source})`;
    } else {
      if (syncBadgeEl) syncBadgeEl.textContent = 'تلاوة صوتية';
      if (amlSyncPillEl) amlSyncPillEl.textContent = 'تلاوة صوتية متصلة';
    }

    this.renderFullscreenAyahsList();

    const fsListEl = document.getElementById('aml-ayahs-list');
    const readerWrapEl =
      this.catalog.pageData?.surahNumber === surahNumber
        ? document.getElementById('surah-ayahs-wrapper')
        : null;

    this.animator.bindTimings(timingsRes?.ayahs ?? [], fsListEl, readerWrapEl);

    if (startAyah && startAyah > 1) {
      const targetSeg = timingsRes?.ayahs.find((a) => a.ayah === startAyah);
      if (targetSeg) {
        this.audioEl.currentTime = Math.max(0, (targetSeg.startMs - this.syncOffsetMs) / 1000);
      }
    }

    if (autoPlay) {
      this.audioEl.play().catch(() => {});
    }
  }

  private initDybgCanvas(): void {
    const bgContainer = document.getElementById('dynamic-bg');
    if (!bgContainer) return;
    bgContainer.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.className = 'lyricsflow-dybg-canvas';
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;';
    bgContainer.appendChild(canvas);
    try {
      this.dybgInstance = new dybg(canvas);
      if (typeof this.dybgInstance.setFlowSpeed === 'function') {
        this.dybgInstance.setFlowSpeed(0.2);
      }
      if (typeof this.dybgInstance.setRenderScale === 'function') {
        this.dybgInstance.setRenderScale(0.25);
      }
      this.dybgInstance.pause?.();
    } catch {
      this.dybgInstance = null;
    }
  }

  private updateDybgArtwork(reciterSlug: string): void {
    if (!this.dybgInstance || this.lastDybgReciterSlug === reciterSlug) return;
    this.lastDybgReciterSlug = reciterSlug;
    const reciterMeta =
      this.catalog.reciters.find((r) => r.slug === reciterSlug) ?? this.catalog.reciters[0]!;
    const avatarUrl = getAvatarProxyOrDirectUrl(reciterMeta);
    try {
      this.dybgInstance.setAlbum?.(avatarUrl, false);
    } catch {}
  }

  private updateNowPlayingLabels(
    surah: BootstrapCatalog['surahs'][number],
    reciter: BootstrapCatalog['reciters'][number]
  ): void {
    const locale = getActiveLocale();
    const isRtl = isRtlLocale(locale);
    const d = (n: number | string) => formatLocaleDigits(n, locale);
    const setTxt = (id: string, text: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    const kSlug = reciter.kSlug || reciter.slug;
    const reciterPhotoUrl =
      reciter.photo || `https://api.kalamalah.com/api/reciter-profile/${kSlug}`;

    const barImg = document.getElementById('qp-bar-reciter-img') as HTMLImageElement | null;
    if (barImg && barImg.src !== reciterPhotoUrl) {
      barImg.src = reciterPhotoUrl;
      barImg.alt = isRtl ? reciter.ar : reciter.en;
    }

    const amlImg = document.getElementById('aml-reciter-art-img') as HTMLImageElement | null;
    if (amlImg && amlImg.src !== reciterPhotoUrl) {
      amlImg.src = reciterPhotoUrl;
      amlImg.alt = isRtl ? reciter.ar : reciter.en;
    }

    this.updateDybgArtwork(reciter.slug);

    const surahTitle = isRtl
      ? `${t('surahPrefix', locale)} ${surah.ar}`
      : `${t('surahPrefix', locale)} ${surah.en} (${surah.ar})`;
    const reciterName = isRtl ? reciter.ar : reciter.en;
    const revLabel = surah.rev === 'مكية' ? t('filterMeccan', locale) : t('filterMedinan', locale);

    setTxt('qp-bar-surah-num', d(surah.n));
    setTxt('qp-bar-surah-title', surahTitle);
    setTxt('qp-bar-reciter-name', reciterName);
    setTxt('qp-bar-current-ayah-label', `${t('ayahPrefix', locale)} ${d(this.activeAyahNumber)}`);
    const recLink = document.getElementById('qp-bar-reciter-name') as HTMLAnchorElement | null;
    if (recLink) recLink.href = `/reciter-${reciter.slug}`;

    setTxt('aml-art-surah-name', `سورة ${surah.ar}`);
    setTxt(
      'aml-art-surah-meta',
      `${revLabel} · ${d(surah.ay)} ${t('ayahsUnit', locale)} · ${t('juzPrefix', locale)} ${d(surah.j)}`
    );
    setTxt('aml-now-surah-title', `${t('surahPrefix', locale)} ${surah.ar} (${surah.en})`);
    setTxt('aml-revelation-badge', revLabel);
    setTxt('aml-now-reciter-link', `${t('reciterPrefix', locale)} ${reciterName}`);
    const amlRecLink = document.getElementById('aml-now-reciter-link') as HTMLAnchorElement | null;
    if (amlRecLink) amlRecLink.href = `/reciter-${reciter.slug}`;

    const dlHref = getDownloadUrl(reciter, surah.n);
    const qpDlBtn = document.getElementById('qp-download-surah-btn') as HTMLAnchorElement | null;
    if (qpDlBtn) qpDlBtn.href = dlHref;
    const amlDlBtn = document.getElementById('aml-download-surah-btn') as HTMLAnchorElement | null;
    if (amlDlBtn) amlDlBtn.href = dlHref;
    const surahHeroDlBtn = document.getElementById('surah-download-btn') as HTMLAnchorElement | null;
    if (surahHeroDlBtn && this.catalog.pageData?.surahNumber === surah.n) {
      surahHeroDlBtn.href = dlHref;
    }

    this.updateMediaSessionMetadata();
  }

  private initMediaSessionHandlers(): void {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    const safeSetHandler = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {}
    };

    safeSetHandler('play', () => {
      if (!this.audioEl.src) {
        this.loadTrackMetadata(this.currentSurahNumber, this.currentReciterSlug, true);
      } else {
        this.audioEl.play().catch(() => {});
      }
      navigator.mediaSession.playbackState = 'playing';
      this.updateMediaSessionPositionState();
    });
    safeSetHandler('pause', () => {
      this.audioEl.pause();
      navigator.mediaSession.playbackState = 'paused';
      this.updateMediaSessionPositionState();
    });
    safeSetHandler('stop', () => {
      this.audioEl.pause();
      this.audioEl.currentTime = 0;
      navigator.mediaSession.playbackState = 'none';
      this.updateMediaSessionPositionState();
      this.startSyncLoop();
    });
    safeSetHandler('previoustrack', () => {
      if (this.activeAyahNumber > 1) {
        this.seekToAyah(this.activeAyahNumber - 1, !this.audioEl.paused);
      } else if (this.currentSurahNumber > 1) {
        this.playSurah(this.currentSurahNumber - 1);
      } else {
        this.audioEl.currentTime = 0;
        this.startSyncLoop();
      }
      this.updateMediaSessionPositionState();
    });
    safeSetHandler('nexttrack', () => {
      const surahMeta = this.catalog.surahs.find((s) => s.n === this.currentSurahNumber);
      const maxAyah = surahMeta?.ay ?? this.currentAyahsData.length;
      if (maxAyah > 0 && this.activeAyahNumber < maxAyah) {
        this.seekToAyah(this.activeAyahNumber + 1, !this.audioEl.paused);
      } else if (this.currentSurahNumber < 114) {
        this.playSurah(this.currentSurahNumber + 1);
      }
      this.updateMediaSessionPositionState();
    });
    safeSetHandler('seekbackward', (details) => {
      const offset = details.seekOffset || 10;
      this.audioEl.currentTime = Math.max(0, (this.audioEl.currentTime || 0) - offset);
      this.updateMediaSessionPositionState();
      this.startSyncLoop();
    });
    safeSetHandler('seekforward', (details) => {
      const offset = details.seekOffset || 10;
      const dur = Number.isFinite(this.audioEl.duration) ? this.audioEl.duration : Infinity;
      this.audioEl.currentTime = Math.min(dur, (this.audioEl.currentTime || 0) + offset);
      this.updateMediaSessionPositionState();
      this.startSyncLoop();
    });
    safeSetHandler('seekto', (details) => {
      if (typeof details.seekTime === 'number' && Number.isFinite(details.seekTime)) {
        const dur = Number.isFinite(this.audioEl.duration) ? this.audioEl.duration : details.seekTime;
        this.audioEl.currentTime = Math.max(0, Math.min(dur, details.seekTime));
        this.updateMediaSessionPositionState();
        this.startSyncLoop();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (!this.audioEl.paused) {
          this.requestWakeLock();
          this.startSyncLoop();
        }
        this.animator.forceAlignActiveLine();
      }
    });
  }

  private updateMediaSessionMetadata(): void {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') {
      return;
    }
    const locale = getActiveLocale();
    const isRtl = isRtlLocale(locale);

    const surah =
      this.catalog.surahs.find((s) => s.n === this.currentSurahNumber) ?? this.catalog.surahs[0];
    const reciter =
      this.catalog.reciters.find((r) => r.slug === this.currentReciterSlug) ??
      this.catalog.reciters[0];
    if (!surah || !reciter) return;

    const surahTitle = isRtl
      ? `${t('surahPrefix', locale)} ${surah.ar}`
      : `${t('surahPrefix', locale)} ${surah.en}`;
    const artistLabel = isRtl ? reciter.ar : reciter.en;
    const albumLabel = t('appTitle', locale);
    const avatarUrl = getAvatarProxyOrDirectUrl(reciter);
    const absoluteAvatarUrl = avatarUrl.startsWith('http')
      ? avatarUrl
      : `${window.location.origin}${avatarUrl}`;
    const fallbackLogo = `${window.location.origin}/images/logo.jpg`;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: surahTitle,
        artist: artistLabel,
        album: albumLabel,
        artwork: [
          { src: absoluteAvatarUrl, sizes: '512x512', type: 'image/jpeg' },
          { src: fallbackLogo, sizes: '512x512', type: 'image/jpeg' },
        ],
      });
    } catch {}
  }

  private updateMediaSessionPositionState(): void {
    if (
      typeof navigator === 'undefined' ||
      !('mediaSession' in navigator) ||
      typeof navigator.mediaSession.setPositionState !== 'function'
    ) {
      return;
    }
    const dur = this.audioEl.duration;
    const pos = this.audioEl.currentTime || 0;
    if (!Number.isFinite(dur) || dur <= 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: dur,
        playbackRate: this.audioEl.playbackRate || 1,
        position: Math.max(0, Math.min(pos, dur)),
      });
    } catch {}
  }

  private async requestWakeLock(): Promise<void> {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    if (this.wakeLockSentinel) return;
    try {
      this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      this.wakeLockSentinel?.addEventListener?.('release', () => {
        this.wakeLockSentinel = null;
      });
    } catch {}
  }

  private releaseWakeLock(): void {
    if (this.wakeLockSentinel) {
      this.wakeLockSentinel.release?.().catch?.(() => {});
      this.wakeLockSentinel = null;
    }
  }

  private renderFullscreenAyahsList(): void {
    const listEl = document.getElementById('aml-ayahs-list');
    if (!listEl) return;

    if (this.currentAyahsData.length === 0) {
      listEl.innerHTML = `<p class="aml-empty-msg">جاري تحميل آيات السورة...</p>`;
      return;
    }

    const timingByAyah = new Map(
      (this.currentTimings?.ayahs ?? []).map((seg) => [seg.ayah, seg])
    );

    listEl.innerHTML = this.currentAyahsData
      .map((a) => {
        const seg = timingByAyah.get(a.n);
        const startMs = seg?.startMs ?? 0;
        const tokens = a.text.trim().split(/\s+/);
        let spokenIdx = 0;
        const wordsHtml = tokens
          .map((tok) => {
            const isSpoken = /[\u0621-\u064A\u066E-\u06D3\u06FA-\u06FF]/.test(tok);
            const escaped = tok.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            if (!isSpoken) {
              return `<span class="aml-waqf">${escaped}</span>`;
            }
            const idx = spokenIdx++;
            const wSeg = seg?.words?.find((ws) => ws.wordIndex === idx);
            const wStart = wSeg ? wSeg.startMs : startMs;
            const inner = this.showFullscreenTajweed
              ? colorizeArabicWordTajweed(tok, 'alquran')
              : escaped;
            return `<span class="aml-word" data-seek-ms="${wStart}" data-word-idx="${idx}">${inner}</span>`;
          })
          .join(' ');

        const transHtml =
          this.showFullscreenTranslation && a.tr
            ? `<p class="aml-ayah-translation" dir="ltr">${a.tr.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`
            : '';

        return `<div class="aml-ayah-line line rtl NotSung" data-ayah="${a.n}" data-seek-ms="${startMs}">
          <div class="aml-ayah-arabic quran-reading-text" dir="rtl">
            ${wordsHtml}
            <span class="aml-ayah-num-end">﴿${toArDigits(a.n)}﴾</span>
          </div>
          ${transHtml}
        </div>`;
      })
      .join('\n');
  }

  private startSyncLoop(): void {
    if (this.rafId !== null) return;
    this.lastFrameTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.1, (now - this.lastFrameTime) / 1000);
      this.lastFrameTime = now;

      const currentTimeSec = this.audioEl.currentTime || 0;
      const durationSec = this.audioEl.duration || 0;
      const effectiveTimeMs = currentTimeSec * 1000 + this.syncOffsetMs;

      if (durationSec > 0) {
        const pct = Math.max(0, Math.min(100, (currentTimeSec / durationSec) * 100));
        const barFill = document.getElementById('qp-bar-progress-fill');
        const amlFill = document.getElementById('aml-scrubber-fill');
        if (barFill) barFill.style.width = `${pct.toFixed(2)}%`;
        if (amlFill) amlFill.style.width = `${pct.toFixed(2)}%`;

        const curTimeEl = document.getElementById('qp-current-time');
        const totTimeEl = document.getElementById('qp-total-duration');
        const amlCurEl = document.getElementById('aml-current-time');
        const amlRemEl = document.getElementById('aml-remaining-time');
        if (curTimeEl) curTimeEl.textContent = formatTimeSec(currentTimeSec);
        if (totTimeEl) totTimeEl.textContent = formatTimeSec(durationSec);
        if (amlCurEl) amlCurEl.textContent = formatTimeSec(currentTimeSec);
        if (amlRemEl) amlRemEl.textContent = `-${formatTimeSec(Math.max(0, durationSec - currentTimeSec))}`;
      }

      if (this.repeatMode === 'ayah' && this.currentTimings) {
        const activeSeg = this.currentTimings.ayahs.find((a) => a.ayah === this.activeAyahNumber);
        if (activeSeg && effectiveTimeMs >= activeSeg.endMs) {
          this.audioEl.currentTime = Math.max(0, (activeSeg.startMs - this.syncOffsetMs) / 1000);
        }
      }

      const prevActive = this.activeAyahNumber;
      const { activeAyah, activeFullscreenEl, activeReaderEl } = this.animator.animate(
        effectiveTimeMs,
        dt
      );

      if (activeAyah > 0 && activeAyah !== prevActive) {
        this.activeAyahNumber = activeAyah;
        const barAyahLbl = document.getElementById('qp-bar-current-ayah-label');
        const locale = getActiveLocale();
        if (barAyahLbl) {
          barAyahLbl.textContent = `${t('ayahPrefix', locale)} ${formatLocaleDigits(activeAyah, locale)}`;
        }
        this.updateMediaSessionMetadata();
        this.updateMediaSessionPositionState();

        const fsOverlay = document.getElementById('aml-fullscreen-player');
        if (activeReaderEl && fsOverlay?.classList.contains('hidden')) {
          const rect = activeReaderEl.getBoundingClientRect();
          const dist = Math.abs(rect.top - window.innerHeight * 0.4);
          activeReaderEl.scrollIntoView({
            behavior: dist > window.innerHeight * 1.4 ? 'auto' : 'smooth',
            block: 'center',
          });
        }
      }

      if (!this.audioEl.paused) {
        this.rafId = requestAnimationFrame(step);
      } else {
        this.rafId = null;
      }
    };

    this.rafId = requestAnimationFrame(step);
  }

  private updatePlayPauseIcons(isPlaying: boolean): void {
    document.querySelectorAll('#qp-play-toggle-btn, #aml-play-btn').forEach((btn) => {
      btn.querySelector('.icon-play')?.classList.toggle('hidden', isPlaying);
      btn.querySelector('.icon-pause')?.classList.toggle('hidden', !isPlaying);
    });
    const artCard = document.getElementById('aml-artwork-card');
    artCard?.classList.toggle('is-playing', isPlaying);
    artCard?.classList.toggle('paused', !isPlaying);
    artCard?.classList.toggle('is-paused', !isPlaying);

    if (isPlaying && this.fullscreenBgMode === 'dybg') {
      this.dybgInstance?.resume?.();
    } else {
      this.dybgInstance?.pause?.();
    }
  }

  private applyFullscreenBgMode(): void {
    const dybgEl = document.getElementById('dynamic-bg');
    const islamicEl = document.getElementById('aml-islamic-bg');
    const modeBtn = document.getElementById('aml-bg-mode-btn');
    const nextBtn = document.getElementById('aml-bg-next-btn');
    const fsOverlay = document.getElementById('aml-fullscreen-player');
    const isFsOpen = fsOverlay ? !fsOverlay.classList.contains('hidden') : false;

    if (this.fullscreenBgMode === 'dybg') {
      dybgEl?.classList.remove('hidden');
      islamicEl?.classList.add('hidden');
      nextBtn?.classList.add('hidden');
      if (modeBtn) {
        modeBtn.textContent = t('bgDynamic');
        modeBtn.classList.remove('active');
      }
      this.stopIslamicBgRotator();
      if (isFsOpen || !this.audioEl.paused) {
        this.dybgInstance?.resume?.();
      }
    } else if (this.fullscreenBgMode === 'islamic') {
      dybgEl?.classList.add('hidden');
      this.dybgInstance?.pause?.();
      islamicEl?.classList.remove('hidden');
      nextBtn?.classList.remove('hidden');
      if (modeBtn) {
        modeBtn.textContent = t('bgIslamic');
        modeBtn.classList.add('active');
      }
      this.showIslamicBackgroundSlide(this.islamicBgIndex, true);
      if (isFsOpen) {
        this.startIslamicBgRotator();
      }
    } else {
      // 'off' - completely disable dybg and moving backgrounds
      dybgEl?.classList.add('hidden');
      islamicEl?.classList.add('hidden');
      nextBtn?.classList.add('hidden');
      this.dybgInstance?.pause?.();
      this.stopIslamicBgRotator();
      if (modeBtn) {
        modeBtn.textContent = t('bgOff');
        modeBtn.classList.remove('active');
      }
    }
  }

  private showIslamicBackgroundSlide(index: number, immediate = false): void {
    const urls = QuranPlayerController.ISLAMIC_BACKGROUNDS;
    if (urls.length === 0) return;
    const normalizedIdx = ((index % urls.length) + urls.length) % urls.length;
    this.islamicBgIndex = normalizedIdx;
    const targetUrl = urls[normalizedIdx]!;

    const slideA = document.getElementById('aml-bg-slide-a');
    const slideB = document.getElementById('aml-bg-slide-b');
    if (!slideA || !slideB) return;

    const commitSlide = (url: string) => {
      if (immediate) {
        this.islamicActiveSlot = 'a';
        slideA.style.backgroundImage = `url("${url}")`;
        slideA.classList.add('is-visible', 'kb-pan-a');
        slideB.classList.remove('is-visible', 'kb-pan-b');
        return;
      }

      if (this.islamicActiveSlot === 'a') {
        this.islamicActiveSlot = 'b';
        slideB.style.backgroundImage = `url("${url}")`;
        slideB.classList.remove('kb-pan-b');
        void slideB.offsetWidth;
        slideB.classList.add('is-visible', 'kb-pan-b');
        slideA.classList.remove('is-visible');
      } else {
        this.islamicActiveSlot = 'a';
        slideA.style.backgroundImage = `url("${url}")`;
        slideA.classList.remove('kb-pan-a');
        void slideA.offsetWidth;
        slideA.classList.add('is-visible', 'kb-pan-a');
        slideB.classList.remove('is-visible');
      }
    };

    const preload = new Image();
    preload.onload = () => commitSlide(targetUrl);
    preload.onerror = () => commitSlide('/images/logo.jpg');
    preload.src = targetUrl;

    // Preload next slide in background for zero-latency crossfade
    const nextUrl = urls[(normalizedIdx + 1) % urls.length];
    if (nextUrl) {
      const nextImg = new Image();
      nextImg.src = nextUrl;
    }
  }

  private startIslamicBgRotator(): void {
    this.stopIslamicBgRotator();
    if (this.fullscreenBgMode !== 'islamic') return;
    this.islamicBgTimer = setInterval(() => {
      this.showIslamicBackgroundSlide(this.islamicBgIndex + 1, false);
    }, 12000);
  }

  private stopIslamicBgRotator(): void {
    if (this.islamicBgTimer) {
      clearInterval(this.islamicBgTimer);
      this.islamicBgTimer = null;
    }
  }

  private bindUIEvents(): void {
    this.audioEl.addEventListener('play', () => {
      if (this.pendingRestoreTimeSec > 0 && Number.isFinite(this.audioEl.duration) && this.audioEl.duration > 1) {
        this.audioEl.currentTime = Math.min(this.pendingRestoreTimeSec, Math.max(0, this.audioEl.duration - 1));
        this.pendingRestoreTimeSec = 0;
      }
      this.updatePlayPauseIcons(true);
      this.startSyncLoop();
      this.requestWakeLock();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
      this.updateMediaSessionMetadata();
      this.updateMediaSessionPositionState();
      this.savePlaybackState(true);
    });

    this.audioEl.addEventListener('pause', () => {
      this.updatePlayPauseIcons(false);
      this.releaseWakeLock();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
      this.updateMediaSessionPositionState();
      this.savePlaybackState(true);
    });

    this.audioEl.addEventListener('loadedmetadata', () => {
      const dur = this.audioEl.duration || 0;
      if (this.pendingRestoreTimeSec > 0 && Number.isFinite(dur) && dur > 1) {
        const target = Math.min(this.pendingRestoreTimeSec, Math.max(0, dur - 1));
        this.audioEl.currentTime = target;
        this.pendingRestoreTimeSec = 0;
        const pct = Math.max(0, Math.min(100, (target / dur) * 100));
        const barFill = document.getElementById('qp-bar-progress-fill');
        const amlFill = document.getElementById('aml-scrubber-fill');
        if (barFill) barFill.style.width = `${pct.toFixed(2)}%`;
        if (amlFill) amlFill.style.width = `${pct.toFixed(2)}%`;
        const curTimeEl = document.getElementById('qp-current-time');
        const amlCurEl = document.getElementById('aml-current-time');
        if (curTimeEl) curTimeEl.textContent = formatTimeSec(target);
        if (amlCurEl) amlCurEl.textContent = formatTimeSec(target);
        this.animator.animate(target * 1000 + this.syncOffsetMs, 0);
      }
      const curSec = this.audioEl.currentTime || 0;
      const totEl = document.getElementById('qp-total-duration');
      const remEl = document.getElementById('aml-remaining-time');
      if (totEl) totEl.textContent = formatTimeSec(dur);
      if (remEl) remEl.textContent = `-${formatTimeSec(Math.max(0, dur - curSec))}`;
      this.updateMediaSessionMetadata();
      this.updateMediaSessionPositionState();
    });

    this.audioEl.addEventListener('seeked', () => {
      this.updateMediaSessionPositionState();
      this.savePlaybackState(true);
    });

    window.addEventListener('beforeunload', () => {
      this.savePlaybackState(true);
    });

    this.audioEl.addEventListener('ratechange', () => {
      this.updateMediaSessionPositionState();
    });

    // Background / locked-screen fallback when requestAnimationFrame is throttled by the OS
    this.audioEl.addEventListener('timeupdate', () => {
      this.savePlaybackState(false);
      const now = performance.now();
      if (now - this.lastMediaPositionUpdateMs > 1000) {
        this.lastMediaPositionUpdateMs = now;
        this.updateMediaSessionPositionState();
      }
      if (document.hidden && this.currentTimings) {
        const effectiveTimeMs = (this.audioEl.currentTime || 0) * 1000 + this.syncOffsetMs;
        if (this.repeatMode === 'ayah') {
          const activeSeg = this.currentTimings.ayahs.find((a) => a.ayah === this.activeAyahNumber);
          if (activeSeg && effectiveTimeMs >= activeSeg.endMs) {
            this.audioEl.currentTime = Math.max(0, (activeSeg.startMs - this.syncOffsetMs) / 1000);
            return;
          }
        }
        const curSeg = this.currentTimings.ayahs.find(
          (a) => effectiveTimeMs >= a.startMs && effectiveTimeMs <= a.endMs
        );
        if (curSeg && curSeg.ayah !== this.activeAyahNumber) {
          this.activeAyahNumber = curSeg.ayah;
          const barAyahLbl = document.getElementById('qp-bar-current-ayah-label');
          const locale = getActiveLocale();
          if (barAyahLbl) {
            barAyahLbl.textContent = `${t('ayahPrefix', locale)} ${formatLocaleDigits(curSeg.ayah, locale)}`;
          }
          this.updateMediaSessionMetadata();
        }
      }
    });

    this.audioEl.addEventListener('ended', () => {
      this.updatePlayPauseIcons(false);
      this.releaseWakeLock();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
      if (this.repeatMode === 'surah') {
        this.audioEl.currentTime = 0;
        this.audioEl.play().catch(() => {});
      } else if (this.currentSurahNumber < 114) {
        this.playSurah(this.currentSurahNumber + 1);
      }
    });

    const togglePlay = () => {
      if (this.audioEl.paused) {
        this.audioEl.play().catch(() => {});
      } else {
        this.audioEl.pause();
      }
    };
    document.getElementById('qp-play-toggle-btn')?.addEventListener('click', togglePlay);
    document.getElementById('aml-play-btn')?.addEventListener('click', togglePlay);

    const stepAyah = (delta: -1 | 1) => {
      const target = Math.max(1, this.activeAyahNumber + delta);
      this.seekToAyah(target, true);
    };
    document.getElementById('qp-prev-ayah-btn')?.addEventListener('click', () => stepAyah(-1));
    document.getElementById('qp-next-ayah-btn')?.addEventListener('click', () => stepAyah(1));
    document.getElementById('aml-prev-btn')?.addEventListener('click', () => stepAyah(-1));
    document.getElementById('aml-next-btn')?.addEventListener('click', () => stepAyah(1));

    const cycleSpeed = () => {
      this.speedIndex = (this.speedIndex + 1) % this.speeds.length;
      const spd = this.speeds[this.speedIndex] ?? 1;
      this.audioEl.playbackRate = spd;
      const label = `${spd}x`;
      const b1 = document.getElementById('qp-speed-btn');
      const b2 = document.getElementById('aml-speed-cycle-btn');
      if (b1) b1.textContent = label;
      if (b2) b2.textContent = label;
    };
    document.getElementById('qp-speed-btn')?.addEventListener('click', cycleSpeed);
    document.getElementById('aml-speed-cycle-btn')?.addEventListener('click', cycleSpeed);

    const cycleRepeat = () => {
      if (this.repeatMode === 'off') this.repeatMode = 'surah';
      else if (this.repeatMode === 'surah') this.repeatMode = 'ayah';
      else this.repeatMode = 'off';

      const qpRep = document.getElementById('qp-repeat-btn');
      const amlRep = document.getElementById('aml-repeat-btn');
      const qpIcon = document.getElementById('qp-repeat-icon') as HTMLImageElement | null;
      const amlIcon = document.getElementById('aml-repeat-icon') as HTMLImageElement | null;

      const iconPath =
        this.repeatMode === 'ayah'
          ? '/icons/being-repeat1.svg'
          : this.repeatMode === 'surah'
            ? '/icons/being-repeat.svg'
            : '/icons/repeat.svg';

      if (qpIcon) qpIcon.src = iconPath;
      if (amlIcon) amlIcon.src = iconPath;
      qpRep?.classList.toggle('active', this.repeatMode !== 'off');
      amlRep?.classList.toggle('active', this.repeatMode !== 'off');
    };
    document.getElementById('qp-repeat-btn')?.addEventListener('click', cycleRepeat);
    document.getElementById('aml-repeat-btn')?.addEventListener('click', cycleRepeat);

    const bindScrubber = (scrubberId: string) => {
      const el = document.getElementById(scrubberId);
      if (!el) return;
      el.addEventListener('click', (e) => {
        const rect = el.getBoundingClientRect();
        const isRtl = getComputedStyle(el).direction === 'rtl';
        const rawRatio = (e.clientX - rect.left) / Math.max(1, rect.width);
        const ratio = Math.max(0, Math.min(1, isRtl ? 1 - rawRatio : rawRatio));
        if (this.audioEl.duration > 0) {
          this.audioEl.currentTime = ratio * this.audioEl.duration;
          this.startSyncLoop();
        }
      });
    };
    bindScrubber('qp-bar-scrubber');
    bindScrubber('aml-scrubber-track');

    const volSlider = document.getElementById('aml-volume-slider') as HTMLInputElement | null;
    volSlider?.addEventListener('input', () => {
      this.audioEl.volume = Number(volSlider.value);
    });

    const updateOffsetLabel = () => {
      const lbl = document.getElementById('aml-sync-offset-label');
      if (lbl) {
        const sign = this.syncOffsetMs > 0 ? '+' : '';
        lbl.textContent = `${sign}${this.syncOffsetMs}ms`;
      }
    };
    document.getElementById('aml-sync-minus-btn')?.addEventListener('click', () => {
      this.syncOffsetMs -= 100;
      updateOffsetLabel();
    });
    document.getElementById('aml-sync-plus-btn')?.addEventListener('click', () => {
      this.syncOffsetMs += 100;
      updateOffsetLabel();
    });
    document.getElementById('aml-sync-offset-label')?.addEventListener('click', () => {
      this.syncOffsetMs = 0;
      updateOffsetLabel();
    });

    // Authored Fullscreen Sheet Transition with GSAP
    const fsOverlay = document.getElementById('aml-fullscreen-player');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const openFullscreen = () => {
      if (!fsOverlay) return;
      fsOverlay.classList.remove('hidden');
      document.body.classList.add('aml-fullscreen-open');
      this.applyFullscreenBgMode();
      if (!reducedMotion) {
        gsap.fromTo(
          fsOverlay,
          { yPercent: 100, opacity: 0.6 },
          { yPercent: 0, opacity: 1, duration: 0.44, ease: 'expo.out', clearProps: 'transform,opacity' }
        );
      }
      setTimeout(() => {
        this.animator.forceAlignActiveLine();
      }, 60);
    };

    const closeFullscreen = () => {
      if (!fsOverlay) return;
      document.body.classList.remove('aml-fullscreen-open');
      this.stopIslamicBgRotator();
      if (this.audioEl.paused || this.fullscreenBgMode !== 'dybg') {
        this.dybgInstance?.pause?.();
      }
      if (!reducedMotion) {
        gsap.to(fsOverlay, {
          yPercent: 100,
          opacity: 0,
          duration: 0.32,
          ease: 'power3.in',
          onComplete: () => {
            fsOverlay.classList.add('hidden');
            gsap.set(fsOverlay, { clearProps: 'transform,opacity' });
          },
        });
      } else {
        fsOverlay.classList.add('hidden');
      }
    };

    document.getElementById('qp-expand-fullscreen-btn')?.addEventListener('click', openFullscreen);
    document.getElementById('qp-open-fullscreen-trigger')?.addEventListener('click', openFullscreen);
    document.getElementById('surah-open-aml-btn')?.addEventListener('click', () => {
      openFullscreen();
      if (this.audioEl.paused) {
        this.audioEl.play().catch(() => {});
      }
    });
    document.getElementById('aml-close-fullscreen-btn')?.addEventListener('click', closeFullscreen);
    document.getElementById('aml-corner-close-btn')?.addEventListener('click', closeFullscreen);

    const hudToggleBtn = document.getElementById('aml-toggle-hud-btn');
    const toggleFullscreenHud = () => {
      if (!fsOverlay) return;
      const hidden = fsOverlay.classList.toggle('hud-hidden');
      if (hudToggleBtn) {
        hudToggleBtn.setAttribute('aria-pressed', String(hidden));
        hudToggleBtn.querySelector('.icon-hud-hide')?.classList.toggle('hidden', hidden);
        hudToggleBtn.querySelector('.icon-hud-show')?.classList.toggle('hidden', !hidden);
      }
    };
    hudToggleBtn?.addEventListener('click', toggleFullscreenHud);

    document.getElementById('aml-bg-mode-btn')?.addEventListener('click', () => {
      if (this.fullscreenBgMode === 'dybg') {
        this.fullscreenBgMode = 'islamic';
      } else if (this.fullscreenBgMode === 'islamic') {
        this.fullscreenBgMode = 'off';
      } else {
        this.fullscreenBgMode = 'dybg';
      }
      try {
        localStorage.setItem('kalamalah_fs_bg_mode', this.fullscreenBgMode);
      } catch {}
      this.applyFullscreenBgMode();
    });

    document.getElementById('aml-bg-next-btn')?.addEventListener('click', () => {
      if (this.fullscreenBgMode === 'islamic') {
        this.showIslamicBackgroundSlide(this.islamicBgIndex + 1, false);
        this.startIslamicBgRotator();
      }
    });

    const transBtn = document.getElementById('aml-toggle-translation-btn');
    transBtn?.addEventListener('click', () => {
      this.showFullscreenTranslation = !this.showFullscreenTranslation;
      transBtn.classList.toggle('active', this.showFullscreenTranslation);
      this.renderFullscreenAyahsList();
      this.rebindAnimator();
    });

    const tjBtn = document.getElementById('aml-toggle-tajweed-btn');
    tjBtn?.addEventListener('click', () => {
      this.showFullscreenTajweed = !this.showFullscreenTajweed;
      tjBtn.classList.toggle('active', this.showFullscreenTajweed);
      this.renderFullscreenAyahsList();
      this.rebindAnimator();
    });

    document.getElementById('aml-bookmark-ayah-btn')?.addEventListener('click', () => {
      const sMeta = this.catalog.surahs.find((s) => s.n === this.currentSurahNumber);
      const aData = this.currentAyahsData.find((a) => a.n === this.activeAyahNumber);
      if (sMeta && aData) {
        toggleBookmarkAyah(sMeta.n, sMeta.ar, aData.n, aData.text);
      }
    });

    document.getElementById('aml-ayahs-list')?.addEventListener('click', (e) => {
      const wordEl = (e.target as HTMLElement | null)?.closest<HTMLElement>('.aml-word');
      if (wordEl) {
        e.stopPropagation();
        const ms = Number(wordEl.getAttribute('data-seek-ms') || 0);
        this.audioEl.currentTime = Math.max(0, (ms - this.syncOffsetMs) / 1000);
        if (this.audioEl.paused) this.audioEl.play().catch(() => {});
        return;
      }
      const lineEl = (e.target as HTMLElement | null)?.closest<HTMLElement>('.aml-ayah-line');
      if (lineEl) {
        const ms = Number(lineEl.getAttribute('data-seek-ms') || 0);
        this.audioEl.currentTime = Math.max(0, (ms - this.syncOffsetMs) / 1000);
        if (this.audioEl.paused) this.audioEl.play().catch(() => {});
      }
    });

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Support clicking a word in the reader (cards, متصل mushaf-flow, or mushaf page) to seek directly
      const quranWordEl = target.closest<HTMLElement>('.quran-word[data-seek-ms]:not(.memo-hidden-word)');
      if (quranWordEl) {
        const ms = Number(quranWordEl.getAttribute('data-seek-ms') || 0);
        if (ms >= 0 && this.audioEl.src) {
          this.audioEl.currentTime = Math.max(0, (ms - this.syncOffsetMs) / 1000);
          if (this.audioEl.paused) this.audioEl.play().catch(() => {});
          this.startSyncLoop();
          return;
        }
      }

      const playAyahBtn = target.closest<HTMLElement>('[data-play-ayah]');
      if (playAyahBtn) {
        e.preventDefault();
        const ayahNum = Number(playAyahBtn.getAttribute('data-play-ayah') || 1);
        const explicitSurah = Number(
          playAyahBtn.getAttribute('data-play-surah') ||
            document.getElementById('surah-ayahs-wrapper')?.getAttribute('data-surah-number') ||
            this.currentSurahNumber
        );

        if (explicitSurah !== this.currentSurahNumber) {
          this.playSurah(explicitSurah, undefined, ayahNum);
        } else {
          this.seekToAyah(ayahNum, true);
        }
        return;
      }

      const playSurahBtn = target.closest<HTMLElement>('[data-play-surah]');
      if (playSurahBtn) {
        e.preventDefault();
        const sNum = Number(playSurahBtn.getAttribute('data-play-surah') || 1);
        const recSlug = playSurahBtn.getAttribute('data-play-reciter') || undefined;
        this.playSurah(sNum, recSlug);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (!fsOverlay || fsOverlay.classList.contains('hidden')) return;
      if (e.key === 'Escape') {
        closeFullscreen();
      } else if (
        (e.key === 'h' || e.key === 'H') &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        toggleFullscreenHud();
      }
    });

    window.addEventListener('kalamalah:locale-changed', () => {
      const sMeta =
        this.catalog.surahs.find((s) => s.n === this.currentSurahNumber) ?? this.catalog.surahs[0];
      const rMeta =
        this.catalog.reciters.find((r) => r.slug === this.currentReciterSlug) ??
        this.catalog.reciters[0];
      if (sMeta && rMeta) {
        this.updateNowPlayingLabels(sMeta, rMeta);
      }
      this.applyFullscreenBgMode();
      updateOffsetLabel();
    });
  }

  private rebindAnimator(): void {
    const fsListEl = document.getElementById('aml-ayahs-list');
    const readerWrapEl =
      this.catalog.pageData?.surahNumber === this.currentSurahNumber
        ? document.getElementById('surah-ayahs-wrapper')
        : null;
    this.animator.bindTimings(this.currentTimings?.ayahs ?? [], fsListEl, readerWrapEl);
  }
}
