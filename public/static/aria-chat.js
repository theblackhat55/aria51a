// ARIA Chatbox - Minimal floating assistant using /api/ai/chat
(function () {
  const state = {
    open: false,
    sending: false
  };

  function ensureContainer() {
    if (document.getElementById('aria-chat-container')) return;

    const html = `
      <div id="aria-chat-container" style="position:fixed; bottom:20px; right:20px; z-index:9999;">
        <button id="aria-toggle" title="ARIA Assistant" style="background:#2563EB;color:#fff;border:none;border-radius:9999px;width:56px;height:56px;box-shadow:0 10px 15px rgba(0,0,0,0.1);display:flex;align-items:center;justify-content:center;cursor:pointer;">
          <i class="fas fa-robot"></i>
        </button>
        <div id="aria-panel" style="display:none; position:absolute; bottom:70px; right:0; width:360px; max-height:520px; background:#fff; border:1px solid #e5e7eb; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.15); overflow:hidden;">
          <div style="padding:12px 14px; background:linear-gradient(90deg,#1d4ed8,#2563eb); color:#fff; display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:8px;">
              <i class="fas fa-robot"></i>
              <strong>ARIA Assistant</strong>
            </div>
            <button id="aria-close" style="background:transparent;border:none;color:#fff;cursor:pointer"><i class="fas fa-times"></i></button>
          </div>
          <div id="aria-messages" style="padding:12px; height:360px; overflow:auto; background:#fafafa;"></div>
          <div style="border-top:1px solid #e5e7eb; padding:10px; background:#fff;">
            <form id="aria-form" style="display:flex; gap:8px;">
              <input id="aria-input" type="text" placeholder="Ask about risks, incidents, documents..." style="flex:1; padding:10px 12px; border:1px solid #d1d5db; border-radius:8px; font-size:14px;">
              <button id="aria-send" type="submit" style="background:#2563EB;color:#fff;border:none;border-radius:8px; padding:0 14px;">
                <i class="fas fa-paper-plane"></i>
              </button>
            </form>
            <div id="aria-hint" style="margin-top:6px; font-size:12px; color:#6b7280;">Results use local search only. Sources are shown when available.</div>
          </div>
        </div>
      </div>`;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);

    const toggle = document.getElementById('aria-toggle');
    const panel = document.getElementById('aria-panel');
    const closeBtn = document.getElementById('aria-close');
    const form = document.getElementById('aria-form');
    const input = document.getElementById('aria-input');

    toggle.addEventListener('click', () => {
      state.open = !state.open;
      panel.style.display = state.open ? 'block' : 'none';
      if (state.open) setTimeout(() => input.focus(), 50);
    });
    closeBtn.addEventListener('click', () => {
      state.open = false;
      panel.style.display = 'none';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = localStorage.getItem('aria_token');
      if (!token) {
        appendSystem("Please sign in to use ARIA.");
        return;
      }
      const text = input.value.trim();
      if (!text || state.sending) return;
      appendUser(text);
      input.value = '';
      state.sending = true;
      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ message: text })
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Request failed');
        appendAssistant(json.data.reply, json.data.sources || []);
      } catch (err) {
        appendSystem('Error: ' + err.message);
      } finally {
        state.sending = false;
      }
    });
  }

  function append(div) {
    const container = document.getElementById('aria-messages');
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function appendUser(text) {
    const el = document.createElement('div');
    el.style.margin = '8px 0';
    el.innerHTML = `<div style="display:flex; gap:8px; justify-content:flex-end;">
      <div style="max-width:80%; background:#DBEAFE; color:#1E40AF; padding:8px 10px; border-radius:12px;">${escapeHtml(text)}</div>
      <div style="width:24px; height:24px; background:#1E3A8A; color:#fff; border-radius:9999px; display:flex; align-items:center; justify-content:center; font-size:12px;">You</div>
    </div>`;
    append(el);
  }

  function appendAssistant(reply, sources) {
    const el = document.createElement('div');
    el.style.margin = '8px 0';
    const sourcesHtml = sources && sources.length ? (`<div style="margin-top:6px; font-size:12px; color:#374151;">
      <div style="font-weight:600; margin-bottom:4px;">Sources</div>
      <ul style="list-style:disc; padding-left:18px; max-height:120px; overflow:auto;">
        ${sources.map(s => `<li>[${s.type}] ${escapeHtml(s.title)} <span style="color:#6b7280;">(${escapeHtml(String(s.id))})</span></li>`).join('')}
      </ul>
    </div>`) : '';
    el.innerHTML = `<div style="display:flex; gap:8px;">
      <div style="width:24px; height:24px; background:#2563EB; color:#fff; border-radius:9999px; display:flex; align-items:center; justify-content:center; font-size:12px;"><i class="fas fa-robot"></i></div>
      <div style="max-width:80%; background:#F3F4F6; color:#111827; padding:8px 10px; border-radius:12px; white-space:pre-wrap;">${escapeHtml(reply)}${sourcesHtml}</div>
    </div>`;
    append(el);
  }

  function appendSystem(text) {
    const el = document.createElement('div');
    el.style.margin = '8px 0';
    el.innerHTML = `<div style="text-align:center; font-size:12px; color:#6b7280;">${escapeHtml(text)}</div>`;
    append(el);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function maybeAutoWelcome() {
    const token = localStorage.getItem('aria_token');
    if (!token) return;
    appendSystem('Hi, I\'m ARIA. Ask me about risks, incidents, or documents.');
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Only render if FontAwesome is available (already included in index)
    ensureContainer();
    maybeAutoWelcome();
  });
})();
