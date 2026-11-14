import { escapeHtml, getActiveLocale, isRtlLocale } from './i18n';
import { postAiChatApi } from './static-api';

export interface AiMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface AiChatThread {
  id: string;
  title: string;
  updatedAt: number;
  messages: AiMessage[];
}

const AI_CHATS_STORAGE_KEY = 'kalamalah_ai_chats_v1';
const AI_ACTIVE_CHAT_KEY = 'kalamalah_ai_active_chat_v1';

export function formatAiResponseToHtml(rawText: string): HTMLDivElement {
  const container = document.createElement('div');
  const esc = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const formatInline = (s: string) =>
    esc(s)
      .replace(/`([^`]+)`/g, '<code class="ai-md-code">$1</code>')
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="ai-chat-link">$1</a>'
      )
      .replace(
        /(^|[^"'>=])((https?:\/\/[^\s<]+))/g,
        '$1<a href="$2" target="_blank" rel="noopener noreferrer" class="ai-chat-link">$2</a>'
      )
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*\n]+)\*/g, '<em>$1</em>');

  const normalized = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\s+(#{1,4}\s+)/g, '\n\n$1')
    .replace(/\s+>\s+(?=["'\u0600-\u06FF])/g, '\n> ')
    .replace(/(#{1,4}\s+[^\n-]+?)\s+-\s+/g, '$1\n- ')
    .replace(/([.?!:"'\u061F])\s+-\s+/g, '$1\n- ');

  const lines = normalized.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!.trim();
    if (!line) {
      i++;
      continue;
    }

    const headingMatch = /^(#{1,4})\s+(.+)$/.exec(line);
    if (headingMatch) {
      const level = headingMatch[1]!.length <= 2 ? 'h3' : 'h4';
      const h = document.createElement(level);
      h.className = 'ai-md-heading';
      h.innerHTML = formatInline(headingMatch[2]!);
      container.appendChild(h);
      i++;
      continue;
    }

    if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i]!.trim().startsWith('>')) {
        quoteLines.push(lines[i]!.trim().replace(/^>\s*/, ''));
        i++;
      }
      const bq = document.createElement('blockquote');
      bq.className = 'ai-md-quote';
      bq.innerHTML = quoteLines.map(formatInline).join('<br />');
      container.appendChild(bq);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const ul = document.createElement('ul');
      ul.className = 'ai-md-list';
      while (i < lines.length && /^[-*]\s+/.test(lines[i]!.trim())) {
        const li = document.createElement('li');
        li.innerHTML = formatInline(lines[i]!.trim().replace(/^[-*]\s+/, ''));
        ul.appendChild(li);
        i++;
      }
      container.appendChild(ul);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const ol = document.createElement('ol');
      ol.className = 'ai-md-list';
      while (i < lines.length && /^\d+\.\s+/.test(lines[i]!.trim())) {
        const li = document.createElement('li');
        li.innerHTML = formatInline(lines[i]!.trim().replace(/^\d+\.\s+/, ''));
        ol.appendChild(li);
        i++;
      }
      container.appendChild(ol);
      continue;
    }

    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i]!.trim() &&
      !/^(#{1,4}\s+|>\s*|[-*]\s+|\d+\.\s+)/.test(lines[i]!.trim())
    ) {
      paraLines.push(lines[i]!.trim());
      i++;
    }
    const p = document.createElement('p');
    p.innerHTML = paraLines.map(formatInline).join('<br />');
    container.appendChild(p);
  }

  if (!container.hasChildNodes()) {
    const p = document.createElement('p');
    p.textContent = rawText;
    container.appendChild(p);
  }
  return container;
}

export function loadSavedAiChats(): AiChatThread[] {
  try {
    const raw = localStorage.getItem(AI_CHATS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAiChats(threads: AiChatThread[]): void {
  try {
    localStorage.setItem(AI_CHATS_STORAGE_KEY, JSON.stringify(threads.slice(0, 30)));
  } catch {}
}

export function createNewAiThread(): AiChatThread {
  const isRtl = isRtlLocale(getActiveLocale());
  return {
    id: `klm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: isRtl ? 'محادثة جديدة' : 'New Chat',
    updatedAt: Date.now(),
    messages: [
      {
        role: 'assistant',
        text: isRtl
          ? 'السلام عليكم ورحمة الله! كيف يمكنني مساعدتك اليوم في القرآن الكريم، التفسير، التجويد، أو الأدعية؟'
          : "Assalamu Alaikum! I'm here to help with Quranic meanings, Tafseer, Tajweed, and Duas. How can I assist you?",
      },
    ],
  };
}

export function initFloatingAiWidget(): void {
  const fabBtn = document.getElementById('ai-fab-btn');
  const panel = document.getElementById('ai-widget-panel');
  const closeBtn = document.getElementById('ai-widget-close-btn');
  const newBtn = document.getElementById('ai-widget-new-btn');
  const historyBtn = document.getElementById('ai-widget-history-btn');
  const historyView = document.getElementById('ai-widget-history-view');
  const chatView = document.getElementById('ai-widget-chat-view');
  const messagesEl = document.getElementById('ai-widget-messages');
  const formEl = document.getElementById('ai-widget-form') as HTMLFormElement | null;
  const inputEl = document.getElementById('ai-widget-input') as HTMLInputElement | null;

  if (!fabBtn || !panel || !messagesEl || !formEl || !inputEl) return;

  let threads = loadSavedAiChats();
  let activeId = localStorage.getItem(AI_ACTIVE_CHAT_KEY) || '';
  let activeThread = threads.find((t) => t.id === activeId);
  if (!activeThread) {
    activeThread = createNewAiThread();
    threads.unshift(activeThread);
    saveAiChats(threads);
    localStorage.setItem(AI_ACTIVE_CHAT_KEY, activeThread.id);
  }

  let showingHistory = false;

  const persistCurrent = () => {
    const idx = threads.findIndex((t) => t.id === activeThread!.id);
    if (idx !== -1) threads[idx] = activeThread!;
    else threads.unshift(activeThread!);
    threads.sort((a, b) => b.updatedAt - a.updatedAt);
    saveAiChats(threads);
    try {
      localStorage.setItem(AI_ACTIVE_CHAT_KEY, activeThread!.id);
    } catch {}
  };

  const renderMessages = () => {
    messagesEl.innerHTML = '';
    for (const msg of activeThread!.messages) {
      const row = document.createElement('div');
      row.className = `ai-msg-row ${msg.role}`;
      const bubble = document.createElement('div');
      bubble.className = 'ai-msg-bubble';
      if (msg.role === 'assistant') {
        bubble.appendChild(formatAiResponseToHtml(msg.text));
      } else {
        const p = document.createElement('p');
        p.textContent = msg.text;
        bubble.appendChild(p);
      }
      row.appendChild(bubble);
      messagesEl.appendChild(row);
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
  };

  const renderHistory = () => {
    if (!historyView) return;
    const isRtl = isRtlLocale(getActiveLocale());
    if (threads.length === 0) {
      historyView.innerHTML = `<p class="ai-history-empty">${isRtl ? 'لا توجد محادثات محفوظة بعد.' : 'No saved chats yet.'}</p>`;
      return;
    }

    historyView.innerHTML = `
      <div class="ai-history-header">
        <strong>${isRtl ? 'المحادثات المحفوظة' : 'Saved Chats'}</strong>
        <span>${threads.length}</span>
      </div>
      <div class="ai-history-list">
        ${threads
          .map((t) => {
            const isActive = t.id === activeThread?.id;
            const dateStr = new Date(t.updatedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            });
            return `<div class="ai-history-item ${isActive ? 'active' : ''}" data-open-thread="${escapeHtml(t.id)}">
              <div class="ai-hi-meta">
                <strong class="ai-hi-title">${escapeHtml(t.title)}</strong>
                <span class="ai-hi-sub">${t.messages.length} msgs · ${escapeHtml(dateStr)}</span>
              </div>
              <button type="button" class="ai-hi-del" data-del-thread="${escapeHtml(t.id)}" title="Delete" aria-label="Delete chat">×</button>
            </div>`;
          })
          .join('\n')}
      </div>
    `;

    historyView.querySelectorAll<HTMLElement>('[data-open-thread]').forEach((el) => {
      el.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('[data-del-thread]')) return;
        const id = el.getAttribute('data-open-thread') || '';
        const found = threads.find((t) => t.id === id);
        if (found) {
          activeThread = found;
          localStorage.setItem(AI_ACTIVE_CHAT_KEY, found.id);
          setHistoryMode(false);
          renderMessages();
        }
      });
    });

    historyView.querySelectorAll<HTMLElement>('[data-del-thread]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-del-thread') || '';
        threads = threads.filter((t) => t.id !== id);
        if (activeThread?.id === id) {
          activeThread = threads[0] ?? createNewAiThread();
          if (!threads.length) threads.push(activeThread);
        }
        saveAiChats(threads);
        renderHistory();
        renderMessages();
      });
    });
  };

  const setHistoryMode = (show: boolean) => {
    showingHistory = show;
    historyView?.classList.toggle('hidden', !show);
    chatView?.classList.toggle('hidden', show);
    historyBtn?.classList.toggle('active', show);
    if (show) renderHistory();
  };

  const openPanel = () => {
    panel.classList.remove('hidden');
    requestAnimationFrame(() => panel.classList.add('is-open'));
    fabBtn.setAttribute('aria-expanded', 'true');
    fabBtn.classList.add('is-active');
    renderMessages();
    setTimeout(() => inputEl.focus(), 140);
  };

  const closePanel = () => {
    panel.classList.remove('is-open');
    fabBtn.setAttribute('aria-expanded', 'false');
    fabBtn.classList.remove('is-active');
    setTimeout(() => {
      if (!panel.classList.contains('is-open')) panel.classList.add('hidden');
    }, 220);
  };

  fabBtn.addEventListener('click', () => {
    if (panel.classList.contains('hidden')) openPanel();
    else closePanel();
  });

  closeBtn?.addEventListener('click', closePanel);

  historyBtn?.addEventListener('click', () => {
    setHistoryMode(!showingHistory);
  });

  newBtn?.addEventListener('click', () => {
    activeThread = createNewAiThread();
    threads.unshift(activeThread);
    persistCurrent();
    setHistoryMode(false);
    renderMessages();
    inputEl.focus();
  });

  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = inputEl.value.trim();
    if (!q || !activeThread) return;
    inputEl.value = '';

    if (activeThread.messages.length <= 1) {
      activeThread.title = q.length > 44 ? `${q.slice(0, 44)}…` : q;
    }
    activeThread.messages.push({ role: 'user', text: q });
    activeThread.updatedAt = Date.now();
    persistCurrent();
    renderMessages();

    const loadingRow = document.createElement('div');
    loadingRow.className = 'ai-msg-row assistant is-loading';
    loadingRow.innerHTML = `<div class="ai-msg-bubble"><p>...</p></div>`;
    messagesEl.appendChild(loadingRow);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    try {
      const res = await postAiChatApi(q, activeThread.id);
      loadingRow.remove();
      const reply = res?.reply || 'Sorry, I could not get a response right now.';
      activeThread.messages.push({ role: 'assistant', text: reply });
      activeThread.updatedAt = Date.now();
      persistCurrent();
      renderMessages();
    } catch {
      loadingRow.remove();
      activeThread.messages.push({
        role: 'assistant',
        text: 'Unable to reach the AI service right now. Please try again.',
      });
      persistCurrent();
      renderMessages();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.classList.contains('hidden')) {
      closePanel();
    }
  });

  const localizeWidgetLabels = () => {
    const isRtl = isRtlLocale(getActiveLocale());
    const tEl = document.getElementById('ai-widget-title');
    const subEl = document.getElementById('ai-widget-sub');
    if (tEl) tEl.textContent = isRtl ? 'المساعد القرآني الذكي' : 'Kalamalah AI';
    if (subEl) subEl.textContent = isRtl ? 'القرآن والتفسير والأدعية' : 'Quran, Tafseer & Duas';
    inputEl.placeholder = isRtl
      ? 'اسأل عن القرآن أو التفسير أو الأدعية...'
      : 'Ask about Quran, Tafseer, or Duas...';
  };
  localizeWidgetLabels();
  window.addEventListener('kalamalah:locale-changed', localizeWidgetLabels);
}
