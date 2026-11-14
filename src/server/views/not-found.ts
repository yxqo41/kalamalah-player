import { escapeHtml, renderLayout } from './layout';

export function renderNotFoundPage(requestedPath: string): string {
  const safePath = escapeHtml(requestedPath);
  const bodyContent = `
    <section class="not-found-section container">
      <div class="not-found-card">
        <div class="nf-icon-wrap" aria-hidden="true">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
          </svg>
        </div>
        <span class="nf-code">404</span>
        <h1 class="nf-title">لم يتم العثور على الصفحة المطلوبة</h1>
        <p class="nf-subtitle">
          المسار <code>${safePath}</code> غير متوفر. يمكنك العودة إلى فهرس السور أو الانتقال مباشرة إلى سورة الفاتحة أو قائمة القراء.
        </p>

        <div class="nf-actions">
          <a href="/" class="btn-primary-gold">
            <span>العودة إلى فهرس السور</span>
          </a>
          <a href="/surah-1" class="btn-glass">
            <span>قراءة سورة الفاتحة</span>
          </a>
          <a href="/reciters" class="btn-outline-sm">
            <span>تصفح القراء (٢٨ قارئاً)</span>
          </a>
        </div>
      </div>
    </section>
  `;

  return renderLayout({
    title: '404 الصفحة غير موجودة | كلام الله (Kalamalah Player)',
    canonicalPath: '/404',
    bodyContent,
  });
}
