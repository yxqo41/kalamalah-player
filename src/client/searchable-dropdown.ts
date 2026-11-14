/**
 * Zero-dependency WAI-ARIA SearchableDropdown / Combobox Component in TypeScript.
 * Supports BOTH single-select and multi-select modes from the same class.
 */

export interface DropdownOption {
  value: string;
  label: string;
  group?: string;
  disabled?: boolean;
  searchText?: string;
}

export interface SearchableDropdownConfig {
  options: DropdownOption[];
  multiple?: boolean;
  searchable?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  initial?: string[];
  clearable?: boolean;
  showFooterHints?: boolean;
  onChange?: (values: string[]) => void;
}

let sdInstanceCounter = 0;

export class SearchableDropdown {
  private root: HTMLElement;
  private config: Required<SearchableDropdownConfig>;
  private selectedValues: Set<string>;
  private isOpen = false;
  private activeIndex = -1;
  private filteredIndices: number[] = [];
  private uid: string;

  // DOM References
  private triggerEl!: HTMLDivElement;
  private valueContainerEl!: HTMLDivElement;
  private clearBtnEl!: HTMLButtonElement;
  private chevronEl!: HTMLSpanElement;
  private panelEl!: HTMLDivElement;
  private searchInputEl!: HTMLInputElement;
  private listboxEl!: HTMLUListElement;
  private mirrorSelectEl!: HTMLSelectElement;

  // Bound event listeners for cleanup
  private boundOnDocumentPointerDown: (e: PointerEvent) => void;
  private boundOnTriggerKeyDown: (e: KeyboardEvent) => void;
  private boundOnTriggerClick: (e: MouseEvent) => void;
  private boundOnSearchInput: () => void;
  private boundOnSearchKeyDown: (e: KeyboardEvent) => void;

  constructor(rootElement: HTMLElement, options: SearchableDropdownConfig) {
    this.root = rootElement;
    this.uid = `sd-${++sdInstanceCounter}`;
    this.config = {
      options: options.options ?? [],
      multiple: Boolean(options.multiple),
      searchable: options.searchable ?? true,
      placeholder: options.placeholder ?? 'اختر...',
      searchPlaceholder: options.searchPlaceholder ?? 'ابحث...',
      initial: Array.isArray(options.initial) ? options.initial.map(String) : [],
      clearable: options.clearable ?? true,
      showFooterHints: options.showFooterHints ?? true,
      onChange: options.onChange ?? (() => {}),
    };

    this.selectedValues = new Set(
      this.config.multiple ? this.config.initial : this.config.initial.slice(0, 1)
    );

    this.boundOnDocumentPointerDown = this.handleDocumentPointerDown.bind(this);
    this.boundOnTriggerKeyDown = this.handleTriggerKeyDown.bind(this);
    this.boundOnTriggerClick = this.handleTriggerClick.bind(this);
    this.boundOnSearchInput = this.handleSearchInput.bind(this);
    this.boundOnSearchKeyDown = this.handleSearchKeyDown.bind(this);

    this.buildDOM();
    this.renderTriggerContent();
    this.renderOptionsList('');
    this.syncMirrorSelect();
  }

  private buildDOM(): void {
    this.root.classList.add('sd');
    this.root.innerHTML = '';

    const labelId = this.root.getAttribute('data-sd-label') || '';
    const listboxId = `${this.uid}-listbox`;

    // Hidden native <select> mirror for form submission compatibility
    this.mirrorSelectEl = document.createElement('select');
    this.mirrorSelectEl.className = 'sd-mirror-select';
    this.mirrorSelectEl.tabIndex = -1;
    this.mirrorSelectEl.setAttribute('aria-hidden', 'true');
    if (this.config.multiple) {
      this.mirrorSelectEl.multiple = true;
    }
    this.root.appendChild(this.mirrorSelectEl);

    // Trigger MUST be a <div role="combobox" tabindex="0">, NOT a <button>
    this.triggerEl = document.createElement('div');
    this.triggerEl.className = 'sd-trigger';
    this.triggerEl.setAttribute('role', 'combobox');
    this.triggerEl.setAttribute('tabindex', '0');
    this.triggerEl.setAttribute('aria-haspopup', 'listbox');
    this.triggerEl.setAttribute('aria-expanded', 'false');
    this.triggerEl.setAttribute('aria-controls', listboxId);
    if (labelId) {
      this.triggerEl.setAttribute('aria-labelledby', labelId);
    }

    this.valueContainerEl = document.createElement('div');
    this.valueContainerEl.className = 'sd-value-area';
    this.triggerEl.appendChild(this.valueContainerEl);

    const indicatorsEl = document.createElement('div');
    indicatorsEl.className = 'sd-indicators';

    this.clearBtnEl = document.createElement('button');
    this.clearBtnEl.type = 'button';
    this.clearBtnEl.className = 'sd-clear-btn hidden';
    this.clearBtnEl.setAttribute('aria-label', 'مسح الاختيار');
    this.clearBtnEl.textContent = '×';
    this.clearBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.clear();
      this.triggerEl.focus();
    });
    indicatorsEl.appendChild(this.clearBtnEl);

    this.chevronEl = document.createElement('span');
    this.chevronEl.className = 'sd-chevron';
    this.chevronEl.setAttribute('aria-hidden', 'true');
    this.chevronEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    indicatorsEl.appendChild(this.chevronEl);

    this.triggerEl.appendChild(indicatorsEl);
    this.root.appendChild(this.triggerEl);

    // Dropdown Panel
    this.panelEl = document.createElement('div');
    this.panelEl.className = 'sd-panel';
    this.panelEl.setAttribute('aria-hidden', 'true');

    // Search Header
    const searchWrap = document.createElement('div');
    searchWrap.className = this.config.searchable ? 'sd-search-wrap' : 'sd-search-wrap hidden';
    searchWrap.innerHTML = `<svg class="sd-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;

    this.searchInputEl = document.createElement('input');
    this.searchInputEl.type = 'text';
    this.searchInputEl.className = 'sd-search-input';
    this.searchInputEl.placeholder = this.config.searchPlaceholder;
    this.searchInputEl.setAttribute('autocomplete', 'off');
    this.searchInputEl.setAttribute('autocorrect', 'off');
    this.searchInputEl.setAttribute('autocapitalize', 'off');
    this.searchInputEl.setAttribute('spellcheck', 'false');
    this.searchInputEl.setAttribute('role', 'searchbox');
    this.searchInputEl.setAttribute('aria-autocomplete', 'list');
    this.searchInputEl.setAttribute('aria-controls', listboxId);
    searchWrap.appendChild(this.searchInputEl);
    this.panelEl.appendChild(searchWrap);

    // Options Listbox
    this.listboxEl = document.createElement('ul');
    this.listboxEl.id = listboxId;
    this.listboxEl.className = 'sd-listbox';
    this.listboxEl.setAttribute('role', 'listbox');
    this.listboxEl.setAttribute('aria-multiselectable', String(this.config.multiple));
    this.panelEl.appendChild(this.listboxEl);

    // Keyboard Hints Footer
    if (this.config.showFooterHints) {
      const footerEl = document.createElement('div');
      footerEl.className = 'sd-footer';
      footerEl.innerHTML = `
        <span><kbd>↑↓</kbd> تنقل</span>
        <span><kbd>↵</kbd> اختيار</span>
        <span><kbd>Esc</kbd> إغلاق</span>
      `;
      this.panelEl.appendChild(footerEl);
    }

    this.root.appendChild(this.panelEl);

    // Attach Event Listeners
    this.triggerEl.addEventListener('click', this.boundOnTriggerClick);
    this.triggerEl.addEventListener('keydown', this.boundOnTriggerKeyDown);
    this.searchInputEl.addEventListener('input', this.boundOnSearchInput);
    this.searchInputEl.addEventListener('keydown', this.boundOnSearchKeyDown);
    document.addEventListener('pointerdown', this.boundOnDocumentPointerDown);
  }

  private handleDocumentPointerDown(e: PointerEvent): void {
    if (!this.isOpen) return;
    const target = e.target as Node | null;
    if (target && !this.root.contains(target)) {
      this.close();
    }
  }

  private handleTriggerClick(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open('first');
    }
  }

  private handleTriggerKeyDown(e: KeyboardEvent): void {
    if (this.isOpen) return;
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.open('first');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.open('last');
    }
  }

  private handleSearchInput(): void {
    const query = this.searchInputEl.value;
    this.renderOptionsList(query);
    this.setActivePos(this.findFirstEnabledPos(0, 1), true);
  }

  private handleSearchKeyDown(e: KeyboardEvent): void {
    const count = this.filteredIndices.length;

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        if (count === 0) return;
        const nextPos = this.findNextEnabledPos(this.activeIndex, 1);
        this.setActivePos(nextPos, true);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        if (count === 0) return;
        const prevPos = this.findNextEnabledPos(this.activeIndex, -1);
        this.setActivePos(prevPos, true);
        break;
      }
      case 'Home': {
        e.preventDefault();
        if (count === 0) return;
        this.setActivePos(this.findFirstEnabledPos(0, 1), true);
        break;
      }
      case 'End': {
        e.preventDefault();
        if (count === 0) return;
        this.setActivePos(this.findFirstEnabledPos(count - 1, -1), true);
        break;
      }
      case 'PageDown': {
        e.preventDefault();
        if (count === 0) return;
        const target = Math.min(count - 1, Math.max(0, this.activeIndex) + 8);
        this.setActivePos(this.findFirstEnabledPos(target, 1), true);
        break;
      }
      case 'PageUp': {
        e.preventDefault();
        if (count === 0) return;
        const target = Math.max(0, (this.activeIndex < 0 ? 0 : this.activeIndex) - 8);
        this.setActivePos(this.findFirstEnabledPos(target, -1), true);
        break;
      }
      case 'Enter': {
        e.preventDefault();
        if (this.activeIndex >= 0 && this.activeIndex < count) {
          const optIdx = this.filteredIndices[this.activeIndex];
          if (optIdx !== undefined) {
            this.selectOptionByIndex(optIdx);
          }
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        e.stopPropagation();
        this.close();
        this.triggerEl.focus();
        break;
      }
      case 'Tab': {
        this.close();
        break;
      }
      case 'Backspace': {
        if (this.config.multiple && this.searchInputEl.value === '' && this.selectedValues.size > 0) {
          const arr = Array.from(this.selectedValues);
          const lastVal = arr[arr.length - 1];
          if (lastVal !== undefined) {
            this.selectedValues.delete(lastVal);
            this.onSelectionMutated();
          }
        }
        break;
      }
    }
  }

  private findFirstEnabledPos(startPos: number, dir: 1 | -1): number {
    const len = this.filteredIndices.length;
    if (len === 0) return -1;
    for (let i = 0; i < len; i++) {
      const pos = (startPos + i * dir + len) % len;
      const optIdx = this.filteredIndices[pos];
      if (optIdx !== undefined && !this.config.options[optIdx]?.disabled) {
        return pos;
      }
    }
    return -1;
  }

  private findNextEnabledPos(currentPos: number, dir: 1 | -1): number {
    const len = this.filteredIndices.length;
    if (len === 0) return -1;
    const base = currentPos < 0 ? (dir === 1 ? -1 : 0) : currentPos;
    for (let step = 1; step <= len; step++) {
      const pos = (base + step * dir + len) % len;
      const optIdx = this.filteredIndices[pos];
      if (optIdx !== undefined && !this.config.options[optIdx]?.disabled) {
        return pos;
      }
    }
    return -1;
  }

  private setActivePos(pos: number, scrollIntoView: boolean): void {
    this.activeIndex = pos;
    const optionEls = this.listboxEl.querySelectorAll<HTMLLIElement>('li.sd-option');
    let activeId = '';

    optionEls.forEach((li) => {
      const liPos = Number(li.getAttribute('data-filtered-pos'));
      if (liPos === pos) {
        li.classList.add('is-active');
        activeId = li.id;
        if (scrollIntoView) {
          li.scrollIntoView({ block: 'nearest' });
        }
      } else {
        li.classList.remove('is-active');
      }
    });

    if (activeId) {
      this.searchInputEl.setAttribute('aria-activedescendant', activeId);
    } else {
      this.searchInputEl.removeAttribute('aria-activedescendant');
    }
  }

  private highlightLabelHtml(label: string, query: string): string {
    const escapedLabel = this.escapeHtml(label);
    const trimmed = query.trim();
    if (!trimmed) return escapedLabel;

    const lowerLabel = label.toLowerCase();
    const lowerQ = trimmed.toLowerCase();
    const matchIdx = lowerLabel.indexOf(lowerQ);
    if (matchIdx === -1) return escapedLabel;

    const before = this.escapeHtml(label.slice(0, matchIdx));
    const match = this.escapeHtml(label.slice(matchIdx, matchIdx + trimmed.length));
    const after = this.escapeHtml(label.slice(matchIdx + trimmed.length));
    return `${before}<mark>${match}</mark>${after}`;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private renderOptionsList(query: string): void {
    const q = query.trim().toLowerCase();
    this.filteredIndices = [];
    this.listboxEl.innerHTML = '';

    // Group options while preserving order; filtering hides whole groups whose options are all filtered out
    const groupsMap = new Map<string, { opt: DropdownOption; originalIdx: number }[]>();

    this.config.options.forEach((opt, idx) => {
      const haystack = `${opt.label} ${opt.searchText ?? ''}`.toLowerCase();
      if (q && !haystack.includes(q)) return;
      const gKey = opt.group ?? '';
      const list = groupsMap.get(gKey) ?? [];
      list.push({ opt, originalIdx: idx });
      groupsMap.set(gKey, list);
    });

    if (groupsMap.size === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'sd-empty';
      emptyLi.setAttribute('role', 'presentation');
      emptyLi.textContent = 'No matches';
      this.listboxEl.appendChild(emptyLi);
      this.setActivePos(-1, false);
      return;
    }

    let currentFilteredPos = 0;

    for (const [groupName, items] of groupsMap.entries()) {
      if (items.length === 0) continue;

      if (groupName) {
        const groupLi = document.createElement('li');
        groupLi.className = 'sd-group-label';
        groupLi.setAttribute('role', 'presentation');
        groupLi.textContent = groupName;
        this.listboxEl.appendChild(groupLi);
      }

      for (const { opt, originalIdx } of items) {
        const pos = currentFilteredPos++;
        this.filteredIndices.push(originalIdx);

        const isSelected = this.selectedValues.has(opt.value);
        const li = document.createElement('li');
        li.id = `${this.uid}-opt-${originalIdx}`;
        li.className = `sd-option${isSelected ? ' is-selected' : ''}${opt.disabled ? ' is-disabled' : ''}`;
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', String(isSelected));
        if (opt.disabled) {
          li.setAttribute('aria-disabled', 'true');
        }
        li.setAttribute('data-filtered-pos', String(pos));
        li.setAttribute('data-opt-idx', String(originalIdx));

        li.innerHTML = `
          <span class="sd-check-slot" aria-hidden="true">
            ${
              isSelected
                ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
                : ''
            }
          </span>
          <span class="sd-option-label">${this.highlightLabelHtml(opt.label, query)}</span>
        `;

        if (!opt.disabled) {
          li.addEventListener('mousemove', () => {
            if (this.activeIndex !== pos) {
              this.setActivePos(pos, false);
            }
          });
          li.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectOptionByIndex(originalIdx);
          });
        }

        this.listboxEl.appendChild(li);
      }
    }
  }

  private renderTriggerContent(): void {
    this.valueContainerEl.innerHTML = '';
    const selectedOpts = this.config.options.filter((o) => this.selectedValues.has(o.value));

    if (selectedOpts.length === 0) {
      const placeholderSpan = document.createElement('span');
      placeholderSpan.className = 'sd-placeholder';
      placeholderSpan.textContent = this.config.placeholder;
      this.valueContainerEl.appendChild(placeholderSpan);
      this.clearBtnEl.classList.add('hidden');
      return;
    }

    if (this.config.clearable) {
      this.clearBtnEl.classList.remove('hidden');
    } else {
      this.clearBtnEl.classList.add('hidden');
    }

    if (!this.config.multiple) {
      const labelSpan = document.createElement('span');
      labelSpan.className = 'sd-single-label';
      labelSpan.textContent = selectedOpts[0]!.label;
      this.valueContainerEl.appendChild(labelSpan);
      return;
    }

    // Multi-select mode: removable pill chips
    const chipsWrap = document.createElement('div');
    chipsWrap.className = 'sd-chips';

    for (const opt of selectedOpts) {
      const chip = document.createElement('span');
      chip.className = 'sd-chip';

      const chipText = document.createElement('span');
      chipText.className = 'sd-chip-text';
      chipText.textContent = opt.label;
      chip.appendChild(chipText);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'sd-chip-remove';
      removeBtn.setAttribute('aria-label', `Remove ${opt.label}`);
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectedValues.delete(opt.value);
        this.onSelectionMutated();
      });

      chip.appendChild(removeBtn);
      chipsWrap.appendChild(chip);
    }

    this.valueContainerEl.appendChild(chipsWrap);
  }

  private selectOptionByIndex(optIdx: number): void {
    const opt = this.config.options[optIdx];
    if (!opt || opt.disabled) return;

    if (this.config.multiple) {
      if (this.selectedValues.has(opt.value)) {
        this.selectedValues.delete(opt.value);
      } else {
        this.selectedValues.add(opt.value);
      }
      this.onSelectionMutated();
      // Keep open in multi-select mode
      this.searchInputEl.focus();
    } else {
      this.selectedValues.clear();
      this.selectedValues.add(opt.value);
      this.onSelectionMutated();
      this.close();
      this.triggerEl.focus();
    }
  }

  private onSelectionMutated(): void {
    const currentPos = this.activeIndex;
    this.renderTriggerContent();
    this.renderOptionsList(this.searchInputEl.value);
    if (currentPos >= 0 && currentPos < this.filteredIndices.length) {
      this.setActivePos(currentPos, false);
    }
    this.syncMirrorSelect();

    const values = this.getValue();
    this.config.onChange(values);
    this.root.dispatchEvent(
      new CustomEvent('change', {
        bubbles: true,
        detail: { value: values },
      })
    );
  }

  private syncMirrorSelect(): void {
    this.mirrorSelectEl.innerHTML = '';
    for (const val of this.selectedValues) {
      const optionEl = document.createElement('option');
      optionEl.value = val;
      optionEl.selected = true;
      this.mirrorSelectEl.appendChild(optionEl);
    }
  }

  // =========================================================================
  // PUBLIC API METHODS
  // =========================================================================

  public getValue(): string[] {
    return Array.from(this.selectedValues);
  }

  public setValue(values: string[], emitEvent = false): void {
    const validSet = new Set(this.config.options.map((o) => o.value));
    const filtered = (Array.isArray(values) ? values : []).map(String).filter((v) => validSet.has(v));
    this.selectedValues = new Set(this.config.multiple ? filtered : filtered.slice(0, 1));
    this.renderTriggerContent();
    this.renderOptionsList(this.searchInputEl.value);
    this.syncMirrorSelect();
    if (emitEvent) {
      const out = this.getValue();
      this.config.onChange(out);
      this.root.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { value: out } }));
    }
  }

  public clear(): void {
    if (this.selectedValues.size === 0) return;
    this.selectedValues.clear();
    this.onSelectionMutated();
  }

  public open(initialActive: 'first' | 'last' = 'first'): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.root.classList.add('is-open');
    this.triggerEl.setAttribute('aria-expanded', 'true');
    this.panelEl.setAttribute('aria-hidden', 'false');

    this.searchInputEl.value = '';
    this.renderOptionsList('');

    // Auto-flip: open upward only when there isn't enough room below (no fixed position override)
    this.root.classList.remove('dropup');
    const triggerRect = this.triggerEl.getBoundingClientRect();
    const panelHeight = this.panelEl.offsetHeight;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    if (panelHeight + 12 > spaceBelow && spaceAbove > spaceBelow) {
      this.root.classList.add('dropup');
    }

    const count = this.filteredIndices.length;
    if (count > 0) {
      const startPos =
        initialActive === 'last'
          ? this.findFirstEnabledPos(count - 1, -1)
          : this.findFirstEnabledPos(0, 1);
      this.setActivePos(startPos, true);
    }

    requestAnimationFrame(() => {
      this.searchInputEl.focus();
    });
  }

  public close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.root.classList.remove('is-open');
    this.triggerEl.setAttribute('aria-expanded', 'false');
    this.panelEl.setAttribute('aria-hidden', 'true');

    // Reset filter when panel closes
    this.searchInputEl.value = '';
    this.renderOptionsList('');
    this.setActivePos(-1, false);
  }

  public refresh(newOptions: DropdownOption[]): void {
    this.config.options = Array.isArray(newOptions) ? newOptions : [];
    const valid = new Set(this.config.options.map((o) => o.value));
    for (const val of Array.from(this.selectedValues)) {
      if (!valid.has(val)) {
        this.selectedValues.delete(val);
      }
    }
    this.renderTriggerContent();
    this.renderOptionsList(this.searchInputEl.value);
    this.syncMirrorSelect();
  }

  public destroy(): void {
    document.removeEventListener('pointerdown', this.boundOnDocumentPointerDown);
    this.triggerEl.removeEventListener('click', this.boundOnTriggerClick);
    this.triggerEl.removeEventListener('keydown', this.boundOnTriggerKeyDown);
    this.searchInputEl.removeEventListener('input', this.boundOnSearchInput);
    this.searchInputEl.removeEventListener('keydown', this.boundOnSearchKeyDown);
    this.root.innerHTML = '';
    this.root.classList.remove('sd', 'is-open');
  }
}
