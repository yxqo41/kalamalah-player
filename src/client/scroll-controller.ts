/**
 * AML Optical-Center ScrollController ported in TypeScript for Quran Ayahs.
 * Centers the active ayah at 38% viewport height (Apple Music optical center)
 * and pauses auto-scrolling for 3500ms when the user scrolls manually.
 */

export class ScrollController {
  private container: HTMLElement;
  private isUserScrolling = false;
  private userScrollTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentActiveElement: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.bindEvents();
  }

  private bindEvents(): void {
    const onManualInteraction = () => {
      if (!this.isUserScrolling) {
        this.isUserScrolling = true;
        this.container.classList.add('is-user-scrolling');
      }
      if (this.userScrollTimeout) {
        clearTimeout(this.userScrollTimeout);
      }
      this.userScrollTimeout = setTimeout(() => {
        this.isUserScrolling = false;
        this.container.classList.remove('is-user-scrolling');
        if (this.currentActiveElement) {
          this.scrollToElement(this.currentActiveElement, true);
        }
      }, 3500);
    };

    this.container.addEventListener('wheel', onManualInteraction, { passive: true });
    this.container.addEventListener('touchmove', onManualInteraction, { passive: true });
  }

  public setActiveLine(element: HTMLElement | null, forceScroll = false): void {
    if (this.currentActiveElement === element && !forceScroll) return;
    this.currentActiveElement = element;
    if (element && (!this.isUserScrolling || forceScroll)) {
      this.scrollToElement(element, true);
    }
  }

  public scrollToElement(element: HTMLElement, smooth = true): void {
    if (!this.container || !element) return;
    const containerHeight = this.container.clientHeight;
    const elementTop = element.offsetTop;
    const elementHeight = element.clientHeight;

    // 38% optical center from the top of the viewport
    const opticalCenterOffset = containerHeight * 0.38;
    const targetScrollTop = Math.max(0, elementTop - opticalCenterOffset + elementHeight / 2);

    this.container.scrollTo({
      top: targetScrollTop,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }

  public reset(): void {
    this.isUserScrolling = false;
    this.container.classList.remove('is-user-scrolling');
    this.currentActiveElement = null;
    if (this.userScrollTimeout) {
      clearTimeout(this.userScrollTimeout);
      this.userScrollTimeout = null;
    }
    this.container.scrollTo({ top: 0, behavior: 'auto' });
  }
}
