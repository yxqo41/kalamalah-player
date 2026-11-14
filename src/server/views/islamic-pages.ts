import { ASMA_UL_HUSNA, DUA_CATEGORIES, DUAS_COLLECTION } from '../islamic-content-data';
import { escapeHtml, renderIntervalsToArabicDigits, renderLayout } from './layout';

export function renderIslamOnlineRecommendationBanner(): string {
  return `<aside class="islamonline-community-banner container" aria-label="مصادر إسلامية موصى بها">
    <div class="iol-banner-card">
      <div class="iol-banner-content">
        <span class="iol-badge">ترشيح معرفي غير رسمي · Unofficial Community Pick</span>
        <h3>تبحث عن الفتاوى الموثوقة والمقالات الفكرية والدراسات الإسلامية؟</h3>
        <p>ننصحك بزيارة شبكة <strong>إسلام أون لاين (IslamOnline.net)</strong> للاستزادة من الفتاوى الشرعية المعاصرة، تزكية النفوس، والبحوث القرآنية والنبوية الشاملة.</p>
      </div>
      <div class="iol-banner-actions">
        <a href="https://islamonline.net" target="_blank" rel="noopener noreferrer" class="btn-primary-gold">
          <span>زيارة IslamOnline.net</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
        </a>
      </div>
    </div>
  </aside>`;
}

export function renderDuasPage(): string {
  const categoriesTabsHtml = DUA_CATEGORIES.map(
    (c, idx) => `<button type="button" class="seg-pill ${idx === 0 ? 'active' : ''}" data-dua-category="${c.id}">
      <span>${escapeHtml(c.labelAr)}</span>
    </button>`
  ).join('\n');

  const duasCardsHtml = DUAS_COLLECTION.map((d) => {
    const arTarget = renderIntervalsToArabicDigits(d.recommendedCount);
    return `<article class="dua-card" id="dua-${escapeHtml(d.id)}" data-category="${d.category}" data-search="${escapeHtml(`${d.titleAr} ${d.titleEn} ${d.arabicText} ${d.translationEn} ${d.sourceAr}`.toLowerCase())}">
      <div class="dua-card-top">
        <div class="dua-title-wrap">
          <span class="dua-cat-badge">${escapeHtml(DUA_CATEGORIES.find((c) => c.id === d.category)?.labelAr ?? '')}</span>
          <h2>${escapeHtml(d.titleAr)}</h2>
          <p class="dua-title-en">${escapeHtml(d.titleEn)}</p>
        </div>

        <div class="dua-actions">
          <button type="button" class="dua-tasbih-btn" data-dua-counter="${escapeHtml(d.id)}" data-target-count="${d.recommendedCount}" title="اضغط للتسبيح والعد">
            <span class="tasbih-current" data-current-count="0">٠</span>
            <span class="tasbih-sep">/</span>
            <span class="tasbih-target">${arTarget}</span>
            <span class="tasbih-label">تكرار</span>
          </button>

          <button type="button" class="ayah-tool-btn dua-copy-btn" data-copy-dua="${escapeHtml(d.id)}" title="نسخ الدعاء">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            <span>نسخ</span>
          </button>
        </div>
      </div>

      <div class="dua-arabic-box quran-reading-text" dir="rtl" data-dua-text="${escapeHtml(d.arabicText)}">
        ${escapeHtml(d.arabicText)}
      </div>

      <div class="dua-transliteration" dir="ltr">
        ${escapeHtml(d.transliteration)}
      </div>

      <p class="dua-translation-en" dir="ltr">
        ${escapeHtml(d.translationEn)}
      </p>

      <div class="dua-card-footer">
        <span class="dua-source-chip">المصدر: ${escapeHtml(d.sourceAr)}</span>
        ${d.virtueAr ? `<span class="dua-virtue-note">${escapeHtml(d.virtueAr)}</span>` : ''}
      </div>
    </article>`;
  }).join('\n');

  const bodyContent = `
    <section class="page-hero container">
      <div class="page-hero-card">
        <div class="hero-flex-between">
          <div>
            <h1>موسوعة الأدعية القرآنية والأذكار النبوية الصحيحة</h1>
            <p>أدعية مختارة من القرآن الكريم والسنة النبوية المطهرة لأذكار الصباح والمساء، تفريج الكرب، والشفاء مع عداد تكرار تفاعلي.</p>
          </div>
          <button type="button" id="reset-all-tasbih-btn" class="btn-outline-sm">تصفير جميع العدادات</button>
        </div>

        <div class="duas-toolbar">
          <div class="segmented-pills" role="tablist" aria-label="تصنيف الأدعية">
            ${categoriesTabsHtml}
          </div>

          <div class="search-input-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="search" id="duas-search-input" placeholder="ابحث في الأدعية والأذكار بالعربية أو الإنجليزية..." aria-label="ابحث في الأدعية" />
          </div>
        </div>
      </div>
    </section>

    <section class="container">
      <div id="duas-grid-container" class="duas-grid">
        ${duasCardsHtml}
      </div>
    </section>

    ${renderIslamOnlineRecommendationBanner()}
  `;

  return renderLayout({
    title: 'الأدعية القرآنية والأذكار النبوية الصحيحة | حصن المسلم | كلام الله',
    description: 'مجموعة شاملة من الأدعية القرآنية وأذكار الصباح والمساء وأدعية تفريج الكرب والشفاء مع الترجمة وعداد التسبيح التفاعلي.',
    canonicalPath: '/duas',
    activeNav: 'duas',
    bodyContent,
    pageBootstrapData: { pageType: 'duas' },
  });
}

export function renderAsmaUlHusnaPage(): string {
  const namesGridHtml = ASMA_UL_HUSNA.map((item) => {
    const arNum = renderIntervalsToArabicDigits(item.number);
    return `<article class="asma-card" data-name-number="${item.number}" data-search="${escapeHtml(`${item.number} ${item.nameAr} ${item.transliteration} ${item.nameEn} ${item.meaningAr} ${item.meaningEn}`.toLowerCase())}">
      <div class="asma-card-header">
        <span class="asma-num-badge">${arNum}</span>
        <span class="asma-translit" dir="ltr">${escapeHtml(item.transliteration)}</span>
      </div>
      <div class="asma-calligraphy quran-reading-text" dir="rtl">${escapeHtml(item.nameAr)}</div>
      <h2 class="asma-en-title" dir="ltr">${escapeHtml(item.nameEn)}</h2>
      <p class="asma-meaning-ar">${escapeHtml(item.meaningAr)}</p>
      <p class="asma-meaning-en" dir="ltr">${escapeHtml(item.meaningEn)}</p>
    </article>`;
  }).join('\n');

  const bodyContent = `
    <section class="page-hero container">
      <div class="page-hero-card">
        <div class="asma-verse-quote quran-reading-text" dir="rtl">
          ﴿وَلِلَّهِ ٱلْأَسْمَآءُ ٱلْحُسْنَىٰ فَٱدْعُوهُ بِهَا﴾
        </div>
        <h1>أسماء الله الحسنى التسعة والتسعون (٩٩ اسماً)</h1>
        <p>تدبر أسماء الله الحسنى ومعانيها الجليلة باللغتين العربية والإنجليزية، كما ورد في الحديث الصحيح: «إن لله تسعة وتسعين اسماً مائة إلا واحداً من أحصاها دخل الجنة».</p>

        <div class="reciters-filter-bar">
          <div class="search-input-wrap" style="max-width: 460px; width: 100%;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="search" id="asma-search-input" placeholder="ابحث عن اسم من أسماء الله الحسنى أو معناه..." aria-label="ابحث في أسماء الله الحسنى" />
          </div>
          <a href="/duas" class="btn-outline-sm">تصفح الأدعية القرآنية والأذكار</a>
        </div>
      </div>
    </section>

    <section class="container">
      <div id="asma-grid-container" class="asma-grid">
        ${namesGridHtml}
      </div>
    </section>

    ${renderIslamOnlineRecommendationBanner()}
  `;

  return renderLayout({
    title: 'أسماء الله الحسنى (٩٩ اسماً) مع شرح المعاني | كلام الله',
    description: 'استعرض أسماء الله الحسنى التسعة والتسعين كاملة بالخط القرآني مع شرح معانيها بالعربية والإنجليزية.',
    canonicalPath: '/names',
    activeNav: 'names',
    bodyContent,
    pageBootstrapData: { pageType: 'names' },
  });
}

export function renderAiAssistantPage(): string {
  const bodyContent = `
    <section class="ai-assistant-section container">
      <div class="ai-chat-card">
        <header class="ai-chat-header">
          <div class="ai-header-identity">
            <div class="ai-avatar-badge" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            </div>
            <div>
              <h1>المساعد القرآني الذكي (Kalamalah AI)</h1>
              <p>اسأل عن معاني الآيات، السور، الأدعية القرآنية، أحكام التجويد، والمعلومات الإسلامية.</p>
            </div>
          </div>
          <div class="ai-header-actions">
            <button type="button" id="ai-clear-chat-btn" class="btn-glass-sm">محادثة جديدة</button>
          </div>
        </header>

        <div class="ai-suggestions-strip" id="ai-suggestions-strip">
          <button type="button" class="ai-prompt-chip" data-ai-prompt="ما هي فضائل سورة الكهف وما أبرز القصص الواردة فيها؟">فضائل وقصص سورة الكهف</button>
          <button type="button" class="ai-prompt-chip" data-ai-prompt="اذكر لي أجمل الأدعية القرآنية التي تبدأ بـ (ربنا) مع معانيها">أدعية قرآنية تبدأ بـ ربنا</button>
          <button type="button" class="ai-prompt-chip" data-ai-prompt="اشرح لي الفرق بين الإظهار والإدغام والإخفاء في التجويد بأمثلة مبسطة">شرح أحكام النون الساكنة</button>
          <button type="button" class="ai-prompt-chip" data-ai-prompt="ما هو تفسير آية الكرسي (البقرة 255) ولماذا هي أعظم آية في القرآن؟">تفسير آية الكرسي</button>
        </div>

        <div id="ai-messages-viewport" class="ai-messages-viewport" role="log" aria-live="polite">
          <div class="ai-msg-row assistant">
            <div class="ai-msg-bubble">
              <p>السلام عليكم ورحمة الله وبركاته! أهلاً بك في المساعد الذكي لمنصة <strong>كلام الله</strong>. كيف يمكنني مساعدتك اليوم في تدبر القرآن الكريم، التفسير، التجويد، أو الأدعية والأذكار؟</p>
            </div>
          </div>
        </div>

        <form id="ai-chat-form" class="ai-chat-input-bar" autocomplete="off">
          <input
            type="text"
            id="ai-chat-input"
            class="ai-chat-text-input"
            placeholder="اكتب سؤالك هنا عن القرآن الكريم أو التفسير أو الأدعية..."
            aria-label="رسالتك إلى المساعد الذكي"
            required
          />
          <button type="submit" id="ai-chat-submit-btn" class="btn-primary-gold">
            <span>إرسال</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
      </div>
    </section>

    ${renderIslamOnlineRecommendationBanner()}
  `;

  return renderLayout({
    title: 'المساعد القرآني الذكي (Kalamalah AI) | كلام الله',
    description: 'تحدث مع المساعد الذكي لمنصة كلام الله للإجابة عن أسئلتك حول سور القرآن الكريم، التفسير، التجويد، والأدعية.',
    canonicalPath: '/ai',
    activeNav: 'ai',
    bodyContent,
    pageBootstrapData: { pageType: 'ai' },
  });
}
