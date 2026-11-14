import { SURAHS_META, TRANSLATION_EDITIONS, TAFSEER_BOOKS } from '../kalamalah-api';
import { getReciterPhotoUrl, RECITERS_CATALOG } from '../reciters-catalog';

export interface LayoutProps {
  title: string;
  description?: string;
  canonicalPath?: string;
  activeNav?:
    | 'home'
    | 'surahs'
    | 'juzs'
    | 'mushaf'
    | 'reciters'
    | 'tafseer'
    | 'tajweed'
    | 'languages'
    | 'duas'
    | 'names'
    | 'ai';
  bodyContent: string;
  pageBootstrapData?: Record<string, unknown>;
}

export function renderIntervalsToArabicDigits(num: number | string): string {
  const arDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).replace(/\d/g, (d) => arDigits[Number(d)] ?? d);
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildDiscordComponentEmbedJson(
  title: string,
  description: string,
  canonicalUrl: string
): string {
  const safeTitle = title.trim().slice(0, 140) || 'Kalamalah | القرآن الكريم';
  const safeDesc = description.trim().slice(0, 260);
  const payload = {
    component: {
      type: 17,
      accent_color: 13149277,
      components: [
        { type: 10, content: '-# KALAMALAH · كلام الله' },
        {
          type: 9,
          components: [
            {
              type: 10,
              content: `# ${safeTitle}\n${safeDesc}`,
            },
          ],
          accessory: {
            type: 11,
            media: { url: 'https://kalamalah.com/images/round-logo.png' },
            description: 'Kalamalah logo',
          },
        },
        {
          type: 12,
          items: [
            {
              media: { url: 'https://kalamalah.com/images/og-cover.jpg' },
              description: 'Kalamalah — Holy Quran Player & Reader',
            },
          ],
        },
        { type: 14, spacing: 1 },
        {
          type: 9,
          components: [
            {
              type: 10,
              content: '**Open in Kalamalah**\n-# Listen, read, and reflect with synchronized Ayah & word playback.',
            },
          ],
          accessory: {
            type: 2,
            style: 5,
            url: canonicalUrl,
            label: 'Open Page',
          },
        },
        {
          type: 9,
          components: [
            {
              type: 10,
              content: '**Reciters & Mushaf**\n-# Browse reciters, 604 Mushaf pages, Tafseer, and Tajweed.',
            },
          ],
          accessory: {
            type: 2,
            style: 5,
            url: 'https://kalamalah.com/reciters',
            label: 'Browse Reciters',
          },
        },
      ],
    },
  };
  return JSON.stringify(payload).replace(/</g, '\\u003c');
}

function buildStructuredDataJson(
  title: string,
  description: string,
  canonicalUrl: string
): string {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://kalamalah.com/#website',
        url: 'https://kalamalah.com/',
        name: 'Kalamalah',
        alternateName: 'كلام الله',
        description:
          'Holy Quran player and reader with word-by-word and ayah audio synchronization, 604-page Mushaf, Tafseer, translations, and Tajweed tools.',
        inLanguage: ['ar', 'en', 'fr', 'tr', 'id', 'ur'],
      },
      {
        '@type': 'WebPage',
        '@id': `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: title,
        description,
        isPartOf: { '@id': 'https://kalamalah.com/#website' },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: 'https://kalamalah.com/images/og-cover.jpg',
          width: 1200,
          height: 670,
        },
      },
    ],
  };
  return JSON.stringify(schema).replace(/</g, '\\u003c');
}

export function buildRobotsTxt(baseUrl = 'https://kalamalah.com'): string {
  const origin = baseUrl.replace(/\/+$/, '');
  return `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`;
}

export function buildSitemapXml(baseUrl = 'https://kalamalah.com'): string {
  const origin = baseUrl.replace(/\/+$/, '');
  const urls: { path: string; priority: string; changefreq: string }[] = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/reciters', priority: '0.9', changefreq: 'weekly' },
    { path: '/mushaf-1', priority: '0.9', changefreq: 'monthly' },
    { path: '/tajweed', priority: '0.8', changefreq: 'monthly' },
    { path: '/languages', priority: '0.8', changefreq: 'monthly' },
    { path: '/duas', priority: '0.8', changefreq: 'monthly' },
    { path: '/names', priority: '0.8', changefreq: 'monthly' },
    { path: '/ai', priority: '0.7', changefreq: 'monthly' },
  ];

  for (const s of SURAHS_META) {
    urls.push({ path: `/surah-${s.number}`, priority: '0.9', changefreq: 'monthly' });
  }
  for (let j = 1; j <= 30; j++) {
    urls.push({ path: `/juz-${j}`, priority: '0.7', changefreq: 'monthly' });
  }
  for (const r of RECITERS_CATALOG) {
    urls.push({ path: `/reciter-${r.slug}`, priority: '0.8', changefreq: 'monthly' });
  }
  for (const b of TAFSEER_BOOKS) {
    urls.push({ path: `/tafseer-${b.id}`, priority: '0.7', changefreq: 'monthly' });
  }

  const items = urls
    .map(
      (u) =>
        `  <url><loc>${origin}${u.path}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`;
}

export function renderLayout(props: LayoutProps): string {
  const description =
    props.description ??
    'منصة كلام الله (Kalamalah): تلاوة وتدبر القرآن الكريم مع المزامنة الدقيقة للآيات والكلمات، المصحف الشريف، التفسير، وأحكام التجويد.';
  const canonicalUrl = `https://kalamalah.com${props.canonicalPath ?? '/'}`;
  const discordEmbedJson = buildDiscordComponentEmbedJson(props.title, description, canonicalUrl);
  const structuredDataJson = buildStructuredDataJson(props.title, description, canonicalUrl);

  const clientCatalogBootstrap = {
    surahs: SURAHS_META.map((s) => ({
      n: s.number,
      ar: s.nameAr,
      en: s.nameEn,
      ay: s.ayahCount,
      rev: s.revelationAr,
      p: s.startPage,
      j: s.juz,
    })),
    reciters: RECITERS_CATALOG.map((r) => ({
      id: r.id,
      slug: r.slug,
      kSlug: r.kalamalahSlug,
      qId: r.qurancdnId,
      iolSlug: r.islamOnlineTimingSlug,
      mp3Id: r.mp3QuranReadId,
      ar: r.nameAr,
      en: r.nameEn,
      riwayah: r.riwayahAr,
      wbw: r.hasWordByWord,
      cc: r.hasAyahTimings,
      audioBase: r.audioBaseUrl,
      photo: getReciterPhotoUrl(r),
    })),
    tafseers: TAFSEER_BOOKS,
    translations: TRANSLATION_EDITIONS,
    pageData: props.pageBootstrapData ?? {},
  };

  return `<!DOCTYPE html>
<html lang="en" dir="ltr" data-theme="system" data-reading-font="uthmani">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>${escapeHtml(props.title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="keywords" content="Quran, Holy Quran, Kalamalah, كلام الله, القرآن الكريم, Mushaf, Tafseer, Tajweed, Reciters, Ayah Sync, Word by Word Quran" />
  <meta name="author" content="Kalamalah" />
  <meta name="application-name" content="Kalamalah" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <link rel="alternate" hreflang="x-default" href="${escapeHtml(canonicalUrl)}" />
  <meta name="theme-color" content="#c8a45d" />
  <meta name="darkreader-lock" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="format-detection" content="telephone=no" />

  <!-- Exact Favicon Setup -->
  <link rel="icon" type="image/png" href="/favicon/favicon-96x96.png" sizes="96x96" />
  <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg" />
  <link rel="shortcut icon" href="/favicon/favicon.ico" />
  <link rel="mask-icon" href="/favicon/favicon.svg" color="#c8a45d" />
  <link rel="apple-touch-icon" sizes="76x76" href="/favicon/apple-touch-icon.png" />
  <link rel="apple-touch-icon" sizes="120x120" href="/favicon/apple-touch-icon.png" />
  <link rel="apple-touch-icon" sizes="152x152" href="/favicon/apple-touch-icon.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
  <meta name="apple-mobile-web-app-title" content="Kalamalah" />
  <link rel="manifest" href="/favicon/site.webmanifest" />

  <!-- Open Graph & Social (WhatsApp, Telegram, Facebook, LinkedIn, iMessage, Discord fallback) -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Kalamalah | كلام الله" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:title" content="${escapeHtml(props.title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:locale:alternate" content="ar_AR" />
  <meta property="og:locale:alternate" content="fr_FR" />
  <meta property="og:locale:alternate" content="tr_TR" />
  <meta property="og:locale:alternate" content="id_ID" />
  <meta property="og:locale:alternate" content="ur_PK" />
  <meta property="og:image" content="https://kalamalah.com/images/og-cover.jpg" />
  <meta property="og:image:secure_url" content="https://kalamalah.com/images/og-cover.jpg" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="670" />
  <meta property="og:image:alt" content="Kalamalah — Holy Quran Player & Reader" />

  <!-- Twitter / X Cards -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:domain" content="kalamalah.com" />
  <meta name="twitter:url" content="${escapeHtml(canonicalUrl)}" />
  <meta name="twitter:title" content="${escapeHtml(props.title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="https://kalamalah.com/images/og-cover.jpg" />
  <meta name="twitter:image:alt" content="Kalamalah — Holy Quran Player & Reader" />

  <!-- Discord Component Embed (v2) + Google Search Structured Data (JSON-LD) -->
  <script id="discord:component-embed" type="application/json">${discordEmbedJson}</script>
  <script type="application/ld+json">${structuredDataJson}</script>

  <!-- Local Fonts from /fonts (UthmanicHafs_V22 Primary, KFGQPCNastaleeq, SF Arabic, SF Pro Display) -->
  <link rel="preload" href="/fonts/UthmanicHafs_V22.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/fonts/sfarabic.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/fonts/SF-Pro-Display-Regular.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/fonts/SF-Pro-Display-Bold.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" />
  <link rel="preconnect" href="https://api.kalamalah.com" crossorigin />
  <link rel="stylesheet" href="https://api.kalamalah.com/api/fonts.css" />

  <!-- AeroUI Components (from main/player.html) -->
  <link rel="stylesheet" href="https://nurislamaibekuly.github.io/aeroui/src/aeroui.css" crossorigin="anonymous" />
  <script type="module" src="https://nurislamaibekuly.github.io/aeroui/src/components/elastic-slider/elastic-slider.js" crossorigin="anonymous"></script>
  <script type="module" src="https://nurislamaibekuly.github.io/aeroui/src/components/player-button/player-button.js" crossorigin="anonymous"></script>
  <script type="module" src="https://nurislamaibekuly.github.io/aeroui/src/components/skip-label/skip-label.js" crossorigin="anonymous"></script>

  <!-- Application Stylesheets -->
  <link rel="stylesheet" href="/css/searchable-dropdown.css" />
  <link rel="stylesheet" href="/css/app.css" />
  <link rel="stylesheet" href="/css/fullscreen-player.css" />

  <!-- Early Theme Initialization (Auto from browser if unset, Dark/Light toggleable) -->
  <script>
    (function() {
      try {
        var savedTheme = localStorage.getItem('kalamalah_theme');
        var hasManualTheme = savedTheme === 'dark' || savedTheme === 'light';
        var resolved = hasManualTheme
          ? savedTheme
          : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
        document.documentElement.setAttribute('data-theme-mode', hasManualTheme ? savedTheme : 'auto');
        document.documentElement.setAttribute('data-theme', resolved);

        var savedFont = localStorage.getItem('kalamalah_reading_font') || 'uthmani';
        if (['uthmani', 'kitab', 'amiri', 'nastaleeq'].indexOf(savedFont) !== -1) {
          document.documentElement.setAttribute('data-reading-font', savedFont);
        }

        var savedLocale = localStorage.getItem('kalamalah_ui_locale_v2') || 'en';
        if (['ar', 'en', 'fr', 'tr', 'id', 'ur'].indexOf(savedLocale) === -1) savedLocale = 'en';
        var isRtl = savedLocale === 'ar' || savedLocale === 'ur';
        document.documentElement.setAttribute('lang', savedLocale);
        document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
      } catch (e) {}
    })();
  </script>
</head>
<body>
  <!-- Top Navigation Header -->
  <header class="site-header">
    <div class="header-container">
      <div class="brand-group">
        <a href="/" class="brand-link" aria-label="كلام الله الصفحة الرئيسية">
          <img src="/images/round-logo.png" alt="شعار كلام الله" class="brand-logo" width="32" height="32" />
          <span class="brand-title" data-i18n="appTitle">كلام الله</span>
        </a>
      </div>

      <nav class="primary-nav" aria-label="Main Navigation">
        <a href="/" class="nav-pill ${props.activeNav === 'home' || props.activeNav === 'surahs' ? 'active' : ''}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>
          <span data-i18n="navHome">Home</span>
        </a>
        <a href="/reciters" class="nav-pill ${props.activeNav === 'reciters' ? 'active' : ''}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
          <span data-i18n="navReciters">Reciters</span>
        </a>
        <a href="/tafseer-1" class="nav-pill ${props.activeNav === 'tafseer' ? 'active' : ''}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          <span data-i18n="navTafseer">Tafseer</span>
        </a>
        <a href="/tajweed" class="nav-pill ${props.activeNav === 'tajweed' ? 'active' : ''}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="m9 10 2 2 4-4"/></svg>
          <span data-i18n="navTajweed">Tajweed</span>
        </a>
      </nav>

      <!-- Header Clean Icon Actions (Theme / Language / Bookmarks) -->
      <div class="header-actions">
        <button type="button" id="header-theme-btn" class="header-clean-icon-btn" title="Toggle theme" aria-label="Toggle theme">
          <svg class="theme-icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
          <svg class="theme-icon-moon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
        </button>

        <div class="header-lang-wrap">
          <button type="button" id="header-lang-btn" class="header-clean-icon-btn" data-i18n-title="uiLanguage" title="Language" aria-label="Language" aria-haspopup="menu" aria-expanded="false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          </button>
          <div id="header-lang-menu" class="header-lang-menu hidden" role="menu" aria-label="UI Language">
            <button type="button" class="header-lang-opt" data-select-lang="en" role="menuitem">English</button>
            <button type="button" class="header-lang-opt" data-select-lang="ar" role="menuitem">العربية</button>
            <button type="button" class="header-lang-opt" data-select-lang="fr" role="menuitem">Français</button>
            <button type="button" class="header-lang-opt" data-select-lang="tr" role="menuitem">Türkçe</button>
            <button type="button" class="header-lang-opt" data-select-lang="id" role="menuitem">Bahasa Indonesia</button>
            <button type="button" class="header-lang-opt" data-select-lang="ur" role="menuitem">اردو (Urdu)</button>
          </div>
        </div>

        <button type="button" id="open-bookmarks-btn" class="header-clean-icon-btn" data-i18n-title="savedBookmarks" title="Saved Bookmarks" aria-label="Saved Bookmarks">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
        </button>
      </div>

      <!-- Mobile Hamburger Button -->
      <button type="button" id="mobile-nav-toggle-btn" class="mobile-nav-toggle-btn" aria-label="فتح القائمة الرئيسية" aria-expanded="false" aria-controls="mobile-nav-drawer">
        <svg class="icon-hamburger" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        <svg class="icon-close hidden" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

  </header>

  <!-- Mobile Drawer Overlay & Sidebar (must sit outside <header>: backdrop-filter/sticky would trap position:fixed) -->
  <div id="mobile-nav-drawer" class="mobile-nav-drawer" aria-hidden="true">
      <div class="mobile-nav-backdrop" id="mobile-nav-backdrop"></div>
      <aside class="mobile-nav-sidebar" role="dialog" aria-modal="true" aria-label="القائمة الجانبية">
        <div class="mobile-sidebar-header">
          <div class="brand-group">
            <img src="/images/round-logo.png" alt="شعار كلام الله" class="brand-logo" width="30" height="30" />
            <span class="brand-title" data-i18n="appTitle">كلام الله</span>
          </div>
          <button type="button" id="mobile-sidebar-close-btn" class="eco-icon-btn" aria-label="إغلاق القائمة">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="mobile-sidebar-body">
          <div class="mobile-sidebar-section">
            <span class="mobile-section-title">التنقل الرئيسي</span>
            <div class="mobile-nav-links">
              <a href="/" class="mobile-nav-link ${props.activeNav === 'home' || props.activeNav === 'surahs' ? 'active' : ''}" data-i18n="navSurahs">السور</a>
              <a href="/mushaf-1" class="mobile-nav-link ${props.activeNav === 'mushaf' ? 'active' : ''}" data-i18n="navMushaf">المصحف</a>
              <a href="/reciters" class="mobile-nav-link ${props.activeNav === 'reciters' ? 'active' : ''}" data-i18n="navReciters">القراء</a>
              <a href="/tafseer-1" class="mobile-nav-link ${props.activeNav === 'tafseer' ? 'active' : ''}" data-i18n="navTafseer">التفسير</a>
              <a href="/tajweed" class="mobile-nav-link ${props.activeNav === 'tajweed' ? 'active' : ''}" data-i18n="navTajweed">التجويد</a>
              <a href="/duas" class="mobile-nav-link ${props.activeNav === 'duas' ? 'active' : ''}" data-i18n="navDuas">الأدعية والأذكار</a>
              <a href="/names" class="mobile-nav-link ${props.activeNav === 'names' ? 'active' : ''}" data-i18n="navNames">أسماء الله الحسنى</a>
              <a href="/ai" class="mobile-nav-link ${props.activeNav === 'ai' ? 'active' : ''}" data-i18n="navAi">المساعد القرآني الذكي</a>
              <a href="/languages" class="mobile-nav-link ${props.activeNav === 'languages' ? 'active' : ''}" data-i18n="navTranslations">الترجمات العالمية</a>
            </div>
          </div>

          <div class="mobile-sidebar-section">
            <span class="mobile-section-title">الأدوات والإعدادات</span>
            <div class="mobile-sidebar-actions-grid">
              <button type="button" class="mobile-action-pill" data-open-about-dev>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><line x1="14" y1="4" x2="10" y2="20"/></svg>
                <span>عن المطور (ياسين أبوعاصي)</span>
              </button>

              <button type="button" class="mobile-action-pill" id="mobile-open-bookmarks-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                <span>العلامات المرجعية</span>
              </button>

              <a href="https://islamonline.net" target="_blank" rel="noopener noreferrer" class="mobile-action-pill">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
                <span>IslamOnline.net (فتاوى وبحوث)</span>
              </a>

              <a href="https://github.com/yxqo41/kalamalah-player" target="_blank" rel="noopener noreferrer" class="mobile-action-pill" dir="ltr">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11.05 11.05 0 0 1 5.78 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.58.24 2.75.12 3.04.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>
                <span>GitHub Source</span>
              </a>
            </div>

            <div class="mobile-sidebar-theme-row">
              <span class="mobile-sub-label">Theme:</span>
              <div class="theme-segmented" role="group" aria-label="Theme">
                <button type="button" class="theme-seg-btn" data-set-theme="dark" data-i18n="themeDark">Dark</button>
                <button type="button" class="theme-seg-btn" data-set-theme="light" data-i18n="themeLight">Light</button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>

  <!-- Main Page Content -->
  <main id="main-content" class="page-main">
    ${props.bodyContent}
  </main>

  <!-- Minimal Site Footer -->
  <footer class="site-footer">
    <div class="footer-minimal container">
      <div class="footer-min-left">
        <strong data-i18n="appTitle">كلام الله</strong>
        <span class="footer-sep">/</span>
        <a href="/mushaf-1" data-i18n="navMushaf">المصحف</a>
        <a href="/reciters" data-i18n="navReciters">القراء</a>
        <a href="/tafseer-1" data-i18n="navTafseer">التفسير</a>
        <a href="/tajweed" data-i18n="navTajweed">التجويد</a>
        <a href="/duas" data-i18n="navDuas">الأدعية</a>
        <a href="/names" data-i18n="navNames">أسماء الله الحسنى</a>
        <a href="/ai" data-i18n="navAi">المساعد الذكي</a>
        <a href="https://islamonline.net" target="_blank" rel="noopener noreferrer" class="footer-iol-link" title="شبكة إسلام أون لاين للفتاوى والمقالات الإسلامية (ترشيح معرفي غير رسمي)">IslamOnline.net</a>
        <a href="https://api.kalamalah.com/docs" target="_blank" rel="noopener noreferrer">API</a>
        <a href="https://github.com/yxqo41/kalamalah-mobile/releases/latest" target="_blank" rel="noopener noreferrer" data-i18n="androidApp">تطبيق الأندرويد</a>
        <button type="button" class="footer-dev-trigger" data-open-about-dev data-i18n="aboutDeveloper">عن المطور: ياسين أبوعاصي</button>
      </div>
      <div class="footer-min-right">
        <label id="footer-lang-lbl" class="sr-only" data-i18n="uiLanguage">لغة الواجهة</label>
        <div id="footer-lang-dropdown" data-sd-label="footer-lang-lbl"></div>
      </div>
    </div>
  </footer>

  <!-- Floating Reading Progress Tracker Banner -->
  <aside id="reading-tracker" class="reading-tracker hidden" aria-label="متابعة القراءة">
    <div class="reading-tracker-body">
      <div class="rt-text">
        <span class="rt-kicker" data-i18n="lastReadPosition">آخر موضع قراءة محفوظ</span>
        <strong id="rt-label">سورة الفاتحة، الآية ١</strong>
      </div>
      <div class="rt-actions">
        <a id="rt-continue-link" href="/surah-1" class="rt-btn-continue" data-i18n="continueReading">متابعة</a>
        <button type="button" id="rt-dismiss-btn" class="rt-btn-close" aria-label="إغلاق">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
  </aside>

  <!-- Bookmarks Modal -->
  <div id="bookmarksModal" class="modal-backdrop hidden" role="dialog" aria-modal="true" aria-labelledby="bm-modal-title">
    <div class="modal-card">
      <div class="modal-header">
        <h3 id="bm-modal-title" data-i18n="savedBookmarks">العلامات المرجعية المحفوظة</h3>
        <button type="button" class="modal-close-btn" data-close-modal="bookmarksModal" aria-label="إغلاق">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div id="bookmarks-list-container" class="modal-body">
        <p class="empty-hint" data-i18n="noBookmarksHint">لا توجد علامات مرجعية محفوظة بعد. اضغط على أيقونة الحفظ بجانب أي آية لإضافتها هنا.</p>
      </div>
    </div>
  </div>

  <!-- Quick Ayah Tafseer Modal -->
  <div id="ayahTafseerModal" class="modal-backdrop hidden" role="dialog" aria-modal="true" aria-labelledby="tafseer-modal-title">
    <div class="modal-card modal-lg">
      <div class="modal-header">
        <h3 id="tafseer-modal-title" data-i18n="ayahTafseerTitle">تفسير الآية الكريمة</h3>
        <button type="button" class="modal-close-btn" data-close-modal="ayahTafseerModal" aria-label="إغلاق">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="tafseer-modal-controls">
          <label id="modal-tafseer-book-lbl" data-i18n="chooseTafseerBook">اختر كتاب التفسير</label>
          <div id="modal-tafseer-dropdown" data-sd-label="modal-tafseer-book-lbl"></div>
        </div>
        <div id="modal-ayah-arabic" class="modal-ayah-quote quran-reading-text"></div>
        <div id="modal-tafseer-content" class="modal-tafseer-text"></div>
      </div>
    </div>
  </div>

  <!-- Floating Bottom-Left Gold Scroll-to-Top Button -->
  <button type="button" id="scroll-to-top-btn" class="scroll-to-top-fab hidden" title="Back to top" aria-label="Back to top">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>
  </button>

  <!-- Floating AI Assistant Bubble & Chat Window with Saved History -->
  <button type="button" id="ai-fab-btn" class="ai-fab-btn" title="Kalamalah AI" aria-label="Open AI Assistant" aria-expanded="false" aria-controls="ai-widget-panel">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2L14.6 9.4L22 12L14.6 14.6L12 22L9.4 14.6L2 12L9.4 9.4L12 2Z" />
    </svg>
  </button>

  <aside id="ai-widget-panel" class="ai-widget-panel hidden" role="dialog" aria-label="Kalamalah AI Assistant">
    <header class="ai-widget-header">
      <div class="ai-widget-title-wrap">
        <span class="ai-widget-spark" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.6 9.4L22 12L14.6 14.6L12 22L9.4 14.6L2 12L9.4 9.4L12 2Z"/></svg>
        </span>
        <div>
          <strong id="ai-widget-title">Kalamalah AI</strong>
          <span class="ai-widget-sub" id="ai-widget-sub">Quran, Tafseer & Duas</span>
        </div>
      </div>
      <div class="ai-widget-hdr-actions">
        <button type="button" id="ai-widget-history-btn" class="ai-widget-hdr-btn" title="Saved Chats" aria-label="Saved Chats">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
        </button>
        <button type="button" id="ai-widget-new-btn" class="ai-widget-hdr-btn" title="New Chat" aria-label="New Chat">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <button type="button" id="ai-widget-close-btn" class="ai-widget-hdr-btn" title="Close" aria-label="Close">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </header>

    <div id="ai-widget-history-view" class="ai-widget-history-view hidden"></div>

    <div id="ai-widget-chat-view" class="ai-widget-chat-view">
      <div id="ai-widget-messages" class="ai-widget-messages" role="log" aria-live="polite"></div>
      <form id="ai-widget-form" class="ai-widget-form" autocomplete="off">
        <input type="text" id="ai-widget-input" class="ai-widget-input" placeholder="Ask about Quran, Tafseer, or Duas..." required />
        <button type="submit" id="ai-widget-send-btn" class="ai-widget-send-btn" aria-label="Send">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </form>
    </div>
  </aside>

  <!-- Cookie & Local Preferences Banner -->
  <div id="cookie-consent-banner" class="cookie-consent-banner hidden" role="region" aria-label="Cookie and storage preferences">
    <p id="cookie-consent-text">We use browser storage for your theme, language, bookmarks, reading position, and AI chat history.</p>
    <div class="cookie-consent-actions">
      <button type="button" id="cookie-accept-btn" class="btn-primary-gold sm">Accept</button>
      <button type="button" id="cookie-essential-btn" class="btn-glass-sm">Essential Only</button>
    </div>
  </div>

  <!-- About the Developer Modal (Yaseen Aboasy - 1:1 Match) -->
  <div id="aboutDeveloperModal" class="modal-backdrop hidden" role="dialog" aria-modal="true" aria-labelledby="dev-modal-title">
    <div class="modal-card dev-about-modal-card">
      <button type="button" class="modal-close-btn dev-modal-close" data-close-modal="aboutDeveloperModal" aria-label="إغلاق">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div class="dev-about-body" dir="rtl">
        <div class="dev-code-icon" aria-hidden="true">
          <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><line x1="14" y1="4" x2="10" y2="20"/></svg>
        </div>
        <h2 id="dev-modal-title" class="dev-name-title">ياسين أبوعاصي</h2>
        <p class="dev-role-subtitle">المطور الرئيسي وصاحب الرؤية</p>
        <div class="dev-story-paragraphs">
          <p>السلام عليكم! أنا <strong>ياسين أبوعاصي</strong>، مطور شاب من مواليد <strong>20 ديسمبر 2013</strong>.</p>
          <p>بدأ هذا المشروع رحلته باسم <em><strong>QuranOnTheWeb.net</strong></em> في <strong>يوليو 2025</strong>. لقد عملت بجد عليه حتى أكتوبر 2025، ولكن لسوء الحظ، لم يحقق النجاح الذي كنت أتمناه.</p>
          <p>في <strong>مارس 2026</strong>، قررت بث حياة جديدة فيه. بدأت بإضافة ميزات متقدمة، وأعدت تسميته إلى <strong>Kalamalah</strong>، وحسنت كل التفاصيل. منذ ذلك الحين، انتشر التطبيق على نطاق واسع وهو محبوب من الكثيرين لجماله وفائدته.</p>
          <p>تم بناء هذا التطبيق بـ <strong>حب</strong> ورغبة صادقة في خدمة الأمة.</p>
        </div>
        <div class="dev-contact-block">
          <h3>تواصل معي</h3>
          <a href="mailto:yaseen.aboasy@gmail.com" class="dev-email-link" dir="ltr">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>
            <span>yaseen.aboasy@gmail.com</span>
          </a>
          <a href="https://github.com/yxqo41/kalamalah-player" target="_blank" rel="noopener noreferrer" class="dev-gh-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11.05 11.05 0 0 1 5.78 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.58.24 2.75.12 3.04.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>
            <span>المصدر على GitHub</span>
          </a>
          <p class="dev-made-with-love">صنع بكل <span>❤️</span> للعالم.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Share Modal (WhatsApp, Telegram, X, Facebook, Copy Link) -->
  <div id="shareModal" class="modal-backdrop hidden" role="dialog" aria-modal="true" aria-labelledby="share-modal-title">
    <div class="modal-card">
      <div class="modal-header">
        <h3 id="share-modal-title" data-i18n="sharePageTitle">مشاركة الصفحة</h3>
        <button type="button" class="modal-close-btn" data-close-modal="shareModal" aria-label="إغلاق">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="share-grid">
          <a id="share-whatsapp" href="#" target="_blank" rel="noopener noreferrer" class="share-option-btn">
            <span>واتساب (WhatsApp)</span>
          </a>
          <a id="share-telegram" href="#" target="_blank" rel="noopener noreferrer" class="share-option-btn">
            <span>تيليجرام (Telegram)</span>
          </a>
          <a id="share-x" href="#" target="_blank" rel="noopener noreferrer" class="share-option-btn">
            <span>منصة إكس (X)</span>
          </a>
          <a id="share-facebook" href="#" target="_blank" rel="noopener noreferrer" class="share-option-btn">
            <span>فيسبوك (Facebook)</span>
          </a>
        </div>
        <div class="share-copy-row">
          <input type="text" id="share-url-input" class="share-url-input" readonly dir="ltr" value="${escapeHtml(canonicalUrl)}" />
          <button type="button" id="share-copy-btn" class="btn-primary-gold sm" data-i18n="copyLink">نسخ الرابط</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Persistent Apple-Style Quran Bottom Player Bar -->
  <aside id="quran-player-bar" class="quran-player-bar" aria-label="مشغل التلاوة الصوتي">
    <!-- Top Thin Interactive Progress Scrubber -->
    <div class="qp-scrubber-bar" id="qp-bar-scrubber" role="slider" aria-label="شريط تقدم التلاوة" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0">
      <div class="qp-scrubber-fill" id="qp-bar-progress-fill" style="width: 0%"></div>
    </div>

    <div class="qp-bar-inner">
      <!-- Track & Reciter Info -->
      <div class="qp-track-meta">
        <button type="button" id="qp-expand-fullscreen-btn" class="qp-artwork-btn" title="فتح شاشة العرض المتزامن الكامل">
          <img id="qp-bar-reciter-img" src="https://api.kalamalah.com/api/reciter-profile/haitham-al-dukhin" alt="القارئ" class="qp-artwork-img" onerror="this.src='/images/round-logo.png'" />
          <span class="qp-artwork-expand-icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
          </span>
        </button>

        <div class="qp-titles">
          <div class="qp-surah-row">
            <strong id="qp-bar-surah-title">سورة الفاتحة</strong>
          </div>
          <div class="qp-reciter-row">
            <a id="qp-bar-reciter-name" href="/reciter-haitham-al-dukhin" class="qp-reciter-link">هيثم الدخين</a>
            <span id="qp-bar-current-ayah-label" class="qp-ayah-indicator">الآية ١</span>
          </div>
        </div>
      </div>

      <!-- Playback Controls (AeroUI & LyricsFlow Icons) -->
      <div class="qp-controls" dir="ltr">
        <button type="button" id="qp-repeat-btn" class="qp-ctrl-btn sm" title="تكرار التلاوة (إيقاف / السورة / الآية)" aria-label="تكرار">
          <img id="qp-repeat-icon" src="/icons/repeat.svg" alt="Repeat" width="20" height="20" />
        </button>

        <button type="button" id="qp-prev-ayah-btn" class="qp-ctrl-btn aero-player" title="الآية السابقة" aria-label="الآية السابقة">
          <span class="aero-skip" data-direction="backward"></span>
        </button>

        <button type="button" id="qp-play-toggle-btn" class="qp-play-main-btn aero-player" title="تشغيل / إيقاف مؤقت" aria-label="تشغيل">
          <svg class="icon-play" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6.8 4 17.2Q4 21 7.31 19.14L18.26 12.98Q20 12 18.26 11.02L7.31 4.86Q4 3 4 6.8Z"/></svg>
          <svg class="icon-pause hidden" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M5.4 4.8Q5 4.8 5 5.2L5 18.8Q5 19.2 5.4 19.2L9.2 19.2Q9.6 19.2 9.6 18.8L9.6 5.2Q9.6 4.8 9.2 4.8ZM14.8 4.8Q14.4 4.8 14.4 5.2L14.4 18.8Q14.4 19.2 14.8 19.2L18.6 19.2Q19 19.2 19 18.8L19 5.2Q19 4.8 18.6 4.8Z"/></svg>
        </button>

        <button type="button" id="qp-next-ayah-btn" class="qp-ctrl-btn aero-player" title="الآية التالية" aria-label="الآية التالية">
          <span class="aero-skip" data-direction="forward"></span>
        </button>

        <button type="button" id="qp-speed-btn" class="qp-ctrl-btn speed-pill" title="سرعة التلاوة">1x</button>
      </div>

      <!-- Right Tools: Time, Reciter Combobox, & Fullscreen Lyrics Icon -->
      <div class="qp-right-tools">
        <div class="qp-time-display" dir="ltr">
          <span id="qp-current-time">0:00</span>
          <span class="qp-time-sep">/</span>
          <span id="qp-total-duration">0:00</span>
        </div>

        <div class="qp-reciter-select-wrap">
          <label id="qp-reciter-dd-lbl" class="sr-only">اختر القارئ</label>
          <div id="qp-bar-reciter-dropdown" data-sd-label="qp-reciter-dd-lbl"></div>
        </div>

        <a id="qp-download-surah-btn" href="/api/download/haitham-al-dukhin/1" class="qp-lyrics-icon-btn" title="تحميل تلاوة السورة (MP3)" aria-label="تحميل السورة MP3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </a>

        <button type="button" id="qp-open-fullscreen-trigger" class="qp-lyrics-icon-btn" title="شاشة التلاوة المتزامنة (LyricsFlow View)">
          <img src="/icons/lyrics.svg" alt="Lyrics" width="22" height="22" />
        </button>
      </div>
    </div>

    <audio id="kalamalah-audio-el" preload="none" crossorigin="anonymous"></audio>
  </aside>

  <!-- Fullscreen Synced Quran View (1:1 Port of LyricsFlow main/player.html + dybg + AeroUI + AML Physics) -->
  <section id="aml-fullscreen-player" class="aml-fullscreen-overlay hidden" role="dialog" aria-modal="true" aria-label="شاشة التلاوة المتزامنة">
    <!-- Dynamic Background (WebGL dybg from main/js/dybg.js) -->
    <div class="lyricsflow-dynamic-bg active hidden" id="dynamic-bg" aria-hidden="true"></div>

    <!-- Moving & Cross-Fading Kaaba / Islamic Backgrounds (Default) -->
    <div class="aml-islamic-bg-slideshow" id="aml-islamic-bg" aria-hidden="true">
      <div class="aml-islamic-slide slide-a is-visible kb-pan-a" id="aml-bg-slide-a"></div>
      <div class="aml-islamic-slide slide-b" id="aml-bg-slide-b"></div>
      <div class="aml-islamic-vignette"></div>
    </div>

    <!-- Top-Left Pill: Close Fullscreen -->
    <div class="pc-top-left-pill-bar">
      <button type="button" id="aml-corner-close-btn" class="pc-pill-btn" title="إغلاق (Esc)" aria-label="إغلاق">
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <!-- Mobile Grabber Pill -->
    <button type="button" id="aml-close-fullscreen-btn" class="aml-sheet-handle" title="إغلاق العرض الكامل (Esc)" aria-label="إغلاق العرض الكامل"></button>

    <!-- Top-Right Bar (Sync Offset Pill + Volume Capsule like main/player.html) -->
    <div class="pc-top-volume-bar" dir="ltr">
      <div class="pc-sync-offset-pill" title="ضبط التزامن بالمللي ثانية">
        <button type="button" class="pc-sync-btn-step" id="aml-sync-minus-btn" aria-label="تقديم التزامن -100ms">−</button>
        <span class="pc-sync-label" id="aml-sync-offset-label">0ms</span>
        <button type="button" class="pc-sync-btn-step" id="aml-sync-plus-btn" aria-label="تأخير التزامن +100ms">+</button>
      </div>

      <button type="button" id="aml-bg-mode-btn" class="pc-dock-pill-btn active" title="تغيير نوع الخلفية (الكعبة والحرمين / ديناميكية / إيقاف)">الخلفية: الكعبة والحرمين</button>
      <button type="button" id="aml-bg-next-btn" class="pc-dock-pill-btn" title="تبديل صورة الخلفية الإسلامية" aria-label="الصورة التالية">↻</button>
      <button type="button" id="aml-toggle-translation-btn" class="pc-dock-pill-btn active" data-i18n="btnTranslation" title="إظهار / إخفاء الترجمة">الترجمة</button>
      <button type="button" id="aml-toggle-tajweed-btn" class="pc-dock-pill-btn" data-i18n="btnTajweed" title="تلوين أحكام التجويد">التجويد</button>
    </div>

    <!-- ContentBox (1:1 LyricsFlow Layout: NowBar on side + LyricsContainer) -->
    <div class="aml-layout ContentBox">
      <!-- NowBar Column: Reciter Artwork, Metadata, AeroUI Elastic Scrubber, AeroUI Controls, Volume -->
      <div class="aml-player-column NowBar">
        <div class="MediaBox" id="media-box">
          <div class="MediaImageContainer paused" id="aml-artwork-card">
            <img id="aml-reciter-art-img" src="https://api.kalamalah.com/api/reciter-profile/haitham-al-dukhin" alt="القارئ" class="aml-reciter-cover-img" crossorigin="anonymous" onerror="this.src='/images/logo.jpg'" />
            <div class="aml-artwork-overlay-meta">
              <span class="aml-card-surah-name" id="aml-art-surah-name">سورة الفاتحة</span>
              <span class="aml-card-surah-meta" id="aml-art-surah-meta">مكية · ٧ آيات · الجزء ١</span>
            </div>
          </div>
        </div>

        <div class="NowBarBottomWrapper">
          <div class="MetadataRow">
            <div class="Metadata">
              <div class="SongName"><span id="aml-now-surah-title">سورة الفاتحة</span></div>
              <a id="aml-now-reciter-link" href="/reciter-haitham-al-dukhin" class="Artists">القارئ هيثم الدخين</a>
            </div>
            <div class="MetadataActions">
              <a id="aml-download-surah-btn" href="/api/download/haitham-al-dukhin/1" class="favorite-button" title="تحميل تلاوة السورة (MP3)" aria-label="تحميل السورة MP3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </a>
              <button type="button" id="aml-bookmark-ayah-btn" class="favorite-button" title="حفظ الآية الحالية" aria-label="حفظ الآية">
                <img src="/icons/favorite.svg" alt="Favorite" width="22" height="22" />
              </button>
            </div>
          </div>

          <!-- Integrated Progress Bar (AeroUI elastic slider from main/player.html) -->
          <div class="NowBarProgress" dir="ltr">
            <div class="aero-elastic" id="aml-scrubber-track" data-min="0" data-max="1000" data-value="0" data-step="1" data-labels="bottom" data-stretch="0" role="slider" aria-label="شريط وقت التلاوة" tabindex="0">
              <div class="aero-elastic-track">
                <div class="aero-elastic-fill" id="aml-scrubber-fill" style="width: 0%"></div>
              </div>
              <div class="aero-elastic-labels">
                <span class="aero-elastic-label progress-time" id="aml-current-time">0:00</span>
                <span class="aero-elastic-label progress-time" id="aml-remaining-time">-0:00</span>
              </div>
            </div>
          </div>

          <!-- Integrated Playback Controls (AeroUI player-button & skip-label from main/player.html) -->
          <div class="NowBarControls" dir="ltr">
            <button type="button" id="aml-repeat-btn" class="playback-control repeat" title="تكرار التلاوة" aria-label="تكرار">
              <img id="aml-repeat-icon" src="/icons/repeat.svg" alt="Repeat" />
            </button>

            <button type="button" id="aml-prev-btn" class="playback-control aero-player skip-back" title="الآية السابقة" aria-label="الآية السابقة">
              <span class="aero-skip" data-direction="backward"></span>
            </button>

            <button type="button" id="aml-play-btn" class="playback-control aero-player play-pause" title="تشغيل / إيقاف" aria-label="تشغيل">
              <svg class="icon-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M4 6.8 4 17.2Q4 21 7.31 19.14L18.26 12.98Q20 12 18.26 11.02L7.31 4.86Q4 3 4 6.8Z" />
              </svg>
              <svg class="icon-pause hidden" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M5.4 4.8Q5 4.8 5 5.2L5 18.8Q5 19.2 5.4 19.2L9.2 19.2Q9.6 19.2 9.6 18.8L9.6 5.2Q9.6 4.8 9.2 4.8ZM14.8 4.8Q14.4 4.8 14.4 5.2L14.4 18.8Q14.4 19.2 14.8 19.2L18.6 19.2Q19 19.2 19 18.8L19 5.2Q19 4.8 18.6 4.8Z" />
              </svg>
            </button>

            <button type="button" id="aml-next-btn" class="playback-control aero-player skip-forward" title="الآية التالية" aria-label="الآية التالية">
              <span class="aero-skip" data-direction="forward"></span>
            </button>

            <button type="button" id="aml-speed-cycle-btn" class="playback-control speed-txt" title="سرعة التلاوة">1x</button>
          </div>

          <!-- Volume Area (from main/player.html) -->
          <div class="VolumeArea" dir="ltr">
            <img src="/icons/volume_low.png" class="volume-side-icon" alt="Volume Low" />
            <div class="volume-slider-wrapper">
              <input type="range" id="aml-volume-slider" class="volume-slider" min="0" max="1" step="0.02" value="1" aria-label="مستوى الصوت" />
            </div>
            <img src="/icons/volume_full.png" class="volume-side-icon" alt="Volume High" />
          </div>
        </div>
      </div>

      <!-- LyricsContainer (1:1 AMLL / LyricsFlow Spring-Physics --ty Track) -->
      <div class="aml-lyrics-column LyricsContainer">
        <div id="aml-scroll-container" class="aml-lyrics-scroll-container LyricsContent">
          <div id="aml-ayahs-list" class="aml-ayahs-list lyrics-track">
            <p class="aml-empty-msg">اختر سورة أو اضغط على زر التشغيل لبدء التلاوة المتزامنة بالآيات والكلمات.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom-Left Subtle Hide-HUD Toggle (Low Opacity) -->
    <button type="button" id="aml-toggle-hud-btn" class="aml-hud-toggle-btn" title="Hide / Show Controls (H)" aria-label="Hide or show player controls" aria-pressed="false">
      <svg class="icon-hud-hide" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
      <svg class="icon-hud-show hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
    </button>
  </section>

  <!-- Bootstrap JSON Data for Instant Client Hydration -->
  <script id="kalamalah-bootstrap" type="application/json">${JSON.stringify(clientCatalogBootstrap)}</script>
  <script type="module" src="/js/app.js"></script>
</body>
</html>`;
}
