/**
 * Multi-Language UI & Full RTL/LTR Localization Engine for Kalamalah Player
 * Supports: Arabic (ar, RTL), English (en, LTR), French (fr, LTR),
 * Turkish (tr, LTR), Indonesian (id, LTR), Urdu (ur, RTL).
 */

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export type UiLocale = 'ar' | 'en' | 'fr' | 'tr' | 'id' | 'ur';

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function isRtlLocale(locale: UiLocale): boolean {
  return locale === 'ar' || locale === 'ur';
}

export function formatLocaleDigits(num: number | string, locale = getActiveLocale()): string {
  const s = String(num);
  if (locale === 'ar' || locale === 'ur') {
    return s.replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)] ?? d);
  }
  return s.replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
}

export function getActiveLocale(): UiLocale {
  try {
    // v2 key: English is the default. The legacy v1 key defaulted to 'ar', so it is ignored on purpose.
    const saved = localStorage.getItem('kalamalah_ui_locale_v2') || 'en';
    if (['ar', 'en', 'fr', 'tr', 'id', 'ur'].includes(saved)) {
      return saved as UiLocale;
    }
  } catch {}
  return 'en';
}

export const UI_TRANSLATIONS: Record<UiLocale, Record<string, string>> = {
  ar: {
    appTitle: 'كلام الله',
    ramadanEdition: 'رمضان كريم',
    navHome: 'الرئيسية',
    navSurahs: 'السور',
    navJuzs: 'الأجزاء',
    navMushaf: 'المصحف',
    navReciters: 'القراء',
    navTafseer: 'التفسير',
    navTajweed: 'التجويد',
    navDuas: 'الأدعية',
    navNames: 'أسماء الله',
    navAi: 'المساعد الذكي',
    navTranslations: 'الترجمات',
    jumpToAyah: 'انتقل إلى آية',
    btnDownload: 'تحميل',
    aboutDeveloper: 'عن المطور: ياسين أبوعاصي',
    uiLanguage: 'لغة الواجهة',
    themeAuto: 'تلقائي',
    themeDark: 'داكن',
    themeLight: 'فاتح',
    androidApp: 'تطبيق الأندرويد',
    lastReadPosition: 'آخر موضع قراءة محفوظ',
    continueReading: 'متابعة',
    savedBookmarks: 'العلامات المرجعية المحفوظة',
    noBookmarksHint: 'لا توجد علامات مرجعية محفوظة بعد. اضغط على أيقونة الحفظ بجانب أي آية لإضافتها هنا.',
    ayahTafseerTitle: 'تفسير الآية الكريمة',
    chooseTafseerBook: 'اختر كتاب التفسير',
    sharePageTitle: 'مشاركة الصفحة',
    copyLink: 'نسخ الرابط',
    copied: 'تم النسخ',
    jumpToSurahPlaceholder: 'انتقل إلى سورة...',
    searchSurahPlaceholder: 'ابحث عن سورة...',
    selectReciterPlaceholder: 'اختر القارئ...',
    searchReciterPlaceholder: 'ابحث عن قارئ...',
    selectPagePlaceholder: 'انتقل إلى صفحة (1 - 604)...',
    searchPagePlaceholder: 'اكتب رقم الصفحة...',
    filterAll: 'الكل',
    filterMeccan: 'مكية',
    filterMedinan: 'مدنية',
    surahPrefix: 'سورة',
    juzPrefix: 'الجزء',
    pagePrefix: 'صفحة',
    pageShort: 'ص',
    ayahPrefix: 'الآية',
    ayahsUnit: 'آية',
    reciterPrefix: 'القارئ',
    btnPlay: 'تشغيل',
    btnListen: 'استماع',
    btnSyncedView: 'عرض متزامن',
    btnShare: 'مشاركة',
    btnTranslation: 'الترجمة',
    btnTajweed: 'التجويد',
    btnDiacritics: 'التشكيل',
    btnMemorize: 'الحفظ',
    btnRange: 'النطاق',
    fontUthmani: 'عثماني',
    fontKitab: 'كتاب',
    fontAmiri: 'أميري',
    fontNastaleeq: 'نستعليق',
    viewCards: 'آيات',
    viewMushafFlow: 'متصل',
    viewTafseer: 'تفسير',
    bgDynamic: 'الخلفية: ديناميكية',
    bgIslamic: 'الخلفية: الكعبة والحرمين',
    bgOff: 'الخلفية: معطلة',
    syncOffsetPrefix: 'ضبط التزامن',
    prevSurah: 'السورة السابقة',
    nextSurah: 'السورة التالية',
    holyMushaf: 'المصحف الشريف',
    readFromPage: 'قراءة من صفحة',
    showFullSurah: 'عرض السورة كاملة',
    prevPage: 'الصفحة السابقة',
    nextPage: 'الصفحة التالية',
    wbwSyncTag: 'مزامنة الكلمات',
    ccSyncTag: 'مزامنة الآيات',
    audioOnlyTag: 'مصحف مرتل',
    allRecitersFilter: 'جميع القراء',
    wbwFilter: 'مزامنة كلمة بكلمة',
    ccFilter: 'مزامنة الآيات',
    fromAyah: 'من الآية',
    toAyah: 'إلى الآية',
    applyRange: 'تطبيق النطاق',
    searchInSurahPlaceholder: 'ابحث عن كلمة داخل السورة...',
    revealAllTemp: 'إظهار الكل مؤقتاً',
    memoOff: 'إيقاف الإخفاء',
    memoAll: 'إخفاء جميع الكلمات',
    tashkeelAll: 'التشكيل الكامل',
    tashkeelBasic: 'الحركات الأساسية فقط',
    tashkeelNoWaqf: 'إخفاء علامات الوقف',
    tashkeelRasm: 'رسم الكلمات بدون تشكيل',
    schemaPrinted: 'ألوان المصحف المطبوع (مبسط)',
    schemaDetailed: 'تفصيلي موسع',
    compareTafseers: 'مقارنة التفاسير',
    mistakeNote: 'تنبيه',
    listenToSurahByReciter: 'الاستماع لسورة {surah} بصوت القارئ {reciter}',
    listenBtn: 'استمع',
    readingSettingsTitle: 'إعدادات القراءة',
    breadcrumbHome: 'الرئيسية',
    breadcrumbQuran: 'القرآن الكريم',
    mainNavHeading: 'التنقل الرئيسي',
    toolsAndSettings: 'الأدوات والإعدادات',
    commonMistake: 'الخطأ الشائع',
    correctReading: 'الصواب',
  },
  en: {
    appTitle: 'Kalamalah',
    ramadanEdition: 'Ramadan Edition',
    navHome: 'Home',
    navSurahs: 'Surahs',
    navJuzs: 'Juzs',
    navMushaf: 'Mushaf',
    navReciters: 'Reciters',
    navTafseer: 'Tafseer',
    navTajweed: 'Tajweed',
    navDuas: 'Duas & Adhkar',
    navNames: '99 Names',
    navAi: 'AI Assistant',
    navTranslations: 'Translations',
    jumpToAyah: 'Jump to Ayah',
    btnDownload: 'Download',
    aboutDeveloper: 'Developer: Yaseen Aboasy',
    uiLanguage: 'Language',
    themeAuto: 'Auto',
    themeDark: 'Dark',
    themeLight: 'Light',
    androidApp: 'Android App',
    lastReadPosition: 'Last Saved Reading Position',
    continueReading: 'Continue',
    savedBookmarks: 'Saved Bookmarks',
    noBookmarksHint: 'No bookmarks saved yet. Click the bookmark icon next to any ayah to save it here.',
    ayahTafseerTitle: 'Ayah Tafseer',
    chooseTafseerBook: 'Choose Tafseer Book',
    sharePageTitle: 'Share Page',
    copyLink: 'Copy Link',
    copied: 'Copied',
    jumpToSurahPlaceholder: 'Jump to Surah...',
    searchSurahPlaceholder: 'Search surah...',
    selectReciterPlaceholder: 'Select Reciter...',
    searchReciterPlaceholder: 'Search reciter...',
    selectPagePlaceholder: 'Go to page (1 - 604)...',
    searchPagePlaceholder: 'Type page number...',
    filterAll: 'All',
    filterMeccan: 'Meccan',
    filterMedinan: 'Medinan',
    surahPrefix: 'Surah',
    juzPrefix: 'Juz',
    pagePrefix: 'Page',
    pageShort: 'p.',
    ayahPrefix: 'Ayah',
    ayahsUnit: 'Ayahs',
    reciterPrefix: 'Reciter',
    btnPlay: 'Play',
    btnListen: 'Listen',
    btnSyncedView: 'Synced View',
    btnShare: 'Share',
    btnTranslation: 'Translation',
    btnTajweed: 'Tajweed',
    btnDiacritics: 'Diacritics',
    btnMemorize: 'Memorize',
    btnRange: 'Range',
    fontUthmani: 'Uthmani',
    fontKitab: 'Kitab',
    fontAmiri: 'Amiri',
    fontNastaleeq: 'Nastaleeq',
    viewCards: 'Ayahs',
    viewMushafFlow: 'Continuous',
    viewTafseer: 'Tafseer',
    bgDynamic: 'BG: Dynamic',
    bgIslamic: 'BG: Kaaba & Islam',
    bgOff: 'BG: Off',
    syncOffsetPrefix: 'Sync Offset',
    prevSurah: 'Previous Surah',
    nextSurah: 'Next Surah',
    holyMushaf: 'Holy Mushaf',
    readFromPage: 'Read from Page',
    showFullSurah: 'Show full Surah',
    prevPage: 'Previous Page',
    nextPage: 'Next Page',
    wbwSyncTag: 'Word-by-Word',
    ccSyncTag: 'Ayah Sync',
    audioOnlyTag: 'Full Audio',
    allRecitersFilter: 'All Reciters',
    wbwFilter: 'Word-by-Word',
    ccFilter: 'Ayah Sync',
    fromAyah: 'From Ayah',
    toAyah: 'To Ayah',
    applyRange: 'Apply Range',
    searchInSurahPlaceholder: 'Search word in surah...',
    revealAllTemp: 'Reveal All Temporarily',
    memoOff: 'Off',
    memoAll: 'Hide All Words',
    tashkeelAll: 'Full Diacritics',
    tashkeelBasic: 'Basic Vowels Only',
    tashkeelNoWaqf: 'Hide Waqf Marks',
    tashkeelRasm: 'Rasm Only (No Vowels)',
    schemaPrinted: 'Printed Mushaf (Simplified)',
    schemaDetailed: 'Detailed Extended',
    compareTafseers: 'Compare Tafseers',
    mistakeNote: 'Note',
    listenCorrect: 'Listen to Correct Reading',
    listenToSurahByReciter: 'Listen to Surah {surah} recited by {reciter}',
    listenBtn: 'Listen',
    readingSettingsTitle: 'Reading Settings',
    breadcrumbHome: 'Home',
    breadcrumbQuran: 'Holy Quran',
    mainNavHeading: 'Main Navigation',
    toolsAndSettings: 'Tools & Settings',
    commonMistake: 'Common Mistake',
    correctReading: 'Correct',
  },
  fr: {
    appTitle: 'Kalamalah',
    ramadanEdition: 'Édition Ramadan',
    navHome: 'Accueil',
    navSurahs: 'Sourates',
    navJuzs: 'Juz',
    navMushaf: 'Moushaf',
    navReciters: 'Récitateurs',
    navTafseer: 'Tafsir',
    navTajweed: 'Tajwid',
    navDuas: 'Invocations',
    navNames: '99 Noms',
    navAi: 'Assistant IA',
    navTranslations: 'Traductions',
    jumpToAyah: 'Aller au verset',
    btnDownload: 'Télécharger',
    aboutDeveloper: 'Développeur : Yaseen Aboasy',
    uiLanguage: 'Langue',
    themeAuto: 'Auto',
    themeDark: 'Sombre',
    themeLight: 'Clair',
    androidApp: 'App Android',
    lastReadPosition: 'Dernière position de lecture',
    continueReading: 'Continuer',
    savedBookmarks: 'Signets enregistrés',
    noBookmarksHint: 'Aucun signet enregistré.',
    ayahTafseerTitle: 'Tafsir du verset',
    chooseTafseerBook: 'Choisir le livre de Tafsir',
    sharePageTitle: 'Partager la page',
    copyLink: 'Copier le lien',
    copied: 'Copié',
    jumpToSurahPlaceholder: 'Aller à la sourate...',
    searchSurahPlaceholder: 'Rechercher une sourate...',
    selectReciterPlaceholder: 'Choisir le récitateur...',
    searchReciterPlaceholder: 'Rechercher un récitateur...',
    selectPagePlaceholder: 'Aller à la page (1 - 604)...',
    searchPagePlaceholder: 'Numéro de page...',
    filterAll: 'Tout',
    filterMeccan: 'Mecquoise',
    filterMedinan: 'Médinoise',
    surahPrefix: 'Sourate',
    juzPrefix: 'Juz',
    pagePrefix: 'Page',
    pageShort: 'p.',
    ayahPrefix: 'Verset',
    ayahsUnit: 'Versets',
    reciterPrefix: 'Récitateur',
    btnPlay: 'Lire',
    btnListen: 'Écouter',
    btnSyncedView: 'Vue synchronisée',
    btnShare: 'Partager',
    btnTranslation: 'Traduction',
    btnTajweed: 'Tajwid',
    btnDiacritics: 'Voyelles',
    btnMemorize: 'Mémoriser',
    btnRange: 'Plage',
    fontUthmani: 'Othmani',
    fontKitab: 'Kitab',
    fontAmiri: 'Amiri',
    fontNastaleeq: 'Nastaleeq',
    viewCards: 'Versets',
    viewMushafFlow: 'Continu',
    viewTafseer: 'Tafsir',
    bgDynamic: 'Fond : Dynamique',
    bgIslamic: 'Fond : Kaaba & Islam',
    bgOff: 'Fond : Désactivé',
    syncOffsetPrefix: 'Décalage',
    prevSurah: 'Sourate précédente',
    nextSurah: 'Sourate suivante',
    holyMushaf: 'Saint Moushaf',
    readFromPage: 'Lire depuis la page',
    showFullSurah: 'Voir la sourate complète',
    prevPage: 'Page précédente',
    nextPage: 'Page suivante',
    wbwSyncTag: 'Mot à mot',
    ccSyncTag: 'Sync versets',
    audioOnlyTag: 'Audio complet',
    allRecitersFilter: 'Tous les récitateurs',
    wbwFilter: 'Mot à mot',
    ccFilter: 'Sync versets',
    fromAyah: 'Du verset',
    toAyah: 'Au verset',
    applyRange: 'Appliquer',
    searchInSurahPlaceholder: 'Rechercher dans la sourate...',
    revealAllTemp: 'Tout révéler',
    memoOff: 'Désactivé',
    memoAll: 'Masquer tous les mots',
    tashkeelAll: 'Voyelles complètes',
    tashkeelBasic: 'Voyelles de base',
    tashkeelNoWaqf: 'Sans signes de pause',
    tashkeelRasm: 'Rasm uniquement',
    schemaPrinted: 'Moushaf imprimé',
    schemaDetailed: 'Détaillé',
    compareTafseers: 'Comparer les Tafsirs',
    mistakeNote: 'Note',
    listenCorrect: 'Écouter la bonne lecture',
    listenToSurahByReciter: 'Écouter la sourate {surah} récitée par {reciter}',
    listenBtn: 'Écouter',
    readingSettingsTitle: 'Paramètres de lecture',
    breadcrumbHome: 'Accueil',
    breadcrumbQuran: 'Saint Coran',
    mainNavHeading: 'Navigation principale',
    toolsAndSettings: 'Outils et options',
    commonMistake: 'Erreur fréquente',
    correctReading: 'Correct',
  },
  tr: {
    appTitle: 'Kalamalah',
    ramadanEdition: 'Ramazan Özel',
    navHome: 'Ana Sayfa',
    navSurahs: 'Sureler',
    navJuzs: 'Cüzler',
    navMushaf: 'Mushaf',
    navReciters: 'Kâriler',
    navTafseer: 'Tefsir',
    navTajweed: 'Tecvid',
    navDuas: 'Dualar',
    navNames: 'Esmaül Hüsna',
    navAi: 'Yapay Zeka',
    navTranslations: 'Mealler',
    jumpToAyah: 'Ayete Git',
    btnDownload: 'İndir',
    aboutDeveloper: 'Geliştirici: Yaseen Aboasy',
    uiLanguage: 'Dil',
    themeAuto: 'Oto',
    themeDark: 'Koyu',
    themeLight: 'Açık',
    androidApp: 'Android Uygulaması',
    lastReadPosition: 'Son Okunan Konum',
    continueReading: 'Devam Et',
    savedBookmarks: 'Kaydedilen Yer İmleri',
    noBookmarksHint: 'Henüz kaydedilmiş yer imi yok.',
    ayahTafseerTitle: 'Ayet Tefsiri',
    chooseTafseerBook: 'Tefsir Kitabı Seçin',
    sharePageTitle: 'Sayfayı Paylaş',
    copyLink: 'Bağlantıyı Kopyala',
    copied: 'Kopyalandı',
    jumpToSurahPlaceholder: 'Sureye git...',
    searchSurahPlaceholder: 'Sure ara...',
    selectReciterPlaceholder: 'Kâri seçin...',
    searchReciterPlaceholder: 'Kâri ara...',
    selectPagePlaceholder: 'Sayfaya git (1 - 604)...',
    searchPagePlaceholder: 'Sayfa numarası...',
    filterAll: 'Tümü',
    filterMeccan: 'Mekkî',
    filterMedinan: 'Medenî',
    surahPrefix: 'Sure',
    juzPrefix: 'Cüz',
    pagePrefix: 'Sayfa',
    pageShort: 's.',
    ayahPrefix: 'Ayet',
    ayahsUnit: 'Ayet',
    reciterPrefix: 'Kâri',
    btnPlay: 'Oynat',
    btnListen: 'Dinle',
    btnSyncedView: 'Senkronize Görünüm',
    btnShare: 'Paylaş',
    btnTranslation: 'Meal',
    btnTajweed: 'Tecvid',
    btnDiacritics: 'Harekeler',
    btnMemorize: 'Ezber',
    btnRange: 'Aralık',
    fontUthmani: 'Osmanî',
    fontKitab: 'Kitab',
    fontAmiri: 'Amiri',
    fontNastaleeq: 'Talik',
    viewCards: 'Ayetler',
    viewMushafFlow: 'Bitişik',
    viewTafseer: 'Tefsir',
    bgDynamic: 'Arka Plan: Dinamik',
    bgIslamic: 'Arka Plan: Kâbe ve İslam',
    bgOff: 'Arka Plan: Kapalı',
    syncOffsetPrefix: 'Senkron',
    prevSurah: 'Önceki Sure',
    nextSurah: 'Sonraki Sure',
    holyMushaf: 'Kur’ân-ı Kerîm Mushafı',
    readFromPage: 'Sayfadan Oku',
    showFullSurah: 'Tam sûreyi göster',
    prevPage: 'Önceki Sayfa',
    nextPage: 'Sonraki Sayfa',
    wbwSyncTag: 'Kelime Kelime',
    ccSyncTag: 'Ayet Senkron',
    audioOnlyTag: 'Tam Hatim',
    allRecitersFilter: 'Tüm Kâriler',
    wbwFilter: 'Kelime Kelime',
    ccFilter: 'Ayet Senkron',
    fromAyah: 'Başlangıç Ayeti',
    toAyah: 'Bitiş Ayeti',
    applyRange: 'Uygula',
    searchInSurahPlaceholder: 'Sure içinde kelime ara...',
    revealAllTemp: 'Tümünü Göster',
    memoOff: 'Kapalı',
    memoAll: 'Tüm Kelimeleri Gizle',
    tashkeelAll: 'Tam Harekeli',
    tashkeelBasic: 'Temel Harekeler',
    tashkeelNoWaqf: 'Vakıf İşaretlerini Gizle',
    tashkeelRasm: 'Harekesiz',
    schemaPrinted: 'Basılı Mushaf',
    schemaDetailed: 'Detaylı',
    compareTafseers: 'Tefsirleri Karşılaştır',
    mistakeNote: 'Uyarı',
    listenCorrect: 'Doğru Okunuşu Dinle',
    listenToSurahByReciter: '{reciter} tilavetiyle {surah} dinle',
    listenBtn: 'Dinle',
    readingSettingsTitle: 'Okuma Ayarları',
    breadcrumbHome: 'Ana Sayfa',
    breadcrumbQuran: 'Kur’ân-ı Kerîm',
    mainNavHeading: 'Ana Menü',
    toolsAndSettings: 'Araçlar ve Ayarlar',
    commonMistake: 'Yaygın Hata',
    correctReading: 'Doğrusu',
  },
  id: {
    appTitle: 'Kalamalah',
    ramadanEdition: 'Edisi Ramadan',
    navHome: 'Beranda',
    navSurahs: 'Surah',
    navJuzs: 'Juz',
    navMushaf: 'Mushaf',
    navReciters: 'Qari',
    navTafseer: 'Tafsir',
    navTajweed: 'Tajwid',
    navDuas: 'Doa & Dzikir',
    navNames: 'Asmaul Husna',
    navAi: 'Asisten AI',
    navTranslations: 'Terjemahan',
    jumpToAyah: 'Ke Ayat',
    btnDownload: 'Unduh',
    aboutDeveloper: 'Pengembang: Yaseen Aboasy',
    uiLanguage: 'Bahasa',
    themeAuto: 'Otomatis',
    themeDark: 'Gelap',
    themeLight: 'Terang',
    androidApp: 'Aplikasi Android',
    lastReadPosition: 'Posisi Bacaan Terakhir',
    continueReading: 'Lanjutkan',
    savedBookmarks: 'Penanda Tersimpan',
    noBookmarksHint: 'Belum ada penanda tersimpan.',
    ayahTafseerTitle: 'Tafsir Ayat',
    chooseTafseerBook: 'Pilih Kitab Tafsir',
    sharePageTitle: 'Bagikan Halaman',
    copyLink: 'Salin Tautan',
    copied: 'Tersalin',
    jumpToSurahPlaceholder: 'Pindah ke Surah...',
    searchSurahPlaceholder: 'Cari surah...',
    selectReciterPlaceholder: 'Pilih Qari...',
    searchReciterPlaceholder: 'Cari qari...',
    selectPagePlaceholder: 'Ke halaman (1 - 604)...',
    searchPagePlaceholder: 'Nomor halaman...',
    filterAll: 'Semua',
    filterMeccan: 'Makkiyah',
    filterMedinan: 'Madaniyah',
    surahPrefix: 'Surah',
    juzPrefix: 'Juz',
    pagePrefix: 'Halaman',
    pageShort: 'Hal.',
    ayahPrefix: 'Ayat',
    ayahsUnit: 'Ayat',
    reciterPrefix: 'Qari',
    btnPlay: 'Putar',
    btnListen: 'Dengarkan',
    btnSyncedView: 'Tampilan Sinkron',
    btnShare: 'Bagikan',
    btnTranslation: 'Terjemahan',
    btnTajweed: 'Tajwid',
    btnDiacritics: 'Harakat',
    btnMemorize: 'Hafalan',
    btnRange: 'Rentang',
    fontUthmani: 'Utsmani',
    fontKitab: 'Kitab',
    fontAmiri: 'Amiri',
    fontNastaleeq: 'Nastaliq',
    viewCards: 'Per Ayat',
    viewMushafFlow: 'Bersambung',
    viewTafseer: 'Tafsir',
    bgDynamic: 'Latar: Dinamis',
    bgIslamic: 'Latar: Ka’bah & Islam',
    bgOff: 'Latar: Mati',
    syncOffsetPrefix: 'Sinkronisasi',
    prevSurah: 'Surah Sebelumnya',
    nextSurah: 'Surah Berikutnya',
    holyMushaf: 'Mushaf Al-Qur’an',
    readFromPage: 'Baca dari Halaman',
    showFullSurah: 'Tampilkan surah lengkap',
    prevPage: 'Halaman Sebelumnya',
    nextPage: 'Halaman Berikutnya',
    wbwSyncTag: 'Kata demi Kata',
    ccSyncTag: 'Sinkron Ayat',
    audioOnlyTag: 'Audio Penuh',
    allRecitersFilter: 'Semua Qari',
    wbwFilter: 'Kata demi Kata',
    ccFilter: 'Sinkron Ayat',
    fromAyah: 'Dari Ayat',
    toAyah: 'Sampai Ayat',
    applyRange: 'Terapkan',
    searchInSurahPlaceholder: 'Cari kata dalam surah...',
    revealAllTemp: 'Tampilkan Semua',
    memoOff: 'Mati',
    memoAll: 'Sembunyikan Semua Kata',
    tashkeelAll: 'Harakat Lengkap',
    tashkeelBasic: 'Harakat Dasar',
    tashkeelNoWaqf: 'Tanpa Tanda Waqaf',
    tashkeelRasm: 'Tanpa Harakat',
    schemaPrinted: 'Mushaf Cetak',
    schemaDetailed: 'Rinci',
    compareTafseers: 'Bandingkan Tafsir',
    mistakeNote: 'Catatan',
    listenCorrect: 'Dengarkan Bacaan Benar',
    listenToSurahByReciter: 'Dengarkan Surah {surah} oleh {reciter}',
    listenBtn: 'Dengarkan',
    readingSettingsTitle: 'Pengaturan Bacaan',
    breadcrumbHome: 'Beranda',
    breadcrumbQuran: 'Al-Qur’an Al-Karim',
    mainNavHeading: 'Navigasi Utama',
    toolsAndSettings: 'Alat & Pengaturan',
    commonMistake: 'Kesalahan Umum',
    correctReading: 'Benar',
  },
  ur: {
    appTitle: 'کلام اللہ',
    ramadanEdition: 'رمضان کریم',
    navHome: 'ہوم',
    navSurahs: 'سورتیں',
    navJuzs: 'پارے',
    navMushaf: 'مصحف',
    navReciters: 'قراء',
    navTafseer: 'تفسیر',
    navTajweed: 'تجوید',
    navDuas: 'دعائیں اور اذکار',
    navNames: 'اسماء الحسنیٰ',
    navAi: 'ذہین معاون',
    navTranslations: 'تراجم',
    jumpToAyah: 'آیت پر جائیں',
    btnDownload: 'ڈاؤن لوڈ',
    aboutDeveloper: 'ڈویلپر: یاسین ابوعاصی',
    uiLanguage: 'زبان',
    themeAuto: 'خودکار',
    themeDark: 'تاریک',
    themeLight: 'روشن',
    androidApp: 'اینڈرائیڈ ایپ',
    lastReadPosition: 'آخری محفوظ مقام',
    continueReading: 'جاری رکھیں',
    savedBookmarks: 'محفوظ بک مارکس',
    noBookmarksHint: 'ابھی تک کوئی بک مارک محفوظ نہیں ہے۔',
    ayahTafseerTitle: 'آیت کی تفسیر',
    chooseTafseerBook: 'تفسیر کی کتاب منتخب کریں',
    sharePageTitle: 'صفحہ شیئر کریں',
    copyLink: 'لنک کاپی کریں',
    copied: 'کاپی ہو گیا',
    jumpToSurahPlaceholder: 'سورہ پر جائیں...',
    searchSurahPlaceholder: 'سورہ تلاش کریں...',
    selectReciterPlaceholder: 'قاری منتخب کریں...',
    searchReciterPlaceholder: 'قاری تلاش کریں...',
    selectPagePlaceholder: 'صفحہ منتخب کریں (1 - 604)...',
    searchPagePlaceholder: 'صفحہ نمبر لکھیں...',
    filterAll: 'سب',
    filterMeccan: 'مکی',
    filterMedinan: 'مدنی',
    surahPrefix: 'سورۃ',
    juzPrefix: 'پارہ',
    pagePrefix: 'صفحہ',
    pageShort: 'ص',
    ayahPrefix: 'آیت',
    ayahsUnit: 'آیات',
    reciterPrefix: 'قاری',
    btnPlay: 'چلائیں',
    btnListen: 'سنیں',
    btnSyncedView: 'ہم آہنگ منظر',
    btnShare: 'شیئر',
    btnTranslation: 'ترجمہ',
    btnTajweed: 'تجوید',
    btnDiacritics: 'اعراب',
    btnMemorize: 'حفظ',
    btnRange: 'حدود',
    fontUthmani: 'عثمانی',
    fontKitab: 'کتاب',
    fontAmiri: 'امیری',
    fontNastaleeq: 'نستعلیق',
    viewCards: 'آیات',
    viewMushafFlow: 'متصل',
    viewTafseer: 'تفسیر',
    bgDynamic: 'پس منظر: متحرک',
    bgIslamic: 'پس منظر: کعبہ اور حرمین',
    bgOff: 'پس منظر: بند',
    syncOffsetPrefix: 'ہم آہنگی',
    prevSurah: 'پچھلی سورہ',
    nextSurah: 'اگلی سورہ',
    holyMushaf: 'مصحف شریف',
    readFromPage: 'صفحہ سے پڑھیں',
    showFullSurah: 'مکمل سورہ دیکھیں',
    prevPage: 'پچھلا صفحہ',
    nextPage: 'اگلا صفحہ',
    wbwSyncTag: 'لفظ بہ لفظ',
    ccSyncTag: 'آیت ہم آہنگی',
    audioOnlyTag: 'مکمل تلاوت',
    allRecitersFilter: 'تمام قراء',
    wbwFilter: 'لفظ بہ لفظ',
    ccFilter: 'آیت ہم آہنگی',
    fromAyah: 'آیت سے',
    toAyah: 'آیت تک',
    applyRange: 'لاگو کریں',
    searchInSurahPlaceholder: 'سورہ میں لفظ تلاش کریں...',
    revealAllTemp: 'سب ظاہر کریں',
    memoOff: 'بند',
    memoAll: 'تمام الفاظ چھپائیں',
    tashkeelAll: 'مکمل اعراب',
    tashkeelBasic: 'بنیادی حرکات',
    tashkeelNoWaqf: 'رموز اوقاف چھپائیں',
    tashkeelRasm: 'بغیر اعراب',
    schemaPrinted: 'مطبوعہ مصحف',
    schemaDetailed: 'تفصیلی',
    compareTafseers: 'تفاسیر کا موازنہ',
    mistakeNote: 'تنبیہ',
    listenCorrect: 'درست تلاوت سنیں',
    listenToSurahByReciter: '{reciter} کی آواز میں سورۃ {surah} سنیں',
    listenBtn: 'سنیں',
    readingSettingsTitle: 'تلاوت کی ترتیبات',
    breadcrumbHome: 'ہوم',
    breadcrumbQuran: 'قرآن مجید',
    mainNavHeading: 'مرکزی مینو',
    toolsAndSettings: 'ٹولز اور سیٹنگز',
    commonMistake: 'عام غلطی',
    correctReading: 'درست',
  },
};

export function t(key: string, locale = getActiveLocale()): string {
  const dict = UI_TRANSLATIONS[locale] ?? UI_TRANSLATIONS.ar;
  return dict[key] ?? UI_TRANSLATIONS.ar[key] ?? key;
}

export function applyUiLocale(locale: UiLocale, catalog?: any): void {
  const dict = UI_TRANSLATIONS[locale] ?? UI_TRANSLATIONS.ar;
  const isRtl = isRtlLocale(locale);
  const d = (n: number | string) => formatLocaleDigits(n, locale);

  document.documentElement.setAttribute('lang', locale);
  document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  try {
    localStorage.setItem('kalamalah_ui_locale_v2', locale);
  } catch {}

  // 1. Explicit [data-i18n] elements and [data-i18n-title] tooltips
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n') || '';
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title') || '';
    if (dict[key]) {
      el.setAttribute('title', dict[key]);
      el.setAttribute('aria-label', dict[key]);
    }
  });

  const surahsList: {
    n: number;
    ar: string;
    en: string;
    ay: number;
    rev: string;
    p: number;
    j: number;
  }[] = catalog?.surahs ?? [];
  const surahByNum = new Map(surahsList.map((s) => [s.n, s]));

  const recitersList: {
    id: number;
    slug: string;
    ar: string;
    en: string;
    riwayah: string;
    wbw: boolean;
    cc: boolean;
  }[] = catalog?.reciters ?? [];
  const reciterBySlug = new Map(recitersList.map((r) => [r.slug, r]));

  const getSurahDisplayName = (s: { ar: string; en: string }) =>
    isRtl ? `${dict.surahPrefix} ${s.ar}` : `${dict.surahPrefix} ${s.en} (${s.ar})`;

  const getRevDisplay = (revAr: string) =>
    revAr === 'مكية' ? dict.filterMeccan : dict.filterMedinan;

  // 2. Home Page: Tabs, Filters, 114 Surah Cards, 30 Juz Cards, Mushaf Quick Grid
  const tabSurah = document.querySelector('[data-switch-tab="view-surah"]');
  if (tabSurah) {
    const spans = tabSurah.querySelectorAll('span');
    if (spans[0]) spans[0].textContent = dict.navSurahs!;
    if (spans[1]) spans[1].textContent = d(114);
  }
  const tabJuz = document.querySelector('[data-switch-tab="view-juz"]');
  if (tabJuz) {
    const spans = tabJuz.querySelectorAll('span');
    if (spans[0]) spans[0].textContent = dict.navJuzs!;
    if (spans[1]) spans[1].textContent = d(30);
  }
  const tabPage = document.querySelector('[data-switch-tab="view-page"]');
  if (tabPage) {
    const spans = tabPage.querySelectorAll('span');
    if (spans[0]) spans[0].textContent = dict.navMushaf!;
    if (spans[1]) spans[1].textContent = d(604);
  }

  const homeSearch = document.getElementById('home-surah-search') as HTMLInputElement | null;
  if (homeSearch) homeSearch.placeholder = dict.searchSurahPlaceholder!;

  document.querySelector('[data-filter-rev="all"]')?.replaceChildren(document.createTextNode(dict.filterAll!));
  document.querySelector('[data-filter-rev="meccan"]')?.replaceChildren(document.createTextNode(dict.filterMeccan!));
  document.querySelector('[data-filter-rev="medinan"]')?.replaceChildren(document.createTextNode(dict.filterMedinan!));

  document.querySelectorAll<HTMLElement>('#home-surahs-grid .surah-card').forEach((card) => {
    const num = Number(card.getAttribute('data-surah-number') || 0);
    const s = surahByNum.get(num);
    if (!s) return;
    const badge = card.querySelector('.surah-num-badge');
    if (badge) badge.textContent = d(s.n);
    const title = card.querySelector('.surah-name-ar');
    if (title) title.textContent = getSurahDisplayName(s);
    const metaSpans = card.querySelectorAll('.surah-card-meta span');
    if (metaSpans[0]) metaSpans[0].textContent = getRevDisplay(s.rev)!;
    if (metaSpans[2]) metaSpans[2].textContent = `${d(s.ay)} ${dict.ayahsUnit}`;
  });

  document.querySelectorAll<HTMLElement>('.juzs-grid .juz-card').forEach((card) => {
    const href = card.getAttribute('href') || '';
    const m = /juz-(\d+)/.exec(href);
    if (!m) return;
    const jNum = Number(m[1]);
    const badge = card.querySelector('.juz-badge');
    if (badge) badge.textContent = d(jNum);
    const pageTag = card.querySelector('.juz-page-tag');
    if (pageTag) {
      const pNum = (pageTag.textContent || '').replace(/[^\d٠-٩]/g, '');
      pageTag.textContent = `${dict.pageShort} ${d(pNum)}`;
    }
    const titleAr = card.getAttribute('data-juz-title-ar') || '';
    const nameEl = card.querySelector('.juz-name-ar');
    if (nameEl) {
      nameEl.textContent = titleAr ? `${dict.juzPrefix} ${d(jNum)} (${titleAr})` : `${dict.juzPrefix} ${d(jNum)}`;
    }
    const startSurahNum = Number(card.getAttribute('data-start-surah') || 0);
    const startS = surahByNum.get(startSurahNum);
    const startEl = card.querySelector('.juz-start-info');
    if (startEl && startS) {
      startEl.textContent = isRtl ? `${dict.surahPrefix} ${startS.ar}` : `${dict.surahPrefix} ${startS.en}`;
    }
  });

  // 2.5. Juz Detail Page (/juz-N)
  const juzHeroCard = document.getElementById('juz-hero-card');
  if (juzHeroCard) {
    const jNum = Number(juzHeroCard.getAttribute('data-juz') || 1);
    const sCount = Number(juzHeroCard.getAttribute('data-surah-count') || 1);
    const h1 = document.getElementById('juz-hero-title');
    if (h1) h1.textContent = `${dict.juzPrefix} ${d(jNum)} — ${dict.breadcrumbQuran}`;
    const desc = document.getElementById('juz-hero-desc');
    if (desc) {
      desc.textContent = isRtl
        ? `${dict.juzPrefix} ${d(jNum)} · ${d(sCount)} ${dict.navSurahs}`
        : `${dict.juzPrefix} ${d(jNum)} · ${d(sCount)} ${dict.navSurahs}`;
    }
    const prevBtn = document.querySelector<HTMLElement>('[data-juz-prev]');
    if (prevBtn) {
      const pJ = prevBtn.getAttribute('data-juz-prev') || '';
      prevBtn.textContent = `${isRtl ? '→' : '←'} ${dict.juzPrefix} ${d(pJ)}`;
    }
    const nextBtn = document.querySelector<HTMLElement>('[data-juz-next]');
    if (nextBtn) {
      const nJ = nextBtn.getAttribute('data-juz-next') || '';
      nextBtn.textContent = `${dict.juzPrefix} ${d(nJ)} ${isRtl ? '←' : '→'}`;
    }
  }
  document.querySelectorAll<HTMLElement>('.juz-surah-section').forEach((sec) => {
    const link = sec.querySelector<HTMLElement>('.juz-surah-title-link');
    if (link) {
      const sNum = Number(link.getAttribute('data-surah-number') || 0);
      const s = surahByNum.get(sNum) || {
        ar: link.getAttribute('data-surah-name-ar') || '',
        en: link.getAttribute('data-surah-name-en') || '',
      };
      if (s.ar || s.en) link.textContent = getSurahDisplayName(s);
    }
    const sub = sec.querySelector<HTMLElement>('.juz-surah-sub');
    if (sub) {
      const revAr = sub.getAttribute('data-rev') || 'مكية';
      const ayCnt = sub.getAttribute('data-ayah-count') || '0';
      sub.textContent = `${getRevDisplay(revAr)} · ${d(ayCnt)} ${dict.ayahsUnit}`;
    }
  });

  document.querySelectorAll<HTMLElement>('.mushaf-quick-pages-grid .mushaf-page-pill').forEach((pill) => {
    const href = pill.getAttribute('href') || '';
    const m = /mushaf-(\d+)/.exec(href);
    if (!m) return;
    const pNum = Number(m[1]);
    const jNum = Math.min(30, Math.ceil(pNum / 20));
    const mpNum = pill.querySelector('.mp-num');
    const mpJuz = pill.querySelector('.mp-juz');
    if (mpNum) mpNum.textContent = `${dict.pagePrefix} ${d(pNum)}`;
    if (mpJuz) mpJuz.textContent = `${dict.juzPrefix} ${d(jNum)}`;
  });

  const mushafHeaderH2 = document.querySelector('.mushaf-jumper-header h2');
  if (mushafHeaderH2) mushafHeaderH2.textContent = `${dict.holyMushaf} (${d(604)} ${dict.pagePrefix})`;
  const mushafLbl = document.getElementById('mushaf-page-dd-lbl');
  if (mushafLbl) mushafLbl.textContent = dict.selectPagePlaceholder!;

  // 3. Surah Reader Page: Hero, Toolbar, Subpanels, Ayah Cards, Pagination
  const wrapper = document.getElementById('surah-ayahs-wrapper');
  const pageSurahNum = Number(wrapper?.getAttribute('data-surah-number') || catalog?.pageData?.surahNumber || 0);
  const pageSurahMeta = surahByNum.get(pageSurahNum);

  if (pageSurahMeta) {
    const heroTitle = document.querySelector('.surah-display-title');
    if (heroTitle) heroTitle.textContent = getSurahDisplayName(pageSurahMeta);
    const heroSub = document.querySelector('.surah-display-en');
    if (heroSub) {
      heroSub.innerHTML = `${getRevDisplay(pageSurahMeta.rev)} · ${d(pageSurahMeta.ay)} ${dict.ayahsUnit} · <a href="/juz-${pageSurahMeta.j}">${dict.juzPrefix} ${d(pageSurahMeta.j)}</a> · <a href="/mushaf-${pageSurahMeta.p}">${dict.pagePrefix} ${d(pageSurahMeta.p)}</a>`;
    }
  }

  const heroPlaySpan = document.querySelector('#surah-hero-play-btn span');
  if (heroPlaySpan) heroPlaySpan.textContent = dict.btnPlay!;
  const openAmlSpan = document.querySelector('#surah-open-aml-btn span');
  if (openAmlSpan) openAmlSpan.textContent = dict.btnSyncedView!;

  document.querySelector('[data-set-reading-font="uthmani"]')?.replaceChildren(document.createTextNode(dict.fontUthmani!));
  document.querySelector('[data-set-reading-font="kitab"]')?.replaceChildren(document.createTextNode(dict.fontKitab!));
  document.querySelector('[data-set-reading-font="amiri"]')?.replaceChildren(document.createTextNode(dict.fontAmiri!));
  document.querySelector('[data-set-reading-font="nastaleeq"]')?.replaceChildren(document.createTextNode(dict.fontNastaleeq!));

  document.querySelector('[data-reader-view="cards"]')?.replaceChildren(document.createTextNode(dict.viewCards!));
  document.querySelector('[data-reader-view="mushaf-flow"]')?.replaceChildren(document.createTextNode(dict.viewMushafFlow!));
  document.querySelector('[data-reader-view="tafseer-open"]')?.replaceChildren(document.createTextNode(dict.viewTafseer!));

  const tjToggleSpan = document.querySelector('#tajweed-color-toggle span:last-child');
  if (tjToggleSpan) tjToggleSpan.textContent = dict.btnTajweed!;
  const diaToggleSpan = document.querySelector('#diacritics-panel-toggle span');
  if (diaToggleSpan) diaToggleSpan.textContent = dict.btnDiacritics!;
  const memoToggleSpan = document.querySelector('#memorization-panel-toggle span');
  if (memoToggleSpan) memoToggleSpan.textContent = dict.btnMemorize!;
  const rangeToggleSpan = document.querySelector('#range-filter-toggle span');
  if (rangeToggleSpan) rangeToggleSpan.textContent = dict.btnRange!;

  document.querySelector('[data-tajweed-schema="printed"]')?.replaceChildren(document.createTextNode(dict.schemaPrinted!));
  document.querySelector('[data-tajweed-schema="alquran"]')?.replaceChildren(document.createTextNode(dict.schemaDetailed!));

  document.querySelector('[data-tashkeel-preset="all"]')?.replaceChildren(document.createTextNode(dict.tashkeelAll!));
  document.querySelector('[data-tashkeel-preset="basic-only"]')?.replaceChildren(document.createTextNode(dict.tashkeelBasic!));
  document.querySelector('[data-tashkeel-preset="no-waqf"]')?.replaceChildren(document.createTextNode(dict.tashkeelNoWaqf!));
  document.querySelector('[data-tashkeel-preset="rasm-only"]')?.replaceChildren(document.createTextNode(dict.tashkeelRasm!));

  document.querySelector('[data-memo-density="0"]')?.replaceChildren(document.createTextNode(dict.memoOff!));
  document.querySelector('[data-memo-density="0.25"]')?.replaceChildren(document.createTextNode(`${d(25)}%`));
  document.querySelector('[data-memo-density="0.5"]')?.replaceChildren(document.createTextNode(`${d(50)}%`));
  document.querySelector('[data-memo-density="0.75"]')?.replaceChildren(document.createTextNode(`${d(75)}%`));
  document.querySelector('[data-memo-density="1"]')?.replaceChildren(document.createTextNode(dict.memoAll!));

  const revealAllBtn = document.getElementById('memo-reveal-all-btn');
  if (revealAllBtn) revealAllBtn.textContent = dict.revealAllTemp!;

  const applyRangeBtn = document.getElementById('apply-range-btn');
  if (applyRangeBtn) applyRangeBtn.textContent = dict.applyRange!;

  const inSurahSearch = document.getElementById('in-surah-search-input') as HTMLInputElement | null;
  if (inSurahSearch) inSurahSearch.placeholder = dict.searchInSurahPlaceholder!;

  document.querySelectorAll<HTMLElement>('.ayah-block').forEach((block) => {
    const pNum = block.getAttribute('data-page') || '';
    const chip = block.querySelector('.ayah-meta-chip');
    if (chip && pNum) chip.textContent = `${dict.pageShort} ${d(pNum)}`;
    const alert = block.querySelector('.ayah-mistake-alert');
    if (alert) alert.textContent = dict.mistakeNote!;
    const tafBtnSpan = block.querySelector('.tafseer-ayah-btn span');
    if (tafBtnSpan) tafBtnSpan.textContent = dict.navTafseer!;
    const moreTafLink = block.querySelector('.more-tafseer-link');
    if (moreTafLink) moreTafLink.textContent = dict.compareTafseers!;
  });

  document.querySelectorAll<HTMLElement>('.mistake-listen-correct-btn span').forEach((el) => {
    el.textContent = dict.listenCorrect!;
  });
  document.querySelectorAll<HTMLElement>('.mistake-wrong .mc-label span').forEach((el) => {
    el.textContent = dict.commonMistake!;
  });
  document.querySelectorAll<HTMLElement>('.mistake-right .mc-label span').forEach((el) => {
    el.textContent = dict.correctReading!;
  });

  // 3.5. Surah Hero Screenshot Elements Localization
  const bcHome = document.querySelector('.breadcrumb-trail .bc-item:first-child span');
  if (bcHome) bcHome.textContent = dict.breadcrumbHome!;
  const bcQuran = document.querySelector('.breadcrumb-trail a[href="/#view-surah"]');
  if (bcQuran) bcQuran.textContent = dict.breadcrumbQuran!;

  const bcCurrent = document.querySelector('.breadcrumb-trail .bc-item.current');
  if (bcCurrent && pageSurahMeta) {
    bcCurrent.textContent = getSurahDisplayName(pageSurahMeta);
  }

  const rtcLabel = document.querySelector('.rtc-main-label');
  if (rtcLabel) rtcLabel.textContent = dict.readingSettingsTitle!;

  const heroListenBtn = document.querySelector('.surah-listen-pill-btn span');
  if (heroListenBtn) heroListenBtn.textContent = dict.listenBtn!;

  const heroReciterDisplay = document.getElementById('hero-reciter-name-display');
  const activeRecSlug = localStorage.getItem('kalamalah_reciter_slug') || 'haitham-al-dukhin';
  const activeR = reciterBySlug.get(activeRecSlug);
  if (heroReciterDisplay && activeR) {
    heroReciterDisplay.textContent = isRtl ? activeR.ar : activeR.en;
  }

  const heroBoxTitle = document.querySelector('.surah-listen-hero-title');
  if (heroBoxTitle && pageSurahMeta && activeR) {
    const recName = isRtl ? activeR.ar : activeR.en;
    const sName = isRtl ? pageSurahMeta.ar : pageSurahMeta.en;
    heroBoxTitle.innerHTML = dict.listenToSurahByReciter!
      .replace('{surah}', `<strong>${escapeHtml(sName)}</strong>`)
      .replace('{reciter}', `<span id="hero-reciter-name-display">${escapeHtml(recName)}</span>`);
  }

  // Mobile Drawer section titles
  const mobileNavTitle = document.querySelector('.mobile-sidebar-section:first-child .mobile-section-title');
  if (mobileNavTitle) mobileNavTitle.textContent = dict.mainNavHeading!;
  const mobileToolsTitle = document.querySelector('.mobile-sidebar-section:last-child .mobile-section-title');
  if (mobileToolsTitle) mobileToolsTitle.textContent = dict.toolsAndSettings!;

  const prevPagDir = document.querySelector('.pagination-card.prev .pag-dir');
  if (prevPagDir) prevPagDir.textContent = dict.prevSurah!;
  const centerPagDir = document.querySelector('.pagination-card.center .pag-dir');
  if (centerPagDir) centerPagDir.textContent = dict.holyMushaf!;
  const nextPagDir = document.querySelector('.pagination-card.next .pag-dir');
  if (nextPagDir) nextPagDir.textContent = dict.nextSurah!;

  // Hero badges: revelation type + ayah count
  const heroRevText = document.getElementById('hero-rev-text');
  if (heroRevText && pageSurahMeta) heroRevText.textContent = getRevDisplay(pageSurahMeta.rev)!;
  const heroAyahText = document.getElementById('hero-ayah-count-text');
  if (heroAyahText && pageSurahMeta) heroAyahText.textContent = `${d(pageSurahMeta.ay)} ${dict.ayahsUnit}`;

  // Pagination strong lines (prev / center / next)
  const prevPagCard = document.querySelector<HTMLAnchorElement>('.pagination-card.prev');
  const prevPagStrong = prevPagCard?.querySelector('strong');
  if (prevPagStrong && prevPagCard) {
    const m = /surah-(\d+)/.exec(prevPagCard.getAttribute('href') || '');
    const ps = m ? surahByNum.get(Number(m[1])) : null;
    if (ps) prevPagStrong.textContent = getSurahDisplayName(ps);
  }
  const centerPagCard = document.querySelector<HTMLAnchorElement>('.pagination-card.center');
  const centerPagStrong = centerPagCard?.querySelector('strong');
  if (centerPagStrong && centerPagCard) {
    const m = /mushaf-(\d+)/.exec(centerPagCard.getAttribute('href') || '');
    if (m) centerPagStrong.textContent = `${dict.readFromPage} ${d(Number(m[1]))}`;
  }
  const nextPagCard = document.querySelector<HTMLAnchorElement>('.pagination-card.next');
  const nextPagStrong = nextPagCard?.querySelector('strong');
  if (nextPagStrong && nextPagCard) {
    const m = /surah-(\d+)/.exec(nextPagCard.getAttribute('href') || '');
    const ns = m ? surahByNum.get(Number(m[1])) : null;
    if (ns) nextPagStrong.textContent = getSurahDisplayName(ns);
  }

  // Active range filter banner
  const rangeBanner = document.querySelector('.range-active-banner');
  const rangeLabel = document.getElementById('range-banner-label');
  if (rangeBanner && rangeLabel) {
    const rFrom = rangeBanner.getAttribute('data-from') || '';
    const rTo = rangeBanner.getAttribute('data-to') || '';
    rangeLabel.textContent = `${dict.ayahPrefix} ${d(rFrom)} - ${d(rTo)}`;
  }

  // 4. Reciters Directory & Profile Pages
  const recitersHeroTitle = document.getElementById('reciters-hero-title');
  if (recitersHeroTitle) {
    const cnt = recitersHeroTitle.getAttribute('data-reciters-count') || String(recitersList.length || 28);
    recitersHeroTitle.textContent = `${dict.navReciters} (${d(cnt)})`;
  }
  const rpHeading = document.getElementById('rp-reciter-heading');
  const rpSub = document.getElementById('rp-reciter-sub');
  if (rpHeading) {
    const ar = rpHeading.getAttribute('data-name-ar') || '';
    const en = rpHeading.getAttribute('data-name-en') || '';
    rpHeading.textContent = isRtl ? `${dict.reciterPrefix} ${ar}` : en;
    if (rpSub) rpSub.textContent = isRtl ? en : ar;
  }
  const rpBio = document.getElementById('rp-reciter-bio');
  if (rpBio) {
    const bioEn = rpBio.getAttribute('data-bio-en') || '';
    const bioAr = rpBio.getAttribute('data-bio-ar') || '';
    rpBio.textContent = isRtl ? (bioAr || bioEn) : (bioEn || bioAr);
  }
  const rpSurahsHeading = document.getElementById('rp-surahs-heading');
  if (rpSurahsHeading) {
    const ar = rpSurahsHeading.getAttribute('data-name-ar') || '';
    const en = rpSurahsHeading.getAttribute('data-name-en') || '';
    rpSurahsHeading.textContent = `${dict.navSurahs} (${isRtl ? ar : en}) — ${d(114)}`;
  }

  const recitersSearch = document.getElementById('reciters-search-input') as HTMLInputElement | null;
  if (recitersSearch) recitersSearch.placeholder = dict.searchReciterPlaceholder!;

  const filterRecAll = document.querySelector('[data-filter-reciter="all"]');
  if (filterRecAll) {
    filterRecAll.textContent = `${dict.allRecitersFilter} (${d(recitersList.length || 28)})`;
  }
  const filterRecWbw = document.querySelector('[data-filter-reciter="wbw"]');
  if (filterRecWbw) filterRecWbw.textContent = dict.wbwFilter!;
  const filterRecCc = document.querySelector('[data-filter-reciter="cc"]');
  if (filterRecCc) filterRecCc.textContent = dict.ccFilter!;

  document.querySelectorAll<HTMLElement>('#reciters-directory-grid .reciter-dir-card').forEach((card) => {
    const slug = card.getAttribute('data-reciter-slug') || card.querySelector<HTMLElement>('[data-play-reciter]')?.getAttribute('data-play-reciter') || '';
    const r = reciterBySlug.get(slug);
    if (r) {
      const titleEl = card.querySelector('.reciter-dir-title, .reciter-dir-body h2 a, .reciter-dir-body h2');
      if (titleEl) titleEl.textContent = isRtl ? r.ar : r.en;
      const sub = card.querySelector('.reciter-en-name');
      if (sub) sub.textContent = isRtl ? `${r.en} · ${r.riwayah}` : `${r.ar} · ${r.riwayah}`;
    }
  });

  const recSurahInput = document.getElementById('reciter-surah-filter-input') as HTMLInputElement | null;
  if (recSurahInput) recSurahInput.placeholder = dict.searchSurahPlaceholder!;

  document.querySelectorAll<HTMLElement>('#reciter-surahs-list .reciter-surah-row').forEach((row) => {
    const sNum = Number(row.getAttribute('data-surah-number') || 0);
    const s = surahByNum.get(sNum);
    if (!s) return;
    const numEl = row.querySelector('.rs-num');
    if (numEl) numEl.textContent = d(s.n);
    const titleLink = row.querySelector('.rs-left h3 a');
    if (titleLink) titleLink.textContent = getSurahDisplayName(s);
    const metaEl = row.querySelector('.rs-meta');
    if (metaEl) metaEl.textContent = `${s.en} / ${getRevDisplay(s.rev)} / ${d(s.ay)} ${dict.ayahsUnit}`;
    const playSpan = row.querySelector('.rs-play-btn span');
    if (playSpan) playSpan.textContent = dict.btnPlay!;
  });

  window.dispatchEvent(new CustomEvent('kalamalah:locale-changed', { detail: { locale } }));
}
