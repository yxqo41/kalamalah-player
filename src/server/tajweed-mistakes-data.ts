export interface RecitationMistakeItem {
  surah: number;
  ayah: number;
  wordText: string;
  wrongReading: string;
  correctReading: string;
  explanationAr: string;
}

export interface TajweedRuleInfo {
  id: string;
  nameAr: string;
  nameEn: string;
  categoryAr: string;
  printedColor: string;
  alquranColor: string;
  descriptionAr: string;
  exampleAr: string;
  exampleRef: string;
}

export const TAJWEED_RULES: TajweedRuleInfo[] = [
  {
    id: 'ghunnah',
    nameAr: 'الغُنَّة والإخفاء والإدغام بغنة',
    nameEn: 'Ghunnah & Ikhfa',
    categoryAr: 'أحكام النون والميم',
    printedColor: '#16a34a',
    alquranColor: '#22c55e',
    descriptionAr: 'صوت يخرج من الخيشوم بمقدار حركتين عند النون والميم المشددتين، والإخفاء الحقيقي والشفوي، والإدغام بغنة.',
    exampleAr: 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ / مَن يَقُولُ',
    exampleRef: 'الكوثر: ١، البقرة: ٨',
  },
  {
    id: 'qalqalah',
    nameAr: 'القَلْقَلَة (قطب جد)',
    nameEn: 'Qalqalah',
    categoryAr: 'صفات الحروف',
    printedColor: '#0284c7',
    alquranColor: '#38bdf8',
    descriptionAr: 'اضطراب المخرج عند النطق بأحد حروف (ق ط ب ج د) ساكناً حتى يُسمع له نبرة قوية، وتكون صغرى وسط الكلمة وكبرى عند الوقف.',
    exampleAr: 'قُلْ هُوَ اللَّهُ أَحَدٌ / لَمْ يَلِدْ وَلَمْ يُولَدْ',
    exampleRef: 'الإخلاص: ١ - ٣',
  },
  {
    id: 'madd-laazim',
    nameAr: 'المد اللازم والمد الواجب المتصل (٤ - ٦ حركات)',
    nameEn: 'Madd Lazim & Wajib Muttasil',
    categoryAr: 'أحكام المدود',
    printedColor: '#dc2626',
    alquranColor: '#ef4444',
    descriptionAr: 'إطالة الصوت بحرف المد عند ملاقاة همز في نفس الكلمة (واجب متصل: ٤-٥ حركات) أو سكون أصلي (لازم: ٦ حركات لزوماً).',
    exampleAr: 'وَلَا الضَّالِّينَ / جَاءَ نَصْرُ اللَّهِ',
    exampleRef: 'الفاتحة: ٧، النصر: ١',
  },
  {
    id: 'madd-jaiz',
    nameAr: 'المد الجائز المنفصل ومد الصلة الكبرى (٢ - ٤ - ٥ حركات)',
    nameEn: 'Madd Jaiz Munfasil',
    categoryAr: 'أحكام المدود',
    printedColor: '#ea580c',
    alquranColor: '#f97316',
    descriptionAr: 'أن يأتي حرف المد في آخر الكلمة الأولى وهمزة القطع في أول الكلمة التي تليها، ويمد بمقدار ٤ أو ٥ حركات من طريق الشاطبية.',
    exampleAr: 'إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ',
    exampleRef: 'القدر: ١',
  },
  {
    id: 'madd-tabeei',
    nameAr: 'المد الطبيعي والمد الفرعي الخفيف (حركتان)',
    nameEn: 'Madd Tabee\'i (Natural 2 Counts)',
    categoryAr: 'أحكام المدود',
    printedColor: '#d97706',
    alquranColor: '#f59e0b',
    descriptionAr: 'المد الذي لا تقوم ذات الحرف إلا به ولا يتوقف على سبب من همز أو سكون، ويمد بمقدار حركتين.',
    exampleAr: 'مَالِكِ يَوْمِ الدِّينِ',
    exampleRef: 'الفاتحة: ٤',
  },
  {
    id: 'tafkheem',
    nameAr: 'التفخيم والاستعلاء (خص ضغط قظ)',
    nameEn: 'Tafkheem (Heavy Letters)',
    categoryAr: 'التفخيم والترقيق',
    printedColor: '#2563eb',
    alquranColor: '#60a5fa',
    descriptionAr: 'سِمَن يدخل على صوت الحرف عند النطق به فيمتلئ الفم بصداه، ويشمل حروف الاستعلاء السبعة (خص ضغط قظ) والراء المفخمة ولام لفظ الجلالة.',
    exampleAr: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
    exampleRef: 'الفاتحة: ٦',
  },
  {
    id: 'idgham-no-ghunnah',
    nameAr: 'الحروف غير الملفوظة والإدغام بغير غنة (ل، ر)',
    nameEn: 'Silent Letters & Idgham without Ghunnah',
    categoryAr: 'الإدغام والوصل',
    printedColor: '#64748b',
    alquranColor: '#94a3b8',
    descriptionAr: 'همزة الوصل في درج الكلام، اللام الشمسية المدغمة، والألف الفارقة، وإدغام النون الساكنة في اللام والراء بلا غنة.',
    exampleAr: 'مِن رَّبِّهِمْ / وَالشَّمْسِ وَضُحَاهَا',
    exampleRef: 'البقرة: ٥، الشمس: ١',
  },
];

export const COMMON_RECITATION_MISTAKES: RecitationMistakeItem[] = [
  {
    surah: 1,
    ayah: 2,
    wordText: 'رَبِّ الْعَالَمِينَ',
    wrongReading: 'تسكين الباء أو تخفيفها في (رَبِّ)',
    correctReading: 'تشديد الباء مع الكسر الواضح: (رَبِّ الْعَالَمِينَ)',
    explanationAr: 'من الأخطاء الشائعة خطف كسرة الباء المشددة أو عدم تحقيق الشدة في كلمة (رَبِّ)، والصواب بيان التشديد وإتمام الكسرة.',
  },
  {
    surah: 1,
    ayah: 5,
    wordText: 'إِيَّاكَ نَعْبُدُ',
    wrongReading: 'تخفيف الياء في (إِيَّاكَ) فتصبح (إِياكَ)',
    correctReading: 'تشديد الياء تشديداً واضحاً: (إِيَّاكَ)',
    explanationAr: 'ترك تشديد الياء في (إِيَّاكَ) يغير المعنى اللغوي تماماً (فـ إياك بالتخفيف تعني ضوء الشمس)، لذا يجب تحقيق الشدة في الموضعين.',
  },
  {
    surah: 1,
    ayah: 6,
    wordText: 'الصِّرَاطَ الْمُسْتَقِيمَ',
    wrongReading: 'قلب الصاد سيناً في (الصِّرَاطَ) أو قلب التاء طاءً في (الْمُسْتَقِيمَ)',
    correctReading: 'تفخيم الصاد وإطباقها في (الصِّرَاطَ) وترقيق التاء في (الْمُسْتَقِيمَ)',
    explanationAr: 'احذر من ترقيق الصاد فتخرج سيناً، واحذر من تفخيم التاء لمجاورتها القاف المفخمة في كلمة (الْمُسْتَقِيمَ).',
  },
  {
    surah: 1,
    ayah: 7,
    wordText: 'أَنْعَمْتَ عَلَيْهِمْ / وَلَا الضَّالِّينَ',
    wrongReading: 'ضم التاء في (أَنْعَمْتُ) أو إنقاص المد اللازم في (الضَّالِّينَ) عن ٦ حركات',
    correctReading: 'فتح التاء (أَنْعَمْتَ) ومد الألف في (الضَّالِّينَ) ست حركات مع تشديد اللام',
    explanationAr: 'ضم التاء أو كسرها في (أَنْعَمْتَ) لحن جلي يغير الفاعل، وفي (الضَّالِّينَ) مد لازم كلمي مثقل يمد ٦ حركات لزوماً.',
  },
  {
    surah: 2,
    ayah: 255,
    wordText: 'لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ',
    wrongReading: 'ضم الهاء بدون صلة أو تسكينها وصلاً في (تَأْخُذُهُ)',
    correctReading: 'إثبات مد الصلة الصغرى حركتين وصلاً: (تَأْخُذُهُۥ سِنَةٌ)',
    explanationAr: 'هاء الضمير الواقعة بين متحركين توصل بواو لفظية تمد بمقدار حركتين حال الوصل.',
  },
  {
    surah: 18,
    ayah: 1,
    wordText: 'عِوَجَا ۜ (١) قَيِّمًا',
    wrongReading: 'وصل (عِوَجَا) بـ (قَيِّمًا) مع الإخفاء بدون سكت أو وقف',
    correctReading: 'الوقف على (عِوَجَا) أو السكت عليها سكتة لطيفة بلا تنفس قبل (قَيِّمًا)',
    explanationAr: 'السكت على ألف (عِوَجَا) يمنع توهم أن (قَيِّمًا) صفة لـ (عِوَجَا)، بل هو حال من الكتاب أي أنزله قيماً مستقيماً.',
  },
  {
    surah: 36,
    ayah: 52,
    wordText: 'مِن مَّرْقَدِنَا ۜ ۗ هَٰذَا',
    wrongReading: 'وصل (مَرْقَدِنَا) بـ (هَٰذَا) دون سكت أو وقف',
    correctReading: 'الوقف أو السكت اللطيف على (مَرْقَدِنَا) لبيان انتهاء كلام الكفار وابتداء الرد عليهم',
    explanationAr: 'السكت هنا يوضح أن قوله (هَٰذَا مَا وَعَدَ الرَّحْمَٰنُ) ليس من كلام البعث بل هو جواب الملائكة أو المؤمنين.',
  },
  {
    surah: 112,
    ayah: 4,
    wordText: 'كُفُوًا أَحَدٌ',
    wrongReading: 'تسكين الفاء في (كُفْواً) أو ترك القلقلة الكبرى في الدال عند الوقف على (أَحَدْ)',
    correctReading: 'ضم الفاء (كُفُوًا) في رواية حفص، وتحقيق القلقلة في الدال الساكنة وقفا',
    explanationAr: 'تُقرأ الفاء مضمومة في رواية حفص عن عاصم (كُفُوًا)، وتُقلقل الدال في أواخر آيات سورة الإخلاص الأربع.',
  },
];

export function getMistakesForSurah(surahNumber: number): RecitationMistakeItem[] {
  return COMMON_RECITATION_MISTAKES.filter((m) => m.surah === surahNumber);
}
