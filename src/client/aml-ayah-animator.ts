/**
 * 1:1 Port of LyricsFlow / Apple Music SyncedLyricsViewController Physics & Animation Engine
 * Ported directly from main/js/spring.js & main/js/lyrics-animator.js for Quran Ayahs & Words.
 */

import type { AyahTimingSegment } from '../server/timings-service';

const lineSpringSamples: [number, number][] = [
  [70.1839, 13.069],
  [120.332, 18.8406],
  [130.412, 19.8431],
  [137.937, 20.5664],
  [167.556, 23.2377],
  [170.301, 23.4728],
  [171.347, 23.5619],
];
const fastStiffness = lineSpringSamples[lineSpringSamples.length - 1]![0];
const slowStiffness = lineSpringSamples[0]![0];
const slowSpring = { stiffness: slowStiffness, damping: lineSpringSamples[0]![1], mass: 1 };
const maxFrameDelta = 1 / 30;
const snapGapMs = 800;
const longGapMs = 5000;

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

function dampingForStiffness(stiffness: number): number {
  for (let i = 1; i < lineSpringSamples.length; i += 1) {
    const [k1, c1] = lineSpringSamples[i]!;
    if (stiffness <= k1) {
      const [k0, c0] = lineSpringSamples[i - 1]!;
      return c0 + (c1 - c0) * ((stiffness - k0) / (k1 - k0));
    }
  }
  return lineSpringSamples[lineSpringSamples.length - 1]![1];
}

export function getPosYSpringPolicy(
  isSeeking: boolean,
  intervalMs?: number
): { stiffness: number; damping: number; mass: number } {
  if (isSeeking || intervalMs == null || !Number.isFinite(intervalMs)) {
    return slowSpring;
  }
  const blend = clamp01((intervalMs - snapGapMs) / (longGapMs - snapGapMs));
  const stiffness = fastStiffness + (slowStiffness - fastStiffness) * blend;
  return { stiffness, damping: dampingForStiffness(stiffness), mass: 1 };
}

/**
 * 1:1 Port of SpringValue from main/js/lyrics-animator.js (Apple Music CASpringAnimation solver with delay queue)
 */
export class SpringValue {
  public value: number;
  public target: number;
  public velocity = 0;
  public mass = slowSpring.mass;
  public stiffness = slowSpring.stiffness;
  public damping = slowSpring.damping;
  public queuedTarget: number | null = null;
  public queuedDelay = 0;
  private elapsed = 0;
  private delta = 0;
  private leftover = 0;
  private underdamped = false;
  private omega = 0;
  private frequency = 0;
  private decay = 0;

  constructor(value = 0) {
    this.value = value;
    this.target = value;
    this.resetSolver();
  }

  private resetSolver(): void {
    const delta = this.target - this.value;
    const velocity = this.velocity;
    const ratio = this.damping / (2 * Math.sqrt(this.stiffness * this.mass));

    this.delta = delta;
    this.elapsed = 0;

    if (ratio >= 1) {
      this.underdamped = false;
      this.omega = -Math.sqrt(this.stiffness / this.mass);
      this.leftover = -this.omega * delta - velocity;
      return;
    }

    const frequency = Math.sqrt(4 * this.mass * this.stiffness - this.damping * this.damping);
    this.underdamped = true;
    this.frequency = frequency / (2 * this.mass);
    this.decay = -this.damping / (2 * this.mass);
    this.leftover = (this.damping * delta - 2 * this.mass * velocity) / frequency;
  }

  public configure(stiffness: number, damping: number, mass = this.mass): void {
    if (stiffness === this.stiffness && damping === this.damping && mass === this.mass) {
      return;
    }
    this.stiffness = stiffness;
    this.damping = damping;
    this.mass = mass;
    this.resetSolver();
  }

  public jump(value: number): void {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.queuedTarget = null;
    this.queuedDelay = 0;
    this.resetSolver();
  }

  public moveTo(value: number, delay = 0): void {
    if (delay > 0) {
      this.queuedTarget = value;
      this.queuedDelay = delay;
      return;
    }
    this.queuedTarget = null;
    this.queuedDelay = 0;
    if (Math.abs(this.target - value) < 0.001) {
      return;
    }
    this.target = value;
    this.resetSolver();
  }

  public arrived(): boolean {
    return (
      this.queuedTarget === null &&
      Math.abs(this.target - this.value) < 0.05 &&
      Math.abs(this.velocity) < 0.05
    );
  }

  private advance(delta: number): void {
    this.elapsed += delta;
    const time = this.elapsed;

    if (!this.underdamped) {
      const decay = Math.exp(this.omega * time);
      this.value = this.target - (this.delta + time * this.leftover) * decay;
      this.velocity = -decay * (this.leftover + this.omega * (this.delta + time * this.leftover));
      return;
    }

    const decay = Math.exp(this.decay * time);
    const angle = this.frequency * time;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    this.value = this.target - decay * (this.delta * cosine + this.leftover * sine);
    this.velocity =
      -decay *
      ((this.decay * this.delta + this.frequency * this.leftover) * cosine +
        (this.decay * this.leftover - this.frequency * this.delta) * sine);
  }

  public update(delta: number): number {
    let step = Math.min(Math.max(delta, 0), maxFrameDelta);
    if (step <= 0) return this.value;

    if (this.queuedTarget !== null) {
      const waiting = Math.min(step, this.queuedDelay);
      if (waiting > 0) {
        this.advance(waiting);
        this.queuedDelay -= waiting;
        step -= waiting;
      }
      if (this.queuedDelay <= 0) {
        const target = this.queuedTarget;
        this.queuedTarget = null;
        this.queuedDelay = 0;
        if (Math.abs(this.target - target) >= 0.001) {
          this.target = target;
          this.resetSolver();
        }
        if (step > 0) {
          this.advance(step);
        }
      }
    } else {
      this.advance(step);
    }

    if (this.arrived()) {
      this.value = this.target;
      this.velocity = 0;
    }
    return this.value;
  }
}

// 1:1 Apple Music Word Rise Curve (mass 1, stiffness 14, damping 7 -> -3px peak over 2s)
const wordRisePeak = -3;
const wordRiseDurationMs = 2000;
const wordRiseFrames = 64;
let wordRiseOffsets: number[] | null = null;

function springPosition(time: number, frequency: number, damping: number): number {
  const omega = Math.sqrt(frequency * frequency - damping * damping);
  const decay = Math.exp(-damping * time);
  return decay * (Math.cos(omega * time) + (damping / omega) * Math.sin(omega * time));
}

export function wordRiseOffset(elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  if (!wordRiseOffsets) {
    const seconds = wordRiseDurationMs / 1000;
    const frequency = Math.sqrt(14);
    wordRiseOffsets = [];
    for (let frame = 0; frame <= wordRiseFrames; frame += 1) {
      const rise =
        frame === wordRiseFrames
          ? 1
          : 1 - springPosition((seconds * frame) / wordRiseFrames, frequency, 3.5);
      wordRiseOffsets.push(wordRisePeak * rise);
    }
  }
  const progress = Math.min(elapsedMs / wordRiseDurationMs, 1) * wordRiseFrames;
  const frame = Math.floor(progress);
  const next = Math.min(frame + 1, wordRiseFrames);
  const mix = progress - frame;
  return wordRiseOffsets[frame]! + (wordRiseOffsets[next]! - wordRiseOffsets[frame]!) * mix;
}

interface AnimatedWordRef {
  el: HTMLElement;
  wordIndex: number;
  startMs: number;
  endMs: number;
}

interface UniqueWordEntry {
  el: HTMLElement | null;
  rdEl: HTMLElement | undefined;
  segments: { startMs: number; endMs: number }[];
  lastProg: number;
  wordOffsetTop: number;
}

interface AnimatedAyahLine {
  ayahNumber: number;
  fullscreenEl: HTMLElement | null;
  readerEl: HTMLElement | null;
  startMs: number;
  endMs: number;
  naturalTop: number;
  naturalHeight: number;
  posYSpring: SpringValue;
  lastTyStr: string;
  lastBlurStr: string;
  lastScaleStr: string;
  lastStatus: string;
  nearViewport: boolean;
  uniqueWords: UniqueWordEntry[];
  readerWords: HTMLElement[];
}

const VIEWPORT_WINDOW_RADIUS = 7;

export class AmlAyahAnimator {
  private lines: AnimatedAyahLine[] = [];
  private activeAyahNumber = -1;
  private lastScrollIdx = -1;
  private lastIntraScrollPx = 0;
  private fullscreenContainer: HTMLElement | null = null;
  private userScrolling = false;
  private needsResumeScroll = false;
  private metricsDirty = true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener(
        'resize',
        () => {
          this.metricsDirty = true;
        },
        { passive: true }
      );
    }
  }

  public setUserScrolling(scrolling: boolean): void {
    if (this.userScrolling && !scrolling) {
      this.needsResumeScroll = true;
    }
    this.userScrolling = scrolling;
  }

  public bindTimings(
    timings: AyahTimingSegment[],
    fullscreenContainer: HTMLElement | null,
    readerContainer: HTMLElement | null
  ): void {
    this.lines = [];
    this.activeAyahNumber = -1;
    this.lastScrollIdx = -1;
    this.fullscreenContainer = fullscreenContainer;

    for (const seg of timings) {
      const fsEl =
        fullscreenContainer?.querySelector<HTMLElement>(`.aml-ayah-line[data-ayah="${seg.ayah}"]`) ??
        null;
      const rdEl =
        readerContainer?.querySelector<HTMLElement>(
          `#ayah-${seg.ayah}, .mushaf-inline-ayah[data-ayah="${seg.ayah}"], [id$="-${seg.ayah}"][data-ayah="${seg.ayah}"]`
        ) ?? null;

      const fsWordEls = fsEl
        ? Array.from(fsEl.querySelectorAll<HTMLElement>('.aml-word[data-word-idx]'))
        : [];
      const rdWordEls = rdEl
        ? Array.from(rdEl.querySelectorAll<HTMLElement>('.quran-word[data-word-idx]'))
        : [];

      const fsWordByIdx = new Map<number, HTMLElement>();
      for (const el of fsWordEls) {
        const idx = Number(el.getAttribute('data-word-idx'));
        if (!Number.isNaN(idx)) fsWordByIdx.set(idx, el);
      }

      const rdWordByIdx = new Map<number, HTMLElement>();
      for (const el of rdWordEls) {
        const idx = Number(el.getAttribute('data-word-idx'));
        if (!Number.isNaN(idx)) rdWordByIdx.set(idx, el);
      }

      const readerWordsArr: HTMLElement[] = [];
      for (const [idx, el] of rdWordByIdx.entries()) {
        readerWordsArr[idx] = el;
      }

      const hasExactWords = Boolean(seg.words && seg.words.length > 0);
      fsEl?.classList.toggle('line-sync-mode', !hasExactWords);
      rdEl?.classList.toggle('line-sync-mode', !hasExactWords);

      const uniqueWordsMap = new Map<number, UniqueWordEntry>();
      if (hasExactWords && (fsWordByIdx.size > 0 || rdWordByIdx.size > 0)) {
        for (const wSeg of seg.words!) {
          const fsWordEl = fsWordByIdx.get(wSeg.wordIndex) ?? null;
          const rdWordEl = readerWordsArr[wSeg.wordIndex];
          if (!fsWordEl && !rdWordEl) continue;
          if (rdWordEl) {
            rdWordEl.setAttribute('data-seek-ms', String(wSeg.startMs));
          }
          let entry = uniqueWordsMap.get(wSeg.wordIndex);
          if (!entry) {
            entry = {
              el: fsWordEl,
              rdEl: rdWordEl,
              segments: [],
              lastProg: -1,
              wordOffsetTop: 0,
            };
            uniqueWordsMap.set(wSeg.wordIndex, entry);
          }
          entry.segments.push({ startMs: wSeg.startMs, endMs: wSeg.endMs });
        }
      } else {
        // Pure Line-Sync Mode: clicking any word in the verse seeks to the start of the verse line
        for (const rdWordEl of rdWordEls) {
          rdWordEl.setAttribute('data-seek-ms', String(seg.startMs));
        }
      }

      this.lines.push({
        ayahNumber: seg.ayah,
        fullscreenEl: fsEl,
        readerEl: rdEl,
        startMs: seg.startMs,
        endMs: seg.endMs,
        naturalTop: 0,
        naturalHeight: 80,
        posYSpring: new SpringValue(0),
        lastTyStr: '',
        lastBlurStr: '',
        lastScaleStr: '',
        lastStatus: '',
        nearViewport: false,
        uniqueWords: Array.from(uniqueWordsMap.values()),
        readerWords: readerWordsArr,
      });
    }

    this.metricsDirty = true;
    if (this.lines.length > 0) {
      requestAnimationFrame(() => {
        this.cacheLineMetrics();
        this.setLineAnimTargets(0, true);
      });
    }
  }

  private cacheLineMetrics(): void {
    const scrollContainer = this.fullscreenContainer?.parentElement;
    if (!scrollContainer || scrollContainer.clientHeight <= 0) {
      this.metricsDirty = true;
      return;
    }
    // Batch all DOM geometry reads in a single pass with zero style writes
    let maxTop = 0;
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i]!;
      const el = line.fullscreenEl;
      if (!el) continue;
      line.naturalTop = el.offsetTop;
      line.naturalHeight = el.offsetHeight || 80;
      if (line.naturalTop > maxTop) maxTop = line.naturalTop;
      for (const uw of line.uniqueWords) {
        if (!uw.el) continue;
        uw.wordOffsetTop =
          uw.el.offsetParent === el
            ? uw.el.offsetTop
            : Math.max(0, uw.el.offsetTop - line.naturalTop);
      }
    }
    // If overlay was hidden (display:none), offsetTop is 0 for all lines; keep dirty until visible
    this.metricsDirty = this.lines.length > 1 && maxTop === 0;
  }

  /**
   * High-performance 60fps line target calculation:
   * - Zero layout thrashing (uses pre-cached naturalTop/naturalHeight)
   * - Instant snap when jumping back to top or across large distances
   * - Scopes blur & stagger springs to viewport-adjacent lines
   */
  public setLineAnimTargets(activeIndex: number, immediate = false, intraOffsetPx = 0): void {
    if (activeIndex < 0 || activeIndex >= this.lines.length) return;
    const container = this.fullscreenContainer?.parentElement;
    if (!container) return;

    if (this.metricsDirty || (this.lines[activeIndex]?.naturalTop === 0 && activeIndex > 0)) {
      this.cacheLineMetrics();
    }

    const activeLine = this.lines[activeIndex];
    const activeEl = activeLine?.fullscreenEl;
    if (!activeEl) return;

    const containerHeight = container.clientHeight || window.innerHeight;
    if (containerHeight <= 0) return;

    const indexDelta = this.lastScrollIdx !== -1 ? Math.abs(activeIndex - this.lastScrollIdx) : 0;
    const isBackwardJump = this.lastScrollIdx > 0 && activeIndex < this.lastScrollIdx;
    const isLargeJump = indexDelta > 2 || isBackwardJump;
    const shouldSnap = immediate || this.lastScrollIdx === -1 || isLargeJump;

    let intervalMs: number | undefined;
    if (activeIndex > 0) {
      const prev = this.lines[activeIndex - 1];
      if (prev && activeLine) {
        intervalMs = Math.max(0, activeLine.startMs - prev.startMs);
      }
    }

    const policy = getPosYSpringPolicy(shouldSnap, intervalMs);
    const isMobile = window.innerWidth <= 768;
    const maxIntra = Math.max(0, activeLine.naturalHeight - containerHeight * 0.42);
    const clampedIntra = Math.max(0, Math.min(maxIntra, intraOffsetPx));
    this.lastIntraScrollPx = clampedIntra;
    const targetTy = containerHeight * (isMobile ? 0.3 : 0.38) - (activeLine.naturalTop + clampedIntra);
    const ySnapStr = `${targetTy.toFixed(1)}px`;

    const stagger = !shouldSnap;
    const lineDelay = 0.04;
    let delay = 0;

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i]!;
      const el = line.fullscreenEl;
      if (!el) continue;

      const dist = Math.abs(i - activeIndex);
      const isNear = dist <= VIEWPORT_WINDOW_RADIUS;
      if (line.nearViewport !== isNear) {
        line.nearViewport = isNear;
        el.classList.toggle('is-near-viewport', isNear);
      }

      const scaleGoal = i === activeIndex ? 1.0 : 0.98;
      const scaleStr = scaleGoal.toFixed(3);
      if (line.lastScaleStr !== scaleStr) {
        el.style.setProperty('--line-scale', scaleStr);
        line.lastScaleStr = scaleStr;
      }

      if (shouldSnap || !isNear) {
        line.posYSpring.jump(targetTy);
        if (line.lastTyStr !== ySnapStr) {
          el.style.setProperty('--ty', ySnapStr);
          line.lastTyStr = ySnapStr;
        }
      } else {
        line.posYSpring.configure(policy.stiffness, policy.damping, policy.mass);
        line.posYSpring.moveTo(targetTy, delay);
        if (stagger) {
          const curTop = line.naturalTop + targetTy;
          if (curTop + line.naturalHeight >= -100 && curTop <= containerHeight + 200) {
            delay += lineDelay;
          }
        }
      }

      // Only compute blur for lines near the viewport
      let blurPx = 0;
      if (isNear && i !== activeIndex) {
        const distance = i < activeIndex ? dist + 1 : dist;
        const level = 1 + distance;
        const rawBlur = isMobile ? level * 0.8 : level;
        blurPx = Math.min(4.5, Math.max(1.2, rawBlur));
      }
      const blurStr = `${blurPx.toFixed(1)}px`;
      if (line.lastBlurStr !== blurStr) {
        el.style.setProperty('--blur-amount', blurStr);
        line.lastBlurStr = blurStr;
      }
    }
  }

  private updateIntraLineScroll(activeIndex: number, intraOffsetPx: number): void {
    const container = this.fullscreenContainer?.parentElement;
    const activeLine = this.lines[activeIndex];
    if (!container || !activeLine) return;
    const containerHeight = container.clientHeight || window.innerHeight;
    if (containerHeight <= 0) return;

    const isMobile = window.innerWidth <= 768;
    const maxIntra = Math.max(0, activeLine.naturalHeight - containerHeight * 0.42);
    const clampedIntra = Math.max(0, Math.min(maxIntra, intraOffsetPx));
    if (Math.abs(clampedIntra - this.lastIntraScrollPx) < 16) return;

    this.lastIntraScrollPx = clampedIntra;
    const targetTy =
      containerHeight * (isMobile ? 0.3 : 0.38) - (activeLine.naturalTop + clampedIntra);

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i]!;
      const el = line.fullscreenEl;
      if (!el) continue;
      if (Math.abs(i - activeIndex) <= VIEWPORT_WINDOW_RADIUS) {
        line.posYSpring.configure(slowSpring.stiffness, slowSpring.damping, slowSpring.mass);
        line.posYSpring.moveTo(targetTy, 0);
      } else {
        line.posYSpring.jump(targetTy);
        const yStr = `${targetTy.toFixed(1)}px`;
        if (line.lastTyStr !== yStr) {
          el.style.setProperty('--ty', yStr);
          line.lastTyStr = yStr;
        }
      }
    }
  }

  public forceAlignActiveLine(): void {
    this.cacheLineMetrics();
    const idx = this.lastScrollIdx >= 0 ? this.lastScrollIdx : 0;
    this.setLineAnimTargets(idx, true);
    this.lastScrollIdx = idx;
  }

  public animate(
    currentTimeMs: number,
    deltaTimeSec: number
  ): {
    activeAyah: number;
    activeFullscreenEl: HTMLElement | null;
    activeReaderEl: HTMLElement | null;
  } {
    let foundIdx = -1;
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i]!;
      if (currentTimeMs >= line.startMs && currentTimeMs <= line.endMs) {
        foundIdx = i;
        break;
      }
      // Keep active verse during short breath pauses (<1500ms) between consecutive verses
      const next = this.lines[i + 1];
      if (
        next &&
        currentTimeMs > line.endMs &&
        currentTimeMs < next.startMs &&
        next.startMs - line.endMs < 1500
      ) {
        foundIdx = i;
        break;
      }
    }

    // 380ms early scroll hand-off (from main/js/lyrics-animator.js)
    let scrollIdx = foundIdx;
    if (foundIdx !== -1 && foundIdx + 1 < this.lines.length) {
      const curLine = this.lines[foundIdx]!;
      const nextLine = this.lines[foundIdx + 1]!;
      const gap = nextLine.startMs - curLine.endMs;
      if (gap < 1000) {
        const leadThreshold = Math.min(nextLine.startMs - 380, curLine.endMs - 380);
        if (currentTimeMs >= leadThreshold) {
          scrollIdx = foundIdx + 1;
        }
      }
    }

    if (scrollIdx !== -1 && !this.userScrolling) {
      if (scrollIdx !== this.lastScrollIdx || this.needsResumeScroll) {
        this.lastIntraScrollPx = 0;
        this.setLineAnimTargets(scrollIdx, false, 0);
        this.lastScrollIdx = scrollIdx;
        this.needsResumeScroll = false;
      }
    }

    // Step --ty springs ONLY for lines that haven't arrived yet
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i]!;
      if (!line.fullscreenEl || line.posYSpring.arrived()) continue;
      const y = line.posYSpring.update(deltaTimeSec);
      const yStr = `${y.toFixed(1)}px`;
      if (line.lastTyStr !== yStr) {
        line.fullscreenEl.style.setProperty('--ty', yStr);
        line.lastTyStr = yStr;
      }
    }

    const activeLine = foundIdx !== -1 ? this.lines[foundIdx]! : null;
    this.activeAyahNumber = activeLine ? activeLine.ayahNumber : -1;

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i]!;
      const isCurrent = i === foundIdx;
      const isPast = foundIdx !== -1 ? i < foundIdx : currentTimeMs > line.endMs;
      const status = isCurrent ? 'Active' : isPast ? 'Sung' : 'NotSung';
      const statusChanged = line.lastStatus !== status;

      if (statusChanged) {
        if (line.fullscreenEl) {
          line.fullscreenEl.classList.remove('Active', 'Sung', 'NotSung', 'is-active', 'is-past');
          line.fullscreenEl.classList.add(status);
          if (isCurrent) line.fullscreenEl.classList.add('is-active');
          if (isPast) line.fullscreenEl.classList.add('is-past');
        }
        if (line.readerEl) {
          line.readerEl.classList.toggle('is-playing-ayah', isCurrent);
        }
        line.lastStatus = status;

        // If line just transitioned OUT of Active, clean up its word classes once
        if (!isCurrent) {
          for (const uw of line.uniqueWords) {
            uw.lastProg = isPast ? 1 : 0;
            if (uw.el) {
              uw.el.style.setProperty('--word-y', '0px');
              uw.el.classList.remove('is-word-active');
              uw.el.classList.toggle('is-word-spoken', isPast);
            }
            if (uw.rdEl) {
              uw.rdEl.classList.remove('is-word-active', 'is-word-spoken');
            }
          }
          if (line.uniqueWords.length === 0 && line.readerWords.length > 0) {
            for (const rw of line.readerWords) {
              if (rw) rw.classList.remove('is-word-active', 'is-word-spoken');
            }
          }
        }
      }

      // Only animate per-word gradients on the CURRENT active ayah (60fps zero-waste)
      if (isCurrent && line.uniqueWords.length > 0) {
        let activeWordOffsetTop = -1;
        for (const uw of line.uniqueWords) {
          let bestProg = 0;
          let bestElapsed = 0;
          for (const seg of uw.segments) {
            const wDur = Math.max(60, seg.endMs - seg.startMs);
            const p = Math.max(0, Math.min(1, (currentTimeMs - seg.startMs) / wDur));
            const elap = currentTimeMs - seg.startMs;
            if ((p > 0 && p < 1) || (bestProg === 0 && p > 0)) {
              bestProg = p;
              bestElapsed = elap;
            }
          }
          if (bestProg > 0 && uw.wordOffsetTop >= 0) {
            activeWordOffsetTop = uw.wordOffsetTop;
          }

          if (Math.abs(uw.lastProg - bestProg) > 0.004 || (bestProg > 0 && bestElapsed < wordRiseDurationMs)) {
            uw.lastProg = bestProg;
            const gp = -20 + 120 * bestProg;
            const riseY = wordRiseOffset(bestElapsed);
            const isSpeaking = bestProg > 0 && bestProg < 1;
            const isSpoken = bestProg >= 1;
            if (uw.el) {
              uw.el.style.setProperty('--gradient-position', `${gp.toFixed(1)}%`);
              uw.el.style.setProperty('--word-y', `${riseY.toFixed(2)}px`);
              uw.el.classList.toggle('is-word-active', isSpeaking);
              uw.el.classList.toggle('is-word-spoken', isSpoken);
            }
            if (uw.rdEl) {
              uw.rdEl.classList.toggle('is-word-active', isSpeaking);
              uw.rdEl.classList.toggle('is-word-spoken', isSpoken);
            }
          }
        }

        if (!this.userScrolling && scrollIdx === i && activeWordOffsetTop > 0) {
          const ch = this.fullscreenContainer?.parentElement?.clientHeight || window.innerHeight;
          if (line.naturalHeight > ch * 0.28 && activeWordOffsetTop > ch * 0.14) {
            this.updateIntraLineScroll(i, Math.max(0, activeWordOffsetTop - ch * 0.08));
          }
        }
      } else if (isCurrent && line.uniqueWords.length === 0 && !this.userScrolling && scrollIdx === i) {
        const ch = this.fullscreenContainer?.parentElement?.clientHeight || window.innerHeight;
        if (line.naturalHeight > ch * 0.34) {
          const dur = Math.max(1000, line.endMs - line.startMs);
          const prog = Math.max(0, Math.min(1, (currentTimeMs - line.startMs) / dur));
          if (prog > 0.12) {
            const desired = ((prog - 0.12) / 0.88) * Math.max(0, line.naturalHeight - ch * 0.38);
            this.updateIntraLineScroll(i, desired);
          }
        }
      }
    }

    return {
      activeAyah: this.activeAyahNumber,
      activeFullscreenEl: activeLine?.fullscreenEl ?? null,
      activeReaderEl: activeLine?.readerEl ?? null,
    };
  }
}
