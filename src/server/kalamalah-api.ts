export interface SurahMeta {
  number: number;
  nameAr: string;
  nameEn: string;
  meaningEn: string;
  revelationType: 'Meccan' | 'Medinan';
  revelationAr: 'مكية' | 'مدنية';
  ayahCount: number;
  startPage: number;
  juz: number;
}

export interface AyahItem {
  number: number; // global ayah number (1..6236)
  numberInSurah: number;
  text: string;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean;
  surahNumber?: number;
  surahNameAr?: string;
  surahNameEn?: string;
  translationText?: string;
  tafseerText?: string;
}

export interface SurahDetail {
  meta: SurahMeta;
  ayahs: AyahItem[];
}

export interface TafseerBook {
  id: number;
  slug: string;
  editionId: string;
  nameAr: string;
  nameEn: string;
  authorAr: string;
  descriptionAr: string;
}

export interface TranslationEdition {
  code: string;
  editionId: string;
  languageNameAr: string;
  languageNameEn: string;
  translatorName: string;
  dir: 'rtl' | 'ltr';
}

export const SURAHS_META: SurahMeta[] = [
  { number: 1, nameAr: 'الفاتحة', nameEn: 'Al-Fatihah', meaningEn: 'The Opening', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 7, startPage: 1, juz: 1 },
  { number: 2, nameAr: 'البقرة', nameEn: 'Al-Baqarah', meaningEn: 'The Cow', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 286, startPage: 2, juz: 1 },
  { number: 3, nameAr: 'آل عمران', nameEn: 'Ali \'Imran', meaningEn: 'Family of Imran', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 200, startPage: 50, juz: 3 },
  { number: 4, nameAr: 'النساء', nameEn: 'An-Nisa', meaningEn: 'The Women', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 176, startPage: 77, juz: 4 },
  { number: 5, nameAr: 'المائدة', nameEn: 'Al-Ma\'idah', meaningEn: 'The Table Spread', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 120, startPage: 106, juz: 6 },
  { number: 6, nameAr: 'الأنعام', nameEn: 'Al-An\'am', meaningEn: 'The Cattle', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 165, startPage: 128, juz: 7 },
  { number: 7, nameAr: 'الأعراف', nameEn: 'Al-A\'raf', meaningEn: 'The Heights', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 206, startPage: 151, juz: 8 },
  { number: 8, nameAr: 'الأنفال', nameEn: 'Al-Anfal', meaningEn: 'The Spoils of War', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 75, startPage: 177, juz: 9 },
  { number: 9, nameAr: 'التوبة', nameEn: 'At-Tawbah', meaningEn: 'The Repentance', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 129, startPage: 187, juz: 10 },
  { number: 10, nameAr: 'يونس', nameEn: 'Yunus', meaningEn: 'Jonah', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 109, startPage: 208, juz: 11 },
  { number: 11, nameAr: 'هود', nameEn: 'Hud', meaningEn: 'Hud', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 123, startPage: 221, juz: 11 },
  { number: 12, nameAr: 'يوسف', nameEn: 'Yusuf', meaningEn: 'Joseph', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 111, startPage: 235, juz: 12 },
  { number: 13, nameAr: 'الرعد', nameEn: 'Ar-Ra\'d', meaningEn: 'The Thunder', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 43, startPage: 249, juz: 13 },
  { number: 14, nameAr: 'إبراهيم', nameEn: 'Ibrahim', meaningEn: 'Abraham', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 52, startPage: 255, juz: 13 },
  { number: 15, nameAr: 'الحجر', nameEn: 'Al-Hijr', meaningEn: 'The Rocky Tract', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 99, startPage: 262, juz: 14 },
  { number: 16, nameAr: 'النحل', nameEn: 'An-Nahl', meaningEn: 'The Bee', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 128, startPage: 267, juz: 14 },
  { number: 17, nameAr: 'الإسراء', nameEn: 'Al-Isra', meaningEn: 'The Night Journey', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 111, startPage: 282, juz: 15 },
  { number: 18, nameAr: 'الكهف', nameEn: 'Al-Kahf', meaningEn: 'The Cave', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 110, startPage: 293, juz: 15 },
  { number: 19, nameAr: 'مريم', nameEn: 'Maryam', meaningEn: 'Mary', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 98, startPage: 305, juz: 16 },
  { number: 20, nameAr: 'طه', nameEn: 'Taha', meaningEn: 'Ta-Ha', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 135, startPage: 312, juz: 16 },
  { number: 21, nameAr: 'الأنبياء', nameEn: 'Al-Anbiya', meaningEn: 'The Prophets', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 112, startPage: 322, juz: 17 },
  { number: 22, nameAr: 'الحج', nameEn: 'Al-Hajj', meaningEn: 'The Pilgrimage', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 78, startPage: 332, juz: 17 },
  { number: 23, nameAr: 'المؤمنون', nameEn: 'Al-Mu\'minun', meaningEn: 'The Believers', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 118, startPage: 342, juz: 18 },
  { number: 24, nameAr: 'النور', nameEn: 'An-Nur', meaningEn: 'The Light', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 64, startPage: 350, juz: 18 },
  { number: 25, nameAr: 'الفرقان', nameEn: 'Al-Furqan', meaningEn: 'The Criterion', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 77, startPage: 359, juz: 18 },
  { number: 26, nameAr: 'الشعراء', nameEn: 'Ash-Shu\'ara', meaningEn: 'The Poets', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 227, startPage: 367, juz: 19 },
  { number: 27, nameAr: 'النمل', nameEn: 'An-Naml', meaningEn: 'The Ant', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 93, startPage: 377, juz: 19 },
  { number: 28, nameAr: 'القصص', nameEn: 'Al-Qasas', meaningEn: 'The Stories', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 88, startPage: 385, juz: 20 },
  { number: 29, nameAr: 'العنكبوت', nameEn: 'Al-\'Ankabut', meaningEn: 'The Spider', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 69, startPage: 396, juz: 20 },
  { number: 30, nameAr: 'الروم', nameEn: 'Ar-Rum', meaningEn: 'The Romans', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 60, startPage: 404, juz: 21 },
  { number: 31, nameAr: 'لقمان', nameEn: 'Luqman', meaningEn: 'Luqman', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 34, startPage: 411, juz: 21 },
  { number: 32, nameAr: 'السجدة', nameEn: 'As-Sajdah', meaningEn: 'The Prostration', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 30, startPage: 415, juz: 21 },
  { number: 33, nameAr: 'الأحزاب', nameEn: 'Al-Ahzab', meaningEn: 'The Combined Forces', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 73, startPage: 418, juz: 21 },
  { number: 34, nameAr: 'سبأ', nameEn: 'Saba', meaningEn: 'Sheba', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 54, startPage: 428, juz: 22 },
  { number: 35, nameAr: 'فاطر', nameEn: 'Fatir', meaningEn: 'Originator', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 45, startPage: 434, juz: 22 },
  { number: 36, nameAr: 'يس', nameEn: 'Ya-Sin', meaningEn: 'Ya Sin', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 83, startPage: 440, juz: 22 },
  { number: 37, nameAr: 'الصافات', nameEn: 'As-Saffat', meaningEn: 'Those who set the Ranks', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 182, startPage: 446, juz: 23 },
  { number: 38, nameAr: 'ص', nameEn: 'Sad', meaningEn: 'The Letter Sad', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 88, startPage: 453, juz: 23 },
  { number: 39, nameAr: 'الزمر', nameEn: 'Az-Zumar', meaningEn: 'The Troops', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 75, startPage: 458, juz: 23 },
  { number: 40, nameAr: 'غافر', nameEn: 'Ghafir', meaningEn: 'The Forgiver', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 85, startPage: 467, juz: 24 },
  { number: 41, nameAr: 'فصلت', nameEn: 'Fussilat', meaningEn: 'Explained in Detail', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 54, startPage: 477, juz: 24 },
  { number: 42, nameAr: 'الشورى', nameEn: 'Ash-Shuraa', meaningEn: 'The Consultation', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 53, startPage: 483, juz: 25 },
  { number: 43, nameAr: 'الزخرف', nameEn: 'Az-Zukhruf', meaningEn: 'The Ornaments of Gold', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 89, startPage: 489, juz: 25 },
  { number: 44, nameAr: 'الدخان', nameEn: 'Ad-Dukhan', meaningEn: 'The Smoke', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 59, startPage: 496, juz: 25 },
  { number: 45, nameAr: 'الجاثية', nameEn: 'Al-Jathiyah', meaningEn: 'The Crouching', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 37, startPage: 499, juz: 25 },
  { number: 46, nameAr: 'الأحقاف', nameEn: 'Al-Ahqaf', meaningEn: 'The Wind-Curved Sandhills', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 35, startPage: 502, juz: 26 },
  { number: 47, nameAr: 'محمد', nameEn: 'Muhammad', meaningEn: 'Muhammad', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 38, startPage: 507, juz: 26 },
  { number: 48, nameAr: 'الفتح', nameEn: 'Al-Fath', meaningEn: 'The Victory', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 29, startPage: 511, juz: 26 },
  { number: 49, nameAr: 'الحجرات', nameEn: 'Al-Hujurat', meaningEn: 'The Rooms', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 18, startPage: 515, juz: 26 },
  { number: 50, nameAr: 'ق', nameEn: 'Qaf', meaningEn: 'The Letter Qaf', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 45, startPage: 518, juz: 26 },
  { number: 51, nameAr: 'الذاريات', nameEn: 'Adh-Dhariyat', meaningEn: 'The Winnowing Winds', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 60, startPage: 520, juz: 26 },
  { number: 52, nameAr: 'الطور', nameEn: 'At-Tur', meaningEn: 'The Mount', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 49, startPage: 523, juz: 27 },
  { number: 53, nameAr: 'النجم', nameEn: 'An-Najm', meaningEn: 'The Star', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 62, startPage: 526, juz: 27 },
  { number: 54, nameAr: 'القمر', nameEn: 'Al-Qamar', meaningEn: 'The Moon', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 55, startPage: 528, juz: 27 },
  { number: 55, nameAr: 'الرحمن', nameEn: 'Ar-Rahman', meaningEn: 'The Beneficent', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 78, startPage: 531, juz: 27 },
  { number: 56, nameAr: 'الواقعة', nameEn: 'Al-Waqi\'ah', meaningEn: 'The Inevitable', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 96, startPage: 534, juz: 27 },
  { number: 57, nameAr: 'الحديد', nameEn: 'Al-Hadid', meaningEn: 'The Iron', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 29, startPage: 537, juz: 27 },
  { number: 58, nameAr: 'المجادلة', nameEn: 'Al-Mujadila', meaningEn: 'The Pleading Woman', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 22, startPage: 542, juz: 28 },
  { number: 59, nameAr: 'الحشر', nameEn: 'Al-Hashr', meaningEn: 'The Exile', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 24, startPage: 545, juz: 28 },
  { number: 60, nameAr: 'الممتحنة', nameEn: 'Al-Mumtahanah', meaningEn: 'She that is to be examined', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 13, startPage: 549, juz: 28 },
  { number: 61, nameAr: 'الصف', nameEn: 'As-Saf', meaningEn: 'The Ranks', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 14, startPage: 551, juz: 28 },
  { number: 62, nameAr: 'الجمعة', nameEn: 'Al-Jumu\'ah', meaningEn: 'The Congregation', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 11, startPage: 553, juz: 28 },
  { number: 63, nameAr: 'المنافقون', nameEn: 'Al-Munafiqun', meaningEn: 'The Hypocrites', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 11, startPage: 554, juz: 28 },
  { number: 64, nameAr: 'التغابن', nameEn: 'At-Taghabun', meaningEn: 'The Mutual Disillusion', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 18, startPage: 556, juz: 28 },
  { number: 65, nameAr: 'الطلاق', nameEn: 'At-Talaq', meaningEn: 'The Divorce', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 12, startPage: 558, juz: 28 },
  { number: 66, nameAr: 'التحريم', nameEn: 'At-Tahrim', meaningEn: 'The Prohibition', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 12, startPage: 560, juz: 28 },
  { number: 67, nameAr: 'الملك', nameEn: 'Al-Mulk', meaningEn: 'The Sovereignty', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 30, startPage: 562, juz: 29 },
  { number: 68, nameAr: 'القلم', nameEn: 'Al-Qalam', meaningEn: 'The Pen', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 52, startPage: 564, juz: 29 },
  { number: 69, nameAr: 'الحاقة', nameEn: 'Al-Haqqah', meaningEn: 'The Reality', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 52, startPage: 566, juz: 29 },
  { number: 70, nameAr: 'المعارج', nameEn: 'Al-Ma\'arij', meaningEn: 'The Ascending Stairways', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 44, startPage: 568, juz: 29 },
  { number: 71, nameAr: 'نوح', nameEn: 'Nuh', meaningEn: 'Noah', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 28, startPage: 570, juz: 29 },
  { number: 72, nameAr: 'الجن', nameEn: 'Al-Jinn', meaningEn: 'The Jinn', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 28, startPage: 572, juz: 29 },
  { number: 73, nameAr: 'المزمل', nameEn: 'Al-Muzzammil', meaningEn: 'The Enshrouded One', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 20, startPage: 574, juz: 29 },
  { number: 74, nameAr: 'المدثر', nameEn: 'Al-Muddaththir', meaningEn: 'The Cloaked One', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 56, startPage: 575, juz: 29 },
  { number: 75, nameAr: 'القيامة', nameEn: 'Al-Qiyamah', meaningEn: 'The Resurrection', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 40, startPage: 577, juz: 29 },
  { number: 76, nameAr: 'الإنسان', nameEn: 'Al-Insan', meaningEn: 'The Man', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 31, startPage: 578, juz: 29 },
  { number: 77, nameAr: 'المرسلات', nameEn: 'Al-Mursalat', meaningEn: 'The Emissaries', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 50, startPage: 580, juz: 29 },
  { number: 78, nameAr: 'النبأ', nameEn: 'An-Naba', meaningEn: 'The Tidings', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 40, startPage: 582, juz: 30 },
  { number: 79, nameAr: 'النازعات', nameEn: 'An-Nazi\'at', meaningEn: 'Those who drag forth', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 46, startPage: 583, juz: 30 },
  { number: 80, nameAr: 'عبس', nameEn: '\'Abasa', meaningEn: 'He Frowned', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 42, startPage: 585, juz: 30 },
  { number: 81, nameAr: 'التكوير', nameEn: 'At-Takwir', meaningEn: 'The Overthrowing', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 29, startPage: 586, juz: 30 },
  { number: 82, nameAr: 'الانفطار', nameEn: 'Al-Infitar', meaningEn: 'The Cleaving', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 19, startPage: 587, juz: 30 },
  { number: 83, nameAr: 'المطففين', nameEn: 'Al-Mutaffifin', meaningEn: 'The Defrauding', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 36, startPage: 587, juz: 30 },
  { number: 84, nameAr: 'الانشقاق', nameEn: 'Al-Inshiqaq', meaningEn: 'The Sundering', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 25, startPage: 589, juz: 30 },
  { number: 85, nameAr: 'البروج', nameEn: 'Al-Buruj', meaningEn: 'The Mansions of the Stars', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 22, startPage: 590, juz: 30 },
  { number: 86, nameAr: 'الطارق', nameEn: 'At-Tariq', meaningEn: 'The Morning Star', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 17, startPage: 591, juz: 30 },
  { number: 87, nameAr: 'الأعلى', nameEn: 'Al-A\'la', meaningEn: 'The Most High', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 19, startPage: 591, juz: 30 },
  { number: 88, nameAr: 'الغاشية', nameEn: 'Al-Ghashiyah', meaningEn: 'The Overwhelming', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 26, startPage: 592, juz: 30 },
  { number: 89, nameAr: 'الفجر', nameEn: 'Al-Fajr', meaningEn: 'The Dawn', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 30, startPage: 593, juz: 30 },
  { number: 90, nameAr: 'البلد', nameEn: 'Al-Balad', meaningEn: 'The City', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 20, startPage: 594, juz: 30 },
  { number: 91, nameAr: 'الشمس', nameEn: 'Ash-Shams', meaningEn: 'The Sun', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 15, startPage: 595, juz: 30 },
  { number: 92, nameAr: 'الليل', nameEn: 'Al-Layl', meaningEn: 'The Night', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 21, startPage: 595, juz: 30 },
  { number: 93, nameAr: 'الضحى', nameEn: 'Ad-Duhaa', meaningEn: 'The Morning Hours', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 11, startPage: 596, juz: 30 },
  { number: 94, nameAr: 'الشرح', nameEn: 'Ash-Sharh', meaningEn: 'The Relief', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 8, startPage: 596, juz: 30 },
  { number: 95, nameAr: 'التين', nameEn: 'At-Tin', meaningEn: 'The Fig', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 8, startPage: 597, juz: 30 },
  { number: 96, nameAr: 'العلق', nameEn: 'Al-\'Alaq', meaningEn: 'The Clot', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 19, startPage: 597, juz: 30 },
  { number: 97, nameAr: 'القدر', nameEn: 'Al-Qadr', meaningEn: 'The Power', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 5, startPage: 598, juz: 30 },
  { number: 98, nameAr: 'البينة', nameEn: 'Al-Bayyinah', meaningEn: 'The Clear Proof', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 8, startPage: 598, juz: 30 },
  { number: 99, nameAr: 'الزلزلة', nameEn: 'Az-Zalzalah', meaningEn: 'The Earthquake', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 8, startPage: 599, juz: 30 },
  { number: 100, nameAr: 'العاديات', nameEn: 'Al-\'Adiyat', meaningEn: 'The Courser', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 11, startPage: 599, juz: 30 },
  { number: 101, nameAr: 'القارعة', nameEn: 'Al-Qari\'ah', meaningEn: 'The Calamity', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 11, startPage: 600, juz: 30 },
  { number: 102, nameAr: 'التكاثر', nameEn: 'At-Takathur', meaningEn: 'The Rivalry in world increase', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 8, startPage: 600, juz: 30 },
  { number: 103, nameAr: 'العصر', nameEn: 'Al-\'Asr', meaningEn: 'The Declining Day', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 3, startPage: 601, juz: 30 },
  { number: 104, nameAr: 'الهمزة', nameEn: 'Al-Humazah', meaningEn: 'The Traducer', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 9, startPage: 601, juz: 30 },
  { number: 105, nameAr: 'الفيل', nameEn: 'Al-Fil', meaningEn: 'The Elephant', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 5, startPage: 601, juz: 30 },
  { number: 106, nameAr: 'قريش', nameEn: 'Quraysh', meaningEn: 'Quraysh', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 4, startPage: 602, juz: 30 },
  { number: 107, nameAr: 'الماعون', nameEn: 'Al-Ma\'un', meaningEn: 'The Small Kindnesses', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 7, startPage: 602, juz: 30 },
  { number: 108, nameAr: 'الكوثر', nameEn: 'Al-Kawthar', meaningEn: 'The Abundance', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 3, startPage: 602, juz: 30 },
  { number: 109, nameAr: 'الكافرون', nameEn: 'Al-Kafirun', meaningEn: 'The Disbelievers', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 6, startPage: 603, juz: 30 },
  { number: 110, nameAr: 'النصر', nameEn: 'An-Nasr', meaningEn: 'The Divine Support', revelationType: 'Medinan', revelationAr: 'مدنية', ayahCount: 3, startPage: 603, juz: 30 },
  { number: 111, nameAr: 'المسد', nameEn: 'Al-Masad', meaningEn: 'The Palm Fiber', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 5, startPage: 603, juz: 30 },
  { number: 112, nameAr: 'الإخلاص', nameEn: 'Al-Ikhlas', meaningEn: 'The Sincerity', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 4, startPage: 604, juz: 30 },
  { number: 113, nameAr: 'الفلق', nameEn: 'Al-Falaq', meaningEn: 'The Daybreak', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 5, startPage: 604, juz: 30 },
  { number: 114, nameAr: 'الناس', nameEn: 'An-Nas', meaningEn: 'Mankind', revelationType: 'Meccan', revelationAr: 'مكية', ayahCount: 6, startPage: 604, juz: 30 },
];

export const TAFSEER_BOOKS: TafseerBook[] = [
  { id: 1, slug: 'muyassar', editionId: 'ar.muyassar', nameAr: 'التفسير الميسر (مجمع الملك فهد)', nameEn: 'King Fahad Quran Complex', authorAr: 'مجمع الملك فهد لطباعة المصحف الشريف', descriptionAr: 'تفسير مختصر وميسر معاصر صادر عن مجمع الملك فهد لطباعة المصحف الشريف يوضح المعاني بأسلوب سهل ومباشر.' },
  { id: 2, slug: 'jalalayn', editionId: 'ar.jalalayn', nameAr: 'تفسير الجلالين', nameEn: 'Tafsir Al-Jalalayn', authorAr: 'جلال الدين المحلي وجلال الدين السيوطي', descriptionAr: 'من أشهر التفاسير المختصرة التي تعتني ببيان مفردات القرآن وإعرابه.' },
  { id: 3, slug: 'qurtubi', editionId: 'ar.qurtubi', nameAr: 'تفسير القرطبي', nameEn: 'Tafsir Al-Qurtubi', authorAr: 'الإمام أبو عبد الله القرطبي', descriptionAr: 'الجامع لأحكام القرآن، يركز على استنباط الأحكام الفقهية واللغوية.' },
  { id: 4, slug: 'ibnkathir', editionId: 'ar.ibnkathir', nameAr: 'تفسير ابن كثير', nameEn: 'Tafsir Ibn Kathir', authorAr: 'الإمام عماد الدين ابن كثير', descriptionAr: 'تفسير القرآن العظيم بالمأثور (تفسير القرآن بالقرآن والسنة النبوية).' },
  { id: 5, slug: 'baghawi', editionId: 'ar.baghawi', nameAr: 'تفسير البغوي', nameEn: 'Tafsir Al-Baghawi', authorAr: 'الإمام الحسين بن مسعود البغوي', descriptionAr: 'معالم التنزيل في التفسير والتأويل، وسط بين الطول والاختصار.' },
  { id: 6, slug: 'sadi', editionId: 'ar.sadi', nameAr: 'تفسير السعدي', nameEn: 'Tafsir As-Sa\'di', authorAr: 'الشيخ عبد الرحمن بن ناصر السعدي', descriptionAr: 'تيسير الكريم الرحمن في تفسير كلام المنان، يمتاز بوضوح العبارة والتربية الإيمانية.' },
];

export const TRANSLATION_EDITIONS: TranslationEdition[] = [
  { code: 'en', editionId: 'en.sahih', languageNameAr: 'Saheeh International (الإنجليزية)', languageNameEn: 'Saheeh International', translatorName: 'Saheeh International', dir: 'ltr' },
  { code: 'en-pickthall', editionId: 'en.pickthall', languageNameAr: 'Pickthall (الإنجليزية)', languageNameEn: 'English (M. Pickthall)', translatorName: 'Mohammed Marmaduke Pickthall', dir: 'ltr' },
  { code: 'en-yusufali', editionId: 'en.yusufali', languageNameAr: 'Yusuf Ali (الإنجليزية)', languageNameEn: 'English (Yusuf Ali)', translatorName: 'Abdullah Yusuf Ali', dir: 'ltr' },
  { code: 'fr', editionId: 'fr.hamidullah', languageNameAr: 'الفرنسية (Hamidullah)', languageNameEn: 'Français (Hamidullah)', translatorName: 'Muhammad Hamidullah', dir: 'ltr' },
  { code: 'tr', editionId: 'tr.diyanet', languageNameAr: 'التركية (Diyanet)', languageNameEn: 'Türkçe (Diyanet)', translatorName: 'Diyanet İşleri', dir: 'ltr' },
  { code: 'id', editionId: 'id.indonesian', languageNameAr: 'الإندونيسية (Kemenag)', languageNameEn: 'Bahasa Indonesia', translatorName: 'Kementerian Agama RI', dir: 'ltr' },
  { code: 'ur', editionId: 'ur.jalandhry', languageNameAr: 'الأردية (جالندھری)', languageNameEn: 'اردو (جالندھری)', translatorName: 'Fateh Muhammad Jalandhry', dir: 'rtl' },
  { code: 'es', editionId: 'es.cortes', languageNameAr: 'الإسبانية (Julio Cortés)', languageNameEn: 'Español (Julio Cortés)', translatorName: 'Julio Cortés', dir: 'ltr' },
  { code: 'ru', editionId: 'ru.kuliev', languageNameAr: 'الروسية (Кулиев)', languageNameEn: 'Русский (Эльмир Кулиев)', translatorName: 'Elmir Kuliev', dir: 'ltr' },
  { code: 'de', editionId: 'de.bubenheim', languageNameAr: 'الألمانية (Bubenheim)', languageNameEn: 'Deutsch (Bubenheim & Elyas)', translatorName: 'Bubenheim & Elyas', dir: 'ltr' },
];

export const JUZ_META = Array.from({ length: 30 }, (_, idx) => {
  const juzNum = idx + 1;
  const startSurah = SURAHS_META.find((s) => s.juz === juzNum) ?? SURAHS_META[0]!;
  const juzNamesAr = [
    'الم', 'سيقول', 'تلك الرسل', 'لن تنالوا', 'والمحصنات', 'لا يحب الله', 'وإذا سمعوا', 'ولو أننا', 'قال الملأ', 'واعلموا',
    'يعتذرون', 'وما من دابة', 'وما أبرئ', 'ربما', 'سبحان الذي', 'قال ألم', 'اقترب للناس', 'قد أفلح', 'وقال الذين', 'أمن خلق',
    'اتل ما أوحي', 'ومن يقنت', 'ومالي', 'فمن أظلم', 'إليه يرد', 'حم', 'قال فما خطبكم', 'قد سمع الله', 'تبارك الذي', 'عم يتساءلون'
  ];
  return {
    number: juzNum,
    nameAr: `الجزء ${juzNum} (${juzNamesAr[idx] ?? ''})`,
    titleAr: juzNamesAr[idx] ?? `الجزء ${juzNum}`,
    startSurahNumber: startSurah.number,
    startSurahNameAr: startSurah.nameAr,
    startPage: juzNum === 1 ? 1 : (juzNum - 1) * 20 + 2,
    hizbStart: (juzNum - 1) * 2 + 1,
    hizbEnd: juzNum * 2,
  };
});

const memoryApiCache = new Map<string, { data: unknown; expiresAt: number }>();
const API_BASE = 'https://api.kalamalah.com';

async function fetchJsonCached<T>(url: string, ttlMs = 1000 * 60 * 60 * 12): Promise<T | null> {
  const now = Date.now();
  const hit = memoryApiCache.get(url);
  if (hit && hit.expiresAt > now) {
    return hit.data as T;
  }
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'KalamalahPlayer/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as T;
    memoryApiCache.set(url, { data: json, expiresAt: now + ttlMs });
    return json;
  } catch {
    return null;
  }
}

export function getSurahMeta(surahNumber: number): SurahMeta {
  const clamped = Math.max(1, Math.min(114, Math.floor(surahNumber)));
  return SURAHS_META[clamped - 1] ?? SURAHS_META[0]!;
}

export async function fetchSurahDetail(
  surahNumber: number,
  translationEdition = 'en.sahih',
  tafseerEdition = 'ar.muyassar'
): Promise<SurahDetail> {
  const meta = getSurahMeta(surahNumber);

  // Primary: Kalamalah API /api/quran/surah/{number}
  const kalamalahRaw = await fetchJsonCached<any>(`${API_BASE}/api/quran/surah/${meta.number}`);
  let ayahs: AyahItem[] = [];

  if (kalamalahRaw) {
    const rawAyahs = kalamalahRaw?.data?.ayahs ?? kalamalahRaw?.ayahs ?? (Array.isArray(kalamalahRaw?.data) ? kalamalahRaw.data : null);
    if (Array.isArray(rawAyahs) && rawAyahs.length > 0) {
      ayahs = rawAyahs.map((a: any, i: number) => ({
        number: Number(a.number ?? a.id ?? i + 1),
        numberInSurah: Number(a.numberInSurah ?? a.ayah_number ?? a.verse_number ?? i + 1),
        text: String(a.text ?? a.text_uthmani ?? '').replace(/^\uFEFF/, '').trim(),
        juz: Number(a.juz ?? meta.juz),
        manzil: Number(a.manzil ?? 1),
        page: Number(a.page ?? meta.startPage),
        ruku: Number(a.ruku ?? 1),
        hizbQuarter: Number(a.hizbQuarter ?? 1),
        sajda: Boolean(a.sajda),
        surahNumber: meta.number,
        surahNameAr: meta.nameAr,
        surahNameEn: meta.nameEn,
      }));
    }
  }

  // Fallback if needed: api.alquran.cloud/v1/surah/{number}/quran-uthmani
  if (ayahs.length === 0) {
    const fallback = await fetchJsonCached<any>(`https://api.alquran.cloud/v1/surah/${meta.number}/quran-uthmani`);
    const rawAyahs = fallback?.data?.ayahs;
    if (Array.isArray(rawAyahs)) {
      ayahs = rawAyahs.map((a: any, i: number) => ({
        number: Number(a.number ?? i + 1),
        numberInSurah: Number(a.numberInSurah ?? i + 1),
        text: String(a.text ?? ''),
        juz: Number(a.juz ?? meta.juz),
        manzil: Number(a.manzil ?? 1),
        page: Number(a.page ?? meta.startPage),
        ruku: Number(a.ruku ?? 1),
        hizbQuarter: Number(a.hizbQuarter ?? 1),
        sajda: Boolean(a.sajda),
        surahNumber: meta.number,
        surahNameAr: meta.nameAr,
        surahNameEn: meta.nameEn,
      }));
    }
  }

  // Strip leading Bismillah on Surahs != 1 and != 9 if attached to Ayah 1
  if (meta.number !== 1 && meta.number !== 9 && ayahs.length > 0 && ayahs[0]) {
    const first = ayahs[0].text;
    const bismillahVariants = [
      'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ',
      'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ',
      'بسم الله الرحمن الرحيم ',
    ];
    for (const b of bismillahVariants) {
      if (first.startsWith(b) && first.length > b.length + 2) {
        ayahs[0].text = first.slice(b.length).trim();
        break;
      }
    }
  }

  // Enrich with Translation & Tafseer in parallel
  const [transRes, tafRes] = await Promise.all([
    fetchJsonCached<any>(`${API_BASE}/api/quran/surah/${meta.number}?edition=${encodeURIComponent(translationEdition)}`).then(
      (r) => r ?? fetchJsonCached<any>(`https://api.alquran.cloud/v1/surah/${meta.number}/${encodeURIComponent(translationEdition)}`)
    ),
    fetchJsonCached<any>(`${API_BASE}/api/quran/surah/${meta.number}?edition=${encodeURIComponent(tafseerEdition)}`).then(
      (r) => r ?? fetchJsonCached<any>(`https://api.alquran.cloud/v1/surah/${meta.number}/${encodeURIComponent(tafseerEdition)}`)
    ),
  ]);

  const transAyahs = transRes?.data?.ayahs ?? transRes?.ayahs ?? [];
  const tafAyahs = tafRes?.data?.ayahs ?? tafRes?.ayahs ?? [];

  for (let i = 0; i < ayahs.length; i++) {
    const item = ayahs[i];
    if (!item) continue;
    if (Array.isArray(transAyahs) && transAyahs[i]?.text) {
      item.translationText = String(transAyahs[i].text);
    }
    if (Array.isArray(tafAyahs) && tafAyahs[i]?.text) {
      item.tafseerText = String(tafAyahs[i].text);
    }
  }

  return { meta, ayahs };
}

export async function fetchMushafPage(pageNumber: number): Promise<{
  page: number;
  juz: number;
  hizbQuarter: number;
  surahsOnPage: SurahMeta[];
  ayahs: AyahItem[];
}> {
  const page = Math.max(1, Math.min(604, Math.floor(pageNumber)));
  let raw = await fetchJsonCached<any>(`${API_BASE}/api/quran/page/${page}`);
  let rawAyahs = raw?.data?.ayahs ?? raw?.ayahs;

  if (!Array.isArray(rawAyahs) || rawAyahs.length === 0) {
    raw = await fetchJsonCached<any>(`https://api.alquran.cloud/v1/page/${page}/quran-uthmani`);
    rawAyahs = raw?.data?.ayahs ?? [];
  }

  const surahSet = new Set<number>();
  const ayahs: AyahItem[] = (Array.isArray(rawAyahs) ? rawAyahs : []).map((a: any, i: number) => {
    const sNum = Number(a.surah?.number ?? a.surah_number ?? 1);
    surahSet.add(sNum);
    const sMeta = getSurahMeta(sNum);
    return {
      number: Number(a.number ?? i + 1),
      numberInSurah: Number(a.numberInSurah ?? a.ayah_number ?? i + 1),
      text: String(a.text ?? ''),
      juz: Number(a.juz ?? sMeta.juz),
      manzil: Number(a.manzil ?? 1),
      page,
      ruku: Number(a.ruku ?? 1),
      hizbQuarter: Number(a.hizbQuarter ?? 1),
      sajda: Boolean(a.sajda),
      surahNumber: sNum,
      surahNameAr: sMeta.nameAr,
      surahNameEn: sMeta.nameEn,
    };
  });

  const surahsOnPage = Array.from(surahSet).map((n) => getSurahMeta(n));
  const first = ayahs[0];

  return {
    page,
    juz: first?.juz ?? Math.ceil(page / 20),
    hizbQuarter: first?.hizbQuarter ?? 1,
    surahsOnPage,
    ayahs,
  };
}

export async function fetchJuzDetail(juzNumber: number): Promise<{
  juz: number;
  ayahs: AyahItem[];
  groups: { surah: SurahMeta; ayahs: AyahItem[] }[];
}> {
  const juz = Math.max(1, Math.min(30, Math.floor(juzNumber)));
  let raw = await fetchJsonCached<any>(`${API_BASE}/api/quran/juz/${juz}`);
  let rawAyahs = raw?.data?.ayahs ?? raw?.ayahs;

  if (!Array.isArray(rawAyahs) || rawAyahs.length === 0) {
    raw = await fetchJsonCached<any>(`https://api.alquran.cloud/v1/juz/${juz}/quran-uthmani`);
    rawAyahs = raw?.data?.ayahs ?? [];
  }

  const ayahs: AyahItem[] = (Array.isArray(rawAyahs) ? rawAyahs : []).map((a: any, i: number) => {
    const sNum = Number(a.surah?.number ?? a.surah_number ?? 1);
    const sMeta = getSurahMeta(sNum);
    return {
      number: Number(a.number ?? i + 1),
      numberInSurah: Number(a.numberInSurah ?? i + 1),
      text: String(a.text ?? ''),
      juz,
      manzil: Number(a.manzil ?? 1),
      page: Number(a.page ?? sMeta.startPage),
      ruku: Number(a.ruku ?? 1),
      hizbQuarter: Number(a.hizbQuarter ?? 1),
      sajda: Boolean(a.sajda),
      surahNumber: sNum,
      surahNameAr: sMeta.nameAr,
      surahNameEn: sMeta.nameEn,
    };
  });

  const groups: { surah: SurahMeta; ayahs: AyahItem[] }[] = [];
  for (const ayah of ayahs) {
    const sNum = ayah.surahNumber ?? 1;
    const lastGroup = groups[groups.length - 1];
    if (!lastGroup || lastGroup.surah.number !== sNum) {
      groups.push({ surah: getSurahMeta(sNum), ayahs: [ayah] });
    } else {
      lastGroup.ayahs.push(ayah);
    }
  }

  return { juz, ayahs, groups };
}
