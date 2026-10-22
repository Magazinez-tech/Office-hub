/* Office Hub: ส่วนแอป (แถบแอป, ป้ายในห้อง, แผงแต่ละบริการ, การเชื่อมต่อแบบจำลอง)
   ฉาก 3D อยู่ใน scene.js และเปิด API ไว้ที่ window.OfficeScene */
(() => {
  'use strict';
  const D = window.HUB_DATA;
  const noop = () => {};
  const S = window.OfficeScene || {
    on: noop, say: noop, focus: noop, setViewShift: noop, screenPos: () => null, getLook: () => ({ gender: 'girl' }),
    setKidLine: noop, setPhoneUnread: noop, playVideo: noop, videoProgress: () => 0, celebrate: noop
  };

  /* ---------- small helpers ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const svc = id => D.services.find(s => s.id === id);
  const isBoy = () => S.getLook().gender === 'boy';
  const e = () => (isBoy() ? 'ครับ' : 'ค่ะ');
  const na = () => (isBoy() ? 'นะครับ' : 'นะคะ');
  const hhmm = (d = new Date()) => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  const wide = () => window.innerWidth > 720;

  const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const I = {
    gmail: svg('<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>'),
    onedrive: svg('<path d="M7 18h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9.1 4.5 4.5 0 0 0 7 18Z"/>'),
    line: svg('<path d="M12 4c4.97 0 9 3.13 9 7s-4.03 7-9 7c-.8 0-1.57-.08-2.3-.23L5 20l.9-3.6C4.1 15.1 3 13.15 3 11c0-3.87 4.03-7 9-7Z"/>'),
    news: svg('<path d="M4 5h13v14H6a2 2 0 0 1-2-2z"/><path d="M17 9h3v8a2 2 0 0 1-2 2"/><path d="M7.5 8.5h6M7.5 12h6M7.5 15.5h4"/>'),
    youtube: svg('<rect x="3" y="5.5" width="18" height="13" rx="4"/><path d="m10.5 9.5 4 2.5-4 2.5z" fill="currentColor"/>'),
    plug: svg('<path d="M9 3v4M15 3v4M7 7h10v3a5 5 0 0 1-10 0zM12 15v6"/>'),
    back: svg('<path d="m15 5-7 7 7 7"/>'),
    send: svg('<path d="M4 12 20 4l-6 16-3-7z"/>'),
    pen: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),
    attach: svg('<path d="M20 11.5 12 19.5a5 5 0 0 1-7-7l8-8a3.5 3.5 0 0 1 5 5l-8 8a2 2 0 0 1-3-3l7.5-7.5"/>'),
    search: svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>'),
    upload: svg('<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>'),
    folder: svg('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
    stop: svg('<rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor"/>'),
    play: svg('<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>'),
    group: svg('<circle cx="9" cy="9" r="3"/><circle cx="16.5" cy="10" r="2.5"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M14 19a4 4 0 0 1 7 0"/>'),
    check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
    tv: svg('<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>'),
    list: svg('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>')
  };
  const OVERVIEW = 'overview';

  /* ---------- state (connections and read flags are remembered per browser) ---------- */
  const KEY = 'office-hub-state';
  const state = { connected: { gmail: true, onedrive: false, line: true, news: true, youtube: true }, read: [], chatsRead: [], videosSeen: false };
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s) { Object.assign(state.connected, s.connected || {}); state.read = s.read || []; state.chatsRead = s.chatsRead || []; state.videosSeen = !!s.videosSeen; }
  } catch (err) { /* storage unavailable: use defaults */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (err) { /* ignore */ } };

  /* ---------- demo data vs real accounts ---------- */
  const AUTH = window.HubAuth || { enabled: false, user: () => null, onChange() {}, token: () => null, displayName: () => '' };
  const LIVEAPI = window.HubLive || null;
  const clone = o => JSON.parse(JSON.stringify(o));
  const initialOf = s => (String(s || '').match(/[A-Za-z0-9ก-ฮ]/) || ['?'])[0].toUpperCase();
  // ids are compared as strings everywhere (Gmail and YouTube ids are strings)
  D.emails.forEach(m => { m.id = String(m.id); });
  D.news.forEach(n => { n.id = String(n.id); });
  const DEMO = clone({ emails: D.emails, files: D.files, videos: D.videos });
  const isLive = () => AUTH.enabled && !!AUTH.user();
  const PROVIDER = { gmail: 'google', youtube: 'google', onedrive: 'azure' };
  const PROVIDER_NAME = { google: 'Google', azure: 'Microsoft' };
  // Is a service on? Real accounts when signed in, the simulated switch otherwise. News is always real.
  function isOn(id) {
    if (id === 'news') return true;
    if (!isLive()) return !!state.connected[id];
    if (PROVIDER[id]) return !!AUTH.token(PROVIDER[id]);
    return true; // LINE stays as example data
  }
  const ON = new Proxy({}, { get: (_, id) => isOn(id) });
  const LIVE = {}; // per service: { status: 'loading' | 'ready' | 'error' | 'auth', loaded, error }
  const realData = id => (id === 'news' ? NEWS.live : isLive() && !!(LIVE[id] && LIVE[id].loaded));

  async function loadLive(id, force) {
    if (!isLive() || !PROVIDER[id] || !isOn(id) || !LIVEAPI) return;
    const prev = LIVE[id];
    if (prev && prev.status === 'loading') return;
    if (prev && prev.status === 'ready' && !force) return;
    LIVE[id] = { status: 'loading', loaded: !!(prev && prev.loaded) };
    try {
      if (id === 'gmail') D.emails = await LIVEAPI.gmail.list();
      else if (id === 'youtube') D.videos = await LIVEAPI.youtube.list();
      else if (id === 'onedrive') D.files = await LIVEAPI.onedrive.summary();
      LIVE[id] = { status: 'ready', loaded: true };
    } catch (err) {
      LIVE[id] = err && err.needsAuth ? { status: 'auth' } : { status: 'error', error: String((err && err.message) || err) };
    }
    if (!isLive()) return;
    refreshCounts();
    if (current === id || current === OVERVIEW) renderDrawer();
  }
  async function ensureBody(id) {
    const m = D.emails.find(x => x.id === id);
    if (!m || !m.live || m.body != null || m.loadingBody || !LIVEAPI) return;
    m.loadingBody = true;
    try { Object.assign(m, await LIVEAPI.gmail.body(id)); }
    catch (err) { m.body = 'โหลดเนื้อหาอีเมลไม่สำเร็จ: ' + (err.needsAuth ? 'ต้องเชื่อม Google ใหม่' : err.message); }
    m.loadingBody = false;
    if (current === 'gmail' && view.gmail.open === id) renderDrawer();
  }
  const markRead = id => { if (!state.read.includes(id)) { state.read.push(id); save(); } };

  /* real news (our /api/news function) + real weather (Open-Meteo); demo data stays as the fallback */
  const NEWS_CATS = [['all', 'ล่าสุด', '#ff7fa3'], ['tech', 'เทคโนโลยี', '#4f95ff'], ['business', 'ธุรกิจ', '#ffb84d'], ['sports', 'กีฬา', '#2fc46b'], ['ent', 'บันเทิง', '#9b7bff']];
  const NEWS = { live: false, failed: false, byCat: {}, loading: {} };
  async function loadNews(cat) {
    if (!LIVEAPI || NEWS.byCat[cat] || NEWS.loading[cat]) return;
    NEWS.loading[cat] = true;
    try {
      const label = (NEWS_CATS.find(c => c[0] === cat) || NEWS_CATS[0])[1];
      const items = await LIVEAPI.news.list(cat);
      items.forEach(n => { n.cat = label; });
      NEWS.byCat[cat] = items; NEWS.live = true;
      if (cat === 'all') D.news = items;
    } catch (err) { if (!NEWS.live) NEWS.failed = true; }
    NEWS.loading[cat] = false;
    refreshCounts();
    if (current === 'news' || current === OVERVIEW) renderDrawer();
  }

  let current = null;
  const view = { gmail: {}, onedrive: {}, line: {}, news: {}, youtube: {} };

  const isUnread = m => m.unread && !state.read.includes(m.id);
  const chatUnread = c => (state.chatsRead.includes(c.id) ? 0 : c.unread);
  function counts() {
    const c = ON;
    return {
      gmail: c.gmail ? D.emails.filter(isUnread).length : 0,
      onedrive: 0,
      line: c.line ? D.chats.reduce((a, ch) => a + chatUnread(ch), 0) : 0,
      news: D.news.filter(n => n.fresh).length,
      youtube: c.youtube && !state.videosSeen ? D.videos.filter(v => v.isNew).length : 0
    };
  }
  function summaryText(id, n) {
    if (!ON[id]) return `${svc(id).name} ยังไม่เชื่อมต่อ`;
    return {
      gmail: `อีเมลใหม่ <b>${n}</b>`,
      onedrive: `ไฟล์ล่าสุด <b>${D.files.recent.length}</b>`,
      line: `แชทใหม่ <b>${n}</b>`,
      news: `ข่าวใหม่ <b>${n}</b>`,
      youtube: n ? `วิดีโอใหม่ <b>${n}</b>` : 'วิดีโอ'
    }[id];
  }

  /* ---------- header: greeting, date, summary ---------- */
  const hour = new Date().getHours();
  const greet = hour < 5 ? 'ดึกแล้วนะ' : hour < 12 ? 'สวัสดีตอนเช้า' : hour < 17 ? 'สวัสดีตอนบ่าย' : hour < 21 ? 'สวัสดีตอนเย็น' : 'ดึกแล้วนะ';
  $('#greet').textContent = greet;
  $('#today').textContent = new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' });

  const summary = $('#summary');
  D.services.forEach(s => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'sum'; b.dataset.id = s.id; b.style.setProperty('--c', s.color);
    b.addEventListener('click', () => openService(s.id));
    summary.appendChild(b);
  });

  /* ---------- dock ---------- */
  const dock = $('#dock');
  D.services.forEach(s => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'dock-btn'; b.dataset.id = s.id; b.style.setProperty('--c', s.color);
    b.innerHTML = `<span class="ic">${I[s.id]}<span class="badge" hidden></span></span><span class="txt">${esc(s.name)}</span>`;
    b.addEventListener('click', () => (current === s.id ? closeDrawer() : openService(s.id)));
    dock.appendChild(b);
  });

  /* ---------- pins floating over room objects ---------- */
  const pinsBox = $('#pins');
  const pins = {};
  D.services.forEach(s => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pin'; b.dataset.id = s.id; b.style.setProperty('--c', s.color);
    b.innerHTML = `<span class="ic">${I[s.id]}<span class="badge" hidden></span></span><span class="name">${esc(s.name)} · ${esc(s.object)}</span>`;
    b.setAttribute('aria-label', `เปิด ${s.name} (${s.object})`);
    b.addEventListener('click', () => openService(s.id));
    pinsBox.appendChild(b);
    pins[s.id] = b;
  });
  S.on('frame', () => {
    const hideAll = !wide() && current;
    D.services.forEach(s => {
      const el = pins[s.id], p = !hideAll && S.screenPos(s.id);
      if (!p || !p.visible) { el.style.visibility = 'hidden'; return; }
      el.style.visibility = '';
      el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -100%)`;
    });
    if (current === 'youtube' && view.youtube.playing) {
      const f = $('#vprog'); if (f) f.style.width = (S.videoProgress() * 100).toFixed(1) + '%';
    }
  });
  S.on('hover', who => D.services.forEach(s => pins[s.id].classList.toggle('hot', s.id === who)));
  S.on('pick', id => { if (svc(id)) openService(id); });
  S.on('reset', () => { if (current) closeDrawer(true); });

  /* ---------- counts everywhere ---------- */
  function refreshCounts() {
    const n = counts();
    D.services.forEach(s => {
      const on = ON[s.id];
      const sum = summary.querySelector(`[data-id="${s.id}"]`);
      sum.innerHTML = `<span class="dot">${I[s.id]}</span><span>${summaryText(s.id, n[s.id])}</span>`;
      sum.classList.toggle('off', !on);
      const label = `${s.name}${!on ? ' (ยังไม่เชื่อมต่อ)' : n[s.id] ? ` (${n[s.id]} รายการใหม่)` : ''}`;
      [dock.querySelector(`[data-id="${s.id}"]`), pins[s.id]].forEach(el => {
        el.classList.toggle('off', !on);
        el.classList.toggle('active', current === s.id);
        const badge = el.querySelector('.badge');
        badge.hidden = !n[s.id]; badge.textContent = n[s.id] > 99 ? '99+' : n[s.id];
      });
      dock.querySelector(`[data-id="${s.id}"]`).setAttribute('aria-current', String(current === s.id));
      dock.querySelector(`[data-id="${s.id}"]`).setAttribute('aria-label', `เปิด ${label}`);
      pins[s.id].setAttribute('aria-label', `เปิด ${label} ที่${s.object}`);
    });
    S.setPhoneUnread(n.line);
    // the tab title tells people and browser assistants what is open and what is new
    const fresh = n.gmail + n.line;
    const panel = current === OVERVIEW ? 'ภาพรวมวันนี้' : current ? svc(current).name : '';
    document.title = `${fresh ? `(${fresh}) ` : ''}${panel ? panel + ' · ' : ''}Office Hub`;
    updateDigest();
  }

  /* ---------- text digest of everything (overview panel + always-present hidden copy) ---------- */
  const digestEl = $('#digest');
  function digestHTML(interactive) {
    const n = counts(), on = ON;
    const act = (arg, label, what) => interactive
      ? `<button class="btn small" type="button" data-act="jump" data-arg="${esc(arg)}" aria-label="${esc(label + ': ' + what)}">${esc(label)}</button>` : '';
    const head = (id, info) => `<h3><span class="dot" style="--c:${svc(id).color}">${I[id]}</span>${esc(svc(id).name)}<span class="state">${on[id] ? esc(info) : 'ยังไม่เชื่อมต่อ'}</span></h3>`;
    const off = id => `<p>ยังไม่ได้เชื่อมต่อ ${esc(svc(id).name)} ${act(id, 'เปิดแผง ' + svc(id).name, 'เพื่อเชื่อมต่อ')}</p>`;
    const sec = (id, info, inner) => `<section style="--c:${svc(id).color}" aria-label="${esc(svc(id).name)}">${head(id, info)}${on[id] ? inner : off(id)}</section>`;
    const f = D.files, w = D.weather;
    return [
      sec('gmail', `ยังไม่อ่าน ${n.gmail} ฉบับ`, `<ul>${D.emails.map(m => `
        <li><span>${isUnread(m) ? '<span class="new-flag">ยังไม่อ่าน · </span>' : ''}<b>${esc(m.subject)}</b>
          <span class="sub">จาก ${esc(m.from)} (${esc(m.addr)}) · ${esc(m.time)} · ${esc(m.label)}${m.attach ? ' · มีไฟล์แนบ ' + esc(m.attach) : ''}</span>
          <span class="sub">${esc(m.snippet)}</span></span>${act('gmail:' + m.id, 'เปิดอีเมล', m.subject)}</li>`).join('')}</ul>`),
      sec('line', `แชทใหม่ ${n.line} ข้อความ`, `<ul>${D.chats.map(c => `
        <li><span><b>${esc(c.name)}</b>${chatUnread(c) ? ` <span class="new-flag">ใหม่ ${chatUnread(c)}</span>` : ''}
          <span class="sub">${c.group ? `กลุ่ม ${c.members} คน · ` : c.official ? 'บัญชีทางการ · ' : ''}ล่าสุด ${esc(c.time)}</span>
          ${c.messages.slice(-3).map(m => `<span class="sub">${m.me ? 'คุณ' : esc(m.who || c.name)}: ${esc(m.text)}</span>`).join('')}</span>${act('line:' + c.id, 'เปิดแชท', c.name)}</li>`).join('')}</ul>`),
      sec('onedrive', `ใช้ไป ${f.usedGB} จาก ${f.totalGB} GB`, `
        <p>โฟลเดอร์: ${f.folders.map(x => `${esc(x.name)} (${x.count})`).join(', ')}</p>
        <ul>${f.recent.map(x => `<li><span><b>${esc(x.name)}</b><span class="sub">แก้ไข ${esc(x.mod)} · ${esc(x.size)}</span></span>${act('onedrive:' + x.name, 'เปิดไฟล์', x.name)}</li>`).join('')}</ul>`),
      sec('news', `ข่าวใหม่ ${n.news} เรื่อง`, `
        <p>อากาศ${esc(w.city)} ${w.temp}°C ${esc(w.sky)} · ${esc(w.note)}</p>
        <ul>${D.news.map(x => `<li><span>${x.fresh ? '<span class="new-flag">ใหม่ · </span>' : ''}<b>${esc(x.title)}</b>
          <span class="sub">${esc(x.cat)} · ${esc(x.time)} · ${esc(x.source || 'ข่าวตัวอย่าง')}</span></span>${act('news:' + x.id, 'อ่านสรุป', x.title)}</li>`).join('')}</ul>`),
      sec('youtube', `วิดีโอใหม่ ${D.videos.filter(v => v.isNew).length} คลิป`, `<ul>${D.videos.map(v => `
        <li><span>${v.isNew ? '<span class="new-flag">ใหม่ · </span>' : ''}<b>${esc(v.title)}</b>
          <span class="sub">${[v.channel, v.dur && 'ยาว ' + v.dur, v.views, v.ago].filter(Boolean).map(esc).join(' · ')}${v.watched ? ` · ดูไปแล้ว ${Math.round(v.watched * 100)}%` : ''}${view.youtube.playing === v.id ? ' · กำลังเล่นบนทีวี' : ''}</span></span>${act('youtube:' + v.id, 'เล่นบนทีวี', v.title)}</li>`).join('')}</ul>`)
    ].join('');
  }
  function updateDigest() {
    if (current === OVERVIEW) { digestEl.innerHTML = ''; return; }
    const now = new Date();
    digestEl.innerHTML = `<h2>สรุปข้อมูลทั้งหมดใน Office Hub · ${esc(now.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' }))} ${hhmm(now)} น.</h2>
      <p>${isLive() ? 'อีเมล ไฟล์ และวิดีโอมาจากบัญชีของคุณ (ที่เชื่อมแล้ว) ข่าวและอากาศเป็นข้อมูลจริง แชท LINE เป็นข้อมูลตัวอย่าง' : 'ข่าวและอากาศเป็นข้อมูลจริง ส่วนอีเมล ไฟล์ แชท และวิดีโอเป็นข้อมูลตัวอย่างจนกว่าจะเข้าสู่ระบบ'} · กดปุ่ม "ภาพรวม" ด้านบนเพื่อดูรายการนี้พร้อมปุ่มเปิดแต่ละรายการ</p>
      <div class="digest">${digestHTML(false)}</div>`;
  }

  /* ---------- what the character says ---------- */
  function lineFor(id) {
    const n = counts(), s = svc(id);
    if (!ON[id]) return `ยังไม่ได้เชื่อม ${s.name} เลย${e()} กดเชื่อมต่อได้เลย${na()}`;
    return {
      gmail: n.gmail ? `มีอีเมลยังไม่อ่าน ${n.gmail} ฉบับ${e()}` : `อ่านอีเมลครบแล้ว เก่งมาก${e()}`,
      onedrive: `ไฟล์งานล่าสุดอยู่บนชั้นนี้${e()}`,
      line: n.line ? `มีแชทใหม่ ${n.line} ข้อความ${e()}` : `ไม่มีแชทค้างแล้ว${e()}`,
      news: `สรุปข่าววันนี้มาให้แล้ว${e()}`,
      youtube: `เลือกวิดีโอ แล้วดูบนทีวีได้เลย${e()}`
    }[id];
  }
  S.setKidLine(() => {
    const n = counts();
    return `วันนี้มีอีเมลใหม่ ${n.gmail} ฉบับ แชท ${n.line} ข้อความ${e()}`;
  });

  /* ---------- drawer ---------- */
  const drawer = $('#drawer'), body = $('#drawerBody');
  function openService(id) {
    const isOverview = id === OVERVIEW;
    if (!isOverview && !svc(id)) return;
    if (!$('#closet').hidden) $('#closetClose').click();
    closeModal();
    const fresh = current !== id;
    const said = isOverview ? `สรุปทุกอย่างเป็นข้อความไว้ให้แล้ว${e()}` : lineFor(id);
    current = id;
    if (id === 'youtube' && isOn('youtube') && !state.videosSeen) { state.videosSeen = true; save(); }
    drawer.style.setProperty('--c', isOverview ? 'var(--accent)' : svc(id).color);
    drawer.hidden = false;
    document.body.classList.add('drawer-open');
    $('#btnOverview').setAttribute('aria-pressed', String(isOverview));
    renderDrawer(true);
    refreshCounts();
    S.focus(isOverview ? null : id);
    requestAnimationFrame(updateShift);
    setHash(id);
    if (fresh) { S.say(said); drawer.focus({ preventScroll: true }); }
  }

  /* links like office-hub/#gmail open a panel directly (handy for bookmarks and browser assistants) */
  function setHash(id) {
    try {
      if (id) { if (location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id); }
      else if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    } catch (err) { /* some embedded views block history changes */ }
  }
  function fromHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (h === current) return;
    if (h === OVERVIEW || svc(h)) openService(h);
    else if (!h && current) closeDrawer();
  }
  window.addEventListener('hashchange', fromHash);
  $('#btnOverview').addEventListener('click', () => (current === OVERVIEW ? closeDrawer() : openService(OVERVIEW)));
  function closeDrawer(keepCamera) {
    if (!current) return;
    const was = current;
    current = null;
    drawer.hidden = true;
    document.body.classList.remove('drawer-open');
    if (!keepCamera) S.focus(null);
    requestAnimationFrame(updateShift);
    $('#btnOverview').setAttribute('aria-pressed', 'false');
    setHash(null);
    refreshCounts();
    const btn = dock.querySelector(`[data-id="${was}"]`);
    if (btn && drawer.contains(document.activeElement)) btn.focus({ preventScroll: true });
  }
  function updateShift() {
    if (!current) {
      if (wide()) { S.setViewShift(0, 0); return; }
      // phones: centre the room in the space between the header and the dock
      const headBottom = $('.hub-head').getBoundingClientRect().bottom;
      const dockSpace = window.innerHeight - dock.getBoundingClientRect().top;
      S.setViewShift(0, -(headBottom - dockSpace) / 2);
      return;
    }
    if (wide()) S.setViewShift((drawer.offsetWidth + 16) / 2, 0);
    else S.setViewShift(0, drawer.offsetHeight / 2);
  }
  $('#drawerClose').addEventListener('click', () => closeDrawer());
  window.addEventListener('resize', updateShift);

  function renderDrawer(resetScroll) {
    if (current === OVERVIEW) {
      $('#drawerIcon').innerHTML = I.list;
      $('#drawerTitle').textContent = 'ภาพรวมวันนี้';
      const st = $('#drawerStatus');
      st.textContent = 'ทุกบริการในหน้าเดียว · แบบข้อความ'; st.classList.add('on');
      body.innerHTML = `
        <p class="note">หน้านี้รวมทุกอย่างเป็นข้อความ อ่านง่ายทั้งสำหรับคุณและ Claude in Chrome ลองสั่งในแผง Claude ว่า "สรุปอีเมลที่ยังไม่อ่าน" หรือ "เปิดแชทกลุ่มทีมออกแบบแล้วร่างคำตอบ"</p>
        <div class="digest">${digestHTML(true)}</div>`;
      if (resetScroll) body.scrollTop = 0;
      return;
    }
    const s = svc(current), on = isOn(current);
    if (on && isLive() && PROVIDER[current] && !LIVE[current]) loadLive(current);
    const L = LIVE[current];
    $('#drawerIcon').innerHTML = I[current];
    $('#drawerTitle').textContent = s.name;
    const st = $('#drawerStatus');
    st.textContent = !on ? (isLive() && PROVIDER[current] ? 'ต้องเชื่อมต่อบัญชี' : 'ยังไม่เชื่อมต่อ')
      : realData(current) ? 'ข้อมูลจริง' + (L && L.status === 'loading' ? ' · กำลังอัปเดต…' : '')
      : (L && L.status === 'loading' ? 'กำลังโหลด…' : 'ข้อมูลตัวอย่าง');
    st.classList.toggle('on', on);
    if (!on) body.innerHTML = connectEmpty(s);
    else if (isLive() && PROVIDER[current] && L && L.status === 'loading' && !L.loaded) body.innerHTML = loadingHTML(s);
    else if (isLive() && PROVIDER[current] && L && L.status === 'error') body.innerHTML = errorHTML(s, L.error);
    else body.innerHTML = noteFor(current) + R[current](view[current]);
    if (resetScroll) body.scrollTop = 0;
    if (current === 'line' && view.line.open) body.scrollTop = body.scrollHeight;
    updateDigest();
  }

  const connectEmpty = s => {
    const p = AUTH.enabled && PROVIDER[s.id];
    return `
    <div class="connect-empty">
      <span class="big">${I[s.id]}</span>
      <h3>เชื่อมต่อ ${esc(s.name)}</h3>
      <p>${esc(s.desc)}</p>
      <button class="btn primary" type="button" data-act="connect" data-arg="${s.id}">${I.plug} ${p ? 'เชื่อมต่อด้วย ' + PROVIDER_NAME[p] : 'เชื่อมต่อ ' + esc(s.name)}</button>
    </div>
    <p class="note">${p
      ? `จะพาไปหน้าขออนุญาตของ ${esc(s.provider)} แล้วกลับมาที่ห้องนี้ เราไม่เห็นรหัสผ่านของคุณ และยกเลิกสิทธิ์ได้ทุกเมื่อในบัญชี ${esc(s.provider)}`
      : `ปุ่มนี้จำลองการเชื่อมต่อเท่านั้น (ข้อมูลตัวอย่าง)`}</p>`;
  };
  const loadingHTML = s => `<div class="loading" aria-busy="true"><p class="hint">กำลังโหลดจาก ${esc(s.name)}…</p><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div></div>`;
  const errorHTML = (s, msg) => `
    <div class="connect-empty">
      <span class="big">${I[s.id]}</span>
      <h3>โหลดจาก ${esc(s.name)} ไม่สำเร็จ</h3>
      <p>${esc(msg)}</p>
      <button class="btn primary" type="button" data-act="reload" data-arg="${s.id}">ลองอีกครั้ง</button>
    </div>`;
  function noteFor(id) {
    if (!AUTH.enabled) return '';
    if (id === 'line') return '<p class="note">LINE ไม่เปิดให้แอปอื่นอ่านแชทส่วนตัว แผงนี้จึงเป็นข้อมูลตัวอย่าง</p>';
    if (!isLive() && PROVIDER[id]) return '<p class="note">กำลังแสดงข้อมูลตัวอย่าง <button class="linkish" type="button" data-act="login">เข้าสู่ระบบ</button> เพื่อดูของจริงจากบัญชีของคุณ</p>';
    return '';
  }

  /* ---------- renderers for each service ---------- */
  const R = {};

  R.gmail = v => {
    if (v.compose) {
      const d = v.draft || {};
      return `
        <form class="compose" data-submit="sendMail">
          <button class="btn ghost" type="button" data-act="composeCancel">${I.back} ยกเลิก</button>
          <label class="field"><span>ถึง</span><input id="mailTo" name="to" type="email" required placeholder="name@example.com" value="${esc(d.to || '')}"></label>
          <label class="field"><span>เรื่อง</span><input id="mailSubject" name="subject" value="${esc(d.subject || '')}"></label>
          <label class="field"><span>ข้อความ</span><textarea id="mailBody" name="body" rows="7">${esc(d.body || '')}</textarea></label>
          <div class="toolbar-row"><button class="btn primary" type="submit">${I.send} ส่ง</button><span class="hint">${isLive() && isOn('gmail') ? 'จะส่งจาก Gmail ของคุณจริง' : 'ยังไม่ส่งจริง เพราะเป็นข้อมูลตัวอย่าง'}</span></div>
        </form>`;
    }
    if (v.open) {
      const m = D.emails.find(x => x.id === v.open);
      if (!m) { v.open = null; return R.gmail(v); }
      return `
        <button class="btn ghost" type="button" data-act="mailBack" style="align-self:flex-start">${I.back} กล่องจดหมาย</button>
        <article class="mail">
          <h3>${esc(m.subject)}</h3>
          <div class="mail-from">
            <span class="avatar" style="--av:${m.color}">${esc(m.initial)}</span>
            <span class="row-main"><span class="row-title">${esc(m.from)}</span><span class="row-sub">${esc(m.addr)} · ${esc(m.time)}</span></span>
            <span class="label">${esc(m.label)}</span>
          </div>
          <p class="mail-body">${esc(m.body == null ? 'กำลังโหลดเนื้อหา…' : m.body)}</p>
          ${m.attach ? `<button class="attach" type="button" data-act="fileOpen" data-arg="${esc(m.attach)}">${I.attach} ${esc(m.attach)}</button>` : ''}
          <div class="toolbar-row">
            <button class="btn primary" type="button" data-act="reply" data-arg="${m.id}">ตอบกลับ</button>
            <button class="btn" type="button" data-act="forward" data-arg="${m.id}">ส่งต่อ</button>
          </div>
        </article>`;
    }
    const tab = v.tab || 'all';
    const list = D.emails.filter(m => tab === 'all' || isUnread(m));
    return `
      <div class="toolbar-row">
        <div class="opts">
          <button class="opt" type="button" data-act="mailTab" data-arg="all" aria-pressed="${tab === 'all'}">ทั้งหมด</button>
          <button class="opt" type="button" data-act="mailTab" data-arg="unread" aria-pressed="${tab === 'unread'}">ยังไม่อ่าน (${counts().gmail})</button>
        </div>
        <button class="btn primary push" type="button" data-act="compose">${I.pen} เขียนอีเมล</button>
      </div>
      <div class="list">${list.map(m => `
        <button class="row-btn ${isUnread(m) ? 'unread' : ''}" type="button" data-act="mailOpen" data-arg="${m.id}">
          <span class="avatar" style="--av:${m.color}">${esc(m.initial)}</span>
          <span class="row-main">
            <span class="row-title">${esc(m.from)}</span>
            <span class="row-sub strong">${esc(m.subject)}</span>
            <span class="row-sub">${esc(m.snippet)}</span>
          </span>
          <span class="meta">${esc(m.time)}${isUnread(m) ? '<span class="udot" aria-label="ยังไม่อ่าน"></span>' : ''}<span class="label">${esc(m.label)}</span></span>
        </button>`).join('') || '<p class="empty">อ่านอีเมลครบหมดแล้ว</p>'}
      </div>`;
  };

  const FT = { doc: ['DOC', '#4f95ff'], xls: ['XLS', '#2fb47a'], ppt: ['PPT', '#ff8a5c'], pdf: ['PDF', '#ff5c6c'], img: ['IMG', '#9b7bff'], other: ['FILE', '#8c8fa8'] };
  const openTag = (url, cls, act, arg) => url
    ? `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">`
    : `<button class="${cls}" type="button" data-act="${act}" data-arg="${esc(arg)}">`;
  const closeTag = url => (url ? '</a>' : '</button>');
  const fileRows = q => {
    const list = D.files.recent.filter(f => !q || f.name.toLowerCase().includes(q.toLowerCase()));
    return list.map(f => `
      ${openTag(f.url, 'row-btn', 'fileOpen', f.name)}
        <span class="ftype" style="--fc:${(FT[f.type] || FT.other)[1]}">${(FT[f.type] || FT.other)[0]}</span>
        <span class="row-main"><span class="row-title">${esc(f.name)}</span><span class="row-sub">${[f.mod && 'แก้ไข ' + f.mod, f.size].filter(Boolean).map(esc).join(' · ')}</span></span>
        <span class="meta"></span>
      ${closeTag(f.url)}`).join('') || '<p class="empty">ไม่พบไฟล์ที่ค้นหา</p>';
  };
  R.onedrive = v => {
    const f = D.files, pct = f.totalGB ? Math.round(f.usedGB / f.totalGB * 100) : 0;
    return `
      <div class="storage">
        <div class="toolbar-row"><b>พื้นที่ที่ใช้</b><span class="hint push">${f.usedGB} GB จาก ${f.totalGB} GB (${pct}%)</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      </div>
      <div class="toolbar-row">
        <label class="search">${I.search}<input id="fileSearch" type="search" placeholder="ค้นหาไฟล์" value="${esc(v.q || '')}" aria-label="ค้นหาไฟล์"></label>
        ${f.live ? `<a class="btn primary" href="https://onedrive.live.com/" target="_blank" rel="noopener noreferrer">${I.upload} เปิด OneDrive</a>` : `<button class="btn primary" type="button" data-act="upload">${I.upload} อัปโหลด</button>`}
      </div>
      <h3 class="section-title">โฟลเดอร์</h3>
      <div class="tiles">${f.folders.map(x => `
        ${openTag(x.url, 'tile', 'folderOpen', x.name)}
          <span class="fold" style="--fc:${x.color}">${I.folder}</span>
          <span class="row-main"><span class="row-title">${esc(x.name)}</span><span class="row-sub">${x.count} รายการ</span></span>
        ${closeTag(x.url)}`).join('') || '<p class="empty">ยังไม่มีโฟลเดอร์</p>'}
      </div>
      <h3 class="section-title">ไฟล์ล่าสุด</h3>
      <div class="list" id="fileList">${fileRows(v.q)}</div>`;
  };

  const lastMsg = c => c.messages[c.messages.length - 1];
  R.line = v => {
    if (v.open) {
      const c = D.chats.find(x => x.id === v.open);
      return `
        <div class="chat-head">
          <button class="x" type="button" data-act="chatBack" aria-label="กลับไปรายการแชท">${I.back}</button>
          <span class="avatar" style="--av:${c.color}">${c.group ? I.group : esc(c.initial)}</span>
          <span class="row-main"><span class="row-title">${esc(c.name)}</span><span class="row-sub">${c.group ? `กลุ่ม · ${c.members} คน` : c.official ? 'บัญชีทางการ' : 'แชทส่วนตัว'}</span></span>
        </div>
        <div class="thread" id="thread">${c.messages.map(m => `
          <div class="msg ${m.me ? 'me' : ''}">
            ${!m.me && m.who ? `<span class="who">${esc(m.who)}</span>` : ''}
            <span class="text">${esc(m.text)}</span>
            <span class="t">${esc(m.time || '')}</span>
          </div>`).join('')}
        </div>
        <form class="composer" data-submit="sendChat">
          <input id="chatInput" name="msg" placeholder="พิมพ์ข้อความ" autocomplete="off" aria-label="ข้อความ">
          <button class="send" type="submit" aria-label="ส่งข้อความ">${I.send}</button>
        </form>`;
    }
    return `
      <div class="list">${D.chats.map(c => {
        const n = chatUnread(c), m = lastMsg(c);
        return `
        <button class="row-btn ${n ? 'unread' : ''}" type="button" data-act="chatOpen" data-arg="${c.id}">
          <span class="avatar" style="--av:${c.color}">${c.group ? I.group : esc(c.initial)}</span>
          <span class="row-main">
            <span class="row-title">${esc(c.name)}${c.official ? '<span class="official">ทางการ</span>' : ''}</span>
            <span class="row-sub">${m.me ? 'คุณ: ' : m.who ? esc(m.who) + ': ' : ''}${esc(m.text)}</span>
          </span>
          <span class="meta">${esc(c.time)}${n ? `<span class="count">${n}</span>` : ''}</span>
        </button>`;
      }).join('')}
      </div>`;
  };

  const weatherHTML = w => `
      <div class="weather">
        <span class="temp">${w.temp}°</span>
        <span class="row-main"><span class="row-title">${esc(w.city)} · ${esc(w.sky)}</span><span class="row-sub">${esc(w.note)}</span>${w.live ? '<span class="live-tag">ข้อมูลจริง</span>' : ''}</span>
      </div>`;
  R.news = v => {
    if (!LIVEAPI || (NEWS.failed && !NEWS.live)) return demoNews(v);
    const cat = NEWS_CATS.some(c => c[0] === v.cat) ? v.cat : 'all';
    if (!NEWS.byCat[cat]) loadNews(cat);
    const list = NEWS.byCat[cat];
    const color = (NEWS_CATS.find(c => c[0] === cat) || NEWS_CATS[0])[2];
    return `${weatherHTML(D.weather)}
      <div class="opts">${NEWS_CATS.map(([k, label]) => `<button class="opt" type="button" data-act="newsCat" data-arg="${k}" aria-pressed="${k === cat}">${label}</button>`).join('')}</div>
      ${!list ? '<div class="loading" aria-busy="true"><div class="skel"></div><div class="skel"></div><div class="skel"></div></div>' : `
      <div class="list news-list">${list.map(n => `
        <a class="news-card" href="${esc(n.link)}" target="_blank" rel="noopener noreferrer" style="--nc:${color}">
          <span class="stripe"></span>
          <span class="news-main">
            <span class="news-cat">${esc(n.source)}${n.fresh ? ' · ใหม่' : ''}</span>
            <span class="news-title">${esc(n.title)}</span>
            <span class="news-meta">${esc(n.time)} · เปิดอ่านในแท็บใหม่</span>
          </span>
        </a>`).join('') || '<p class="empty">ยังไม่มีข่าวในหมวดนี้</p>'}
      </div>`}
      <p class="note">ข่าวจริงภาษาไทยจาก Google News กดหัวข้อเพื่ออ่านจากสำนักข่าวต้นทาง</p>`;
  };
  const demoNews = v => {
    const cat = v.cat || 'ทั้งหมด';
    const cats = ['ทั้งหมด', ...Object.keys(D.newsCats)];
    const list = D.news.filter(n => cat === 'ทั้งหมด' || n.cat === cat);
    return `${weatherHTML(D.weather)}
      <div class="opts">${cats.map(c => `<button class="opt" type="button" data-act="newsCat" data-arg="${esc(c)}" aria-pressed="${c === cat}">${esc(c)}</button>`).join('')}</div>
      <div class="list news-list">${list.map(n => {
        const open = v.open === n.id;
        return `
        <button class="news-card" type="button" data-act="newsOpen" data-arg="${n.id}" aria-expanded="${open}" style="--nc:${D.newsCats[n.cat]}">
          <span class="stripe"></span>
          <span class="news-main">
            <span class="news-cat">${esc(n.cat)}${n.fresh ? ' · ใหม่' : ''}</span>
            <span class="news-title">${esc(n.title)}</span>
            ${open ? `<span class="news-sum">${esc(n.summary)}</span>` : ''}
            <span class="news-meta">ข่าวตัวอย่าง · ${esc(n.time)}</span>
          </span>
        </button>`;
      }).join('')}
      </div>
      <p class="note">หัวข้อข่าวทั้งหมดเป็นข้อมูลสมมติสำหรับ mockup เวอร์ชันจริงจะดึงจาก RSS หรือ News API ของสำนักข่าวที่คุณเลือก</p>`;
  };

  const vcard = (vd, playing) => `
    <button class="vcard ${playing ? 'playing' : ''}" type="button" data-act="videoPlay" data-arg="${vd.id}">
      <span class="thumb" style="--c1:${vd.colors[0]};--c2:${vd.colors[1]}">
        ${vd.thumb ? `<img src="${esc(vd.thumb)}" alt="" loading="lazy">` : ''}
        <span class="play">${I.play}</span>
        ${vd.isNew ? '<span class="new">ใหม่</span>' : ''}
        ${vd.dur ? `<span class="dur">${esc(vd.dur)}</span>` : ''}
        ${vd.watched ? `<span class="watched" style="width:${Math.round(vd.watched * 100)}%"></span>` : ''}
      </span>
      <span class="vtitle">${esc(vd.title)}</span>
      <span class="vmeta">${[vd.channel, vd.views, vd.ago].filter(Boolean).map(esc).join(' · ')}</span>
    </button>`;
  R.youtube = v => {
    const p = v.playing && D.videos.find(x => x.id === v.playing);
    const top = p && p.live ? `
      <div class="player embed">
        <iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(p.id)}?autoplay=1&rel=0" title="${esc(p.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>
      </div>
      <div class="toolbar-row"><span class="live-tag">กำลังเล่น · ทีวีในห้องแสดงชื่อคลิปด้วย</span><button class="btn push" type="button" data-act="videoStop">${I.stop} หยุด</button></div>` : p ? `
      <div class="player" style="--c1:${p.colors[0]};--c2:${p.colors[1]}">
        <button class="pstop" type="button" data-act="videoStop" aria-label="หยุดเล่นบนทีวี">${I.stop}</button>
        <span class="ptitle">${esc(p.title)}</span>
        <span class="psub"><span class="live"></span>กำลังเล่นบนทีวีในห้อง · ${esc(p.channel)}</span>
        <div class="ptrack"><div class="pfill" id="vprog"></div></div>
      </div>` : `
      <div class="player-idle">${I.tv}<span>แตะวิดีโอเพื่อเปิดบนทีวีที่ผนังห้อง ผู้ช่วยจะดูไปกับคุณด้วย</span></div>`;
    const fresh = D.videos.filter(x => x.isNew), cont = D.videos.filter(x => !x.isNew);
    if (!D.videos.length) return `${top}<p class="empty">ยังไม่มีวิดีโอใหม่จากช่องที่คุณติดตาม</p>`;
    const live = realData('youtube');
    return `${top}
      ${fresh.length ? `<h3 class="section-title">วิดีโอใหม่จากช่องที่ติดตาม</h3>
      <div class="vgrid">${fresh.map(x => vcard(x, x.id === v.playing)).join('')}</div>` : ''}
      ${cont.length ? `<h3 class="section-title">${live ? 'ก่อนหน้านี้' : 'ดูต่อ'}</h3>
      <div class="vgrid">${cont.map(x => vcard(x, x.id === v.playing)).join('')}</div>` : ''}`;
  };

  /* ---------- actions inside the drawer ---------- */
  const ACT = {
    connect: (id, el) => startConnect(id, el),
    reload: id => { loadLive(id, true); renderDrawer(); },
    login: () => openAuth('login'),
    // from the overview: open a service, optionally straight to one item ("gmail:3", "line:mom", ...)
    jump: arg => {
      const i = arg.indexOf(':');
      const id = i < 0 ? arg : arg.slice(0, i), item = i < 0 ? null : arg.slice(i + 1);
      if (!svc(id)) return;
      if (item && isOn(id)) {
        if (id === 'gmail') {
          view.gmail.compose = false; view.gmail.open = item; markRead(item); ensureBody(item);
        } else if (id === 'line') {
          view.line.open = item;
          if (!state.chatsRead.includes(item)) { state.chatsRead.push(item); save(); }
        } else if (id === 'news') {
          view.news.cat = null; view.news.open = item;
        } else if (id === 'youtube') {
          const vd = D.videos.find(x => x.id === item);
          if (vd) { view.youtube.playing = vd.id; S.playVideo({ title: vd.title, channel: vd.channel, colors: vd.colors, len: 45 }); }
        } else if (id === 'onedrive') {
          toast(`เปิด "${item}" (จำลอง)`);
        }
      }
      openService(id);
    },
    mailTab: tab => { view.gmail.tab = tab; renderDrawer(); },
    mailOpen: id => {
      id = String(id); view.gmail.open = id; markRead(id);
      renderDrawer(true); refreshCounts(); ensureBody(id);
    },
    mailBack: () => { view.gmail.open = null; renderDrawer(true); },
    compose: () => { view.gmail.compose = true; view.gmail.draft = {}; renderDrawer(true); $('#mailTo').focus(); },
    composeCancel: () => { view.gmail.compose = false; renderDrawer(true); },
    reply: id => {
      const m = D.emails.find(x => x.id === String(id));
      view.gmail.compose = true; view.gmail.draft = { to: m.addr, subject: 'Re: ' + m.subject };
      renderDrawer(true); $('#mailBody').focus();
    },
    forward: id => {
      const m = D.emails.find(x => x.id === String(id));
      view.gmail.compose = true; view.gmail.draft = { subject: 'Fwd: ' + m.subject, body: '\n\n---------- ข้อความที่ส่งต่อ ----------\n' + (m.body || m.snippet) };
      renderDrawer(true); $('#mailTo').focus();
    },
    fileOpen: name => toast(`เปิด "${name}" (จำลอง)`),
    folderOpen: name => toast(`เปิดโฟลเดอร์ "${name}" (จำลอง)`),
    upload: () => toast('อัปโหลดไฟล์ (จำลอง) เวอร์ชันจริงจะเปิดหน้าต่างเลือกไฟล์'),
    chatOpen: id => {
      view.line.open = id;
      if (!state.chatsRead.includes(id)) { state.chatsRead.push(id); save(); }
      renderDrawer(); refreshCounts();
      const inp = $('#chatInput'); if (inp && wide()) inp.focus();
    },
    chatBack: () => { view.line.open = null; renderDrawer(true); },
    newsCat: c => { view.news.cat = c; view.news.open = null; renderDrawer(); },
    newsOpen: id => { id = String(id); view.news.open = view.news.open === id ? null : id; renderDrawer(); },
    videoPlay: id => {
      const vd = D.videos.find(x => x.id === id);
      view.youtube.playing = id;
      S.playVideo({ title: vd.title, channel: vd.channel, colors: vd.colors, len: 45 });
      renderDrawer(true);
      S.say(`เปิดบนทีวีให้แล้ว${e()}`);
    },
    videoStop: () => { view.youtube.playing = null; S.playVideo(null); renderDrawer(); }
  };
  const SUBMIT = {
    sendMail: async form => {
      const to = form.to.value.trim();
      if (isLive() && isOn('gmail') && LIVEAPI) {
        const btn = form.querySelector('[type="submit"]');
        btn.disabled = true; btn.innerHTML = '<span class="spin"></span> กำลังส่ง…';
        try { await LIVEAPI.gmail.send({ to, subject: form.subject.value, body: form.body.value }); }
        catch (err) {
          btn.disabled = false; btn.innerHTML = `${I.send} ส่ง`;
          toast('ส่งไม่สำเร็จ: ' + (err.needsAuth ? 'ต้องเชื่อม Google ใหม่' : err.message));
          return;
        }
        view.gmail.compose = false; renderDrawer(true);
        toast(`ส่งอีเมลถึง ${to} แล้ว`); S.say(`ส่งอีเมลเรียบร้อย${e()}`);
        loadLive('gmail', true);
        return;
      }
      view.gmail.compose = false;
      renderDrawer(true);
      toast(`ส่งอีเมลถึง ${to} แล้ว (จำลอง ยังไม่ได้ส่งจริง)`);
      S.say(`ส่งอีเมลเรียบร้อย${e()}`);
    },
    sendChat: form => {
      const text = form.msg.value.trim();
      if (!text) return;
      const c = D.chats.find(x => x.id === view.line.open);
      c.messages.push({ me: true, text, time: hhmm() }); c.time = hhmm();
      renderDrawer();
      $('#chatInput').focus();
      const chatId = c.id;
      setTimeout(() => {
        const reply = D.autoReplies[Math.floor(Math.random() * D.autoReplies.length)];
        const who = c.group ? (c.messages.find(m => m.who) || {}).who : undefined;
        c.messages.push({ who, text: reply, time: hhmm() });
        if (current === 'line' && view.line.open === chatId) renderDrawer(); else updateDigest();
      }, 1300);
    }
  };
  body.addEventListener('click', ev => {
    const el = ev.target.closest('[data-act]');
    if (!el || !body.contains(el)) return;
    const fn = ACT[el.dataset.act];
    if (fn) fn(el.dataset.arg, el);
  });
  body.addEventListener('submit', ev => {
    ev.preventDefault();
    const fn = SUBMIT[ev.target.dataset.submit];
    if (fn) fn(ev.target);
  });
  body.addEventListener('input', ev => {
    if (ev.target.id === 'fileSearch') { view.onedrive.q = ev.target.value; $('#fileList').innerHTML = fileRows(view.onedrive.q); }
  });

  /* ---------- connect / disconnect (simulated) ---------- */
  function startConnect(id, btn) {
    const s = svc(id);
    if (AUTH.enabled && PROVIDER[id]) {
      const p = PROVIDER[id];
      if (btn) { btn.disabled = true; btn.innerHTML = `<span class="spin"></span> กำลังไปที่ ${PROVIDER_NAME[p]}…`; }
      AUTH.oauth(p).catch(err => {
        if (btn) { btn.disabled = false; btn.textContent = 'ลองอีกครั้ง'; }
        toast('เชื่อมต่อไม่สำเร็จ: ' + thaiAuthError(err));
      });
      return;
    }
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spin"></span> กำลังเชื่อมต่อ…'; }
    setTimeout(() => {
      state.connected[id] = true; save();
      if (current === id) renderDrawer(true);
      if (!modal.hidden) renderModal();
      refreshCounts();
      S.celebrate(id);
      S.say(`เชื่อม ${s.name} เรียบร้อย${e()}`);
      toast(`เชื่อมต่อ ${s.name} แล้ว (จำลอง)`);
    }, 1100);
  }
  function disconnect(id) {
    const s = svc(id);
    if (isLive() && PROVIDER[id]) {
      const p = PROVIDER[id];
      AUTH.forget(p);
      Object.keys(PROVIDER).filter(k => PROVIDER[k] === p).forEach(k => { delete LIVE[k]; });
      if (p === 'google' && view.youtube.playing) { view.youtube.playing = null; S.playVideo(null); }
      if (current) renderDrawer(true);
      renderModal(); refreshCounts();
      toast(`ยกเลิกการเชื่อม ${PROVIDER_NAME[p]} บนเครื่องนี้แล้ว`);
      return;
    }
    state.connected[id] = false; save();
    if (id === 'youtube' && view.youtube.playing) { view.youtube.playing = null; S.playVideo(null); }
    if (current === id) renderDrawer(true);
    renderModal(); refreshCounts();
    toast(`ยกเลิกการเชื่อมต่อ ${s.name} แล้ว`);
  }

  /* ---------- connections modal ---------- */
  const modal = $('#connectModal');
  function renderModal() {
    const live = isLive();
    const top = AUTH.enabled && !live
      ? '<p class="note">ตอนนี้เป็นโหมดตัวอย่าง <button class="linkish" type="button" data-mact="login">เข้าสู่ระบบ</button> เพื่อเชื่อมบัญชีจริง (หรือกดเชื่อมต่อด้านล่างเพื่อเข้าสู่ระบบด้วย Google / Microsoft)</p>' : '';
    $('#connectList').innerHTML = top + D.services.map(s => {
      const on = isOn(s.id), p = PROVIDER[s.id];
      if (s.id === 'news' || (AUTH.enabled && (s.id === 'line' || (live && p)))) {
        const info = s.id === 'news' ? `<span class="conn-state">${I.check} ข้อมูลจริง ใช้ได้เลยไม่ต้องเชื่อม</span>`
          : s.id === 'line' ? '<span class="row-sub">LINE ไม่เปิดให้แอปอื่นอ่านแชทส่วนตัว จึงแสดงเป็นข้อมูลตัวอย่าง</span>'
          : on ? `<span class="conn-state">${I.check} เชื่อมแล้วผ่าน ${PROVIDER_NAME[p]}</span>` : `<span class="row-sub">เชื่อมผ่านบัญชี ${PROVIDER_NAME[p]}</span>`;
        const btn = s.id === 'news' || s.id === 'line' ? ''
          : on ? `<button class="btn" type="button" data-mact="disconnect" data-arg="${s.id}">ยกเลิก</button>`
          : `<button class="btn primary" type="button" data-mact="connect" data-arg="${s.id}">เชื่อมต่อ</button>`;
        return `
      <div class="conn-row" style="--c:${s.color}">
        <span class="svc-icon">${I[s.id]}</span>
        <span class="row-main"><b>${esc(s.name)}</b><span class="row-sub">${esc(s.desc)}</span>${info}</span>
        ${btn}
      </div>`;
      }
      return `
      <div class="conn-row" style="--c:${s.color}">
        <span class="svc-icon">${I[s.id]}</span>
        <span class="row-main">
          <b>${esc(s.name)}</b>
          <span class="row-sub">${esc(s.desc)}</span>
          ${on ? `<span class="conn-state">${I.check} เชื่อมต่อแล้ว · อยู่ที่${esc(s.object)}</span>` : `<span class="row-sub">อยู่ที่${esc(s.object)}</span>`}
        </span>
        ${on ? `<button class="btn" type="button" data-mact="disconnect" data-arg="${s.id}">ยกเลิก</button>`
             : `<button class="btn primary" type="button" data-mact="connect" data-arg="${s.id}">เชื่อมต่อ</button>`}
      </div>`;
    }).join('');
  }
  function openModal() {
    if (!$('#closet').hidden) $('#closetClose').click();
    renderModal(); modal.hidden = false;
    $('#connectClose').focus();
  }
  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    $('#btnConnect').focus({ preventScroll: true });
  }
  $('#btnConnect').addEventListener('click', openModal);
  $('#connectClose').addEventListener('click', closeModal);
  modal.addEventListener('click', ev => {
    if (ev.target === modal) { closeModal(); return; }
    const el = ev.target.closest('[data-mact]'); if (!el) return;
    if (el.dataset.mact === 'login') { openAuth('login'); return; }
    if (el.dataset.mact === 'connect') startConnect(el.dataset.arg, el); else disconnect(el.dataset.arg);
  });

  /* ---------- account: sign in / sign up ---------- */
  const authModal = $('#authModal'), btnAccount = $('#btnAccount');
  let authMode = 'login', lastUserId;
  btnAccount.hidden = !AUTH.enabled;
  function renderAccount() {
    const u = AUTH.user(), name = AUTH.displayName();
    $('#accountLabel').textContent = u ? name : 'เข้าสู่ระบบ';
    $('#accountAvatar').hidden = !u;
    $('#accountAvatar').textContent = u ? initialOf(name) : '';
    $('#accountIcon').style.display = u ? 'none' : '';
    btnAccount.classList.toggle('primary', !u);
    btnAccount.setAttribute('aria-label', u ? `บัญชีของ ${name}` : 'เข้าสู่ระบบหรือสมัครสมาชิก');
    const pill = $('.mock-pill');
    if (AUTH.enabled) { pill.hidden = !!u; pill.textContent = 'โหมดตัวอย่าง'; pill.title = 'เข้าสู่ระบบเพื่อดูข้อมูลจริงของคุณ'; }
  }
  function authMsg(text, kind) { const m = $('#authMsg'); m.textContent = text || ''; m.className = 'auth-msg' + (kind ? ' ' + kind : ''); }
  function renderAuth() {
    const u = AUTH.user(), signup = authMode === 'signup';
    $('#authGuest').hidden = !!u; $('#authMember').hidden = !u;
    $('#authTitle').textContent = u ? 'บัญชีของคุณ' : signup ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ';
    $('#authSub').textContent = u ? 'เชื่อมบัญชีที่ใช้แสดงในห้อง หรือออกจากระบบ'
      : signup ? 'สมัครฟรี แล้วเชื่อมอีเมล ไฟล์ และวิดีโอของคุณเข้ากับห้อง' : 'เข้าสู่ระบบเพื่อดูอีเมล ไฟล์ และวิดีโอของคุณเองในห้อง';
    [['#tabLogin', !signup], ['#tabSignup', signup]].forEach(([sel, on]) => { $(sel).setAttribute('aria-pressed', String(on)); $(sel).setAttribute('aria-selected', String(on)); });
    $('#nameField').hidden = !signup;
    $('#authPassword').setAttribute('autocomplete', signup ? 'new-password' : 'current-password');
    $('#authSubmit').textContent = signup ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ';
    $('#authForgot').hidden = signup;
    if (u) {
      const name = AUTH.displayName();
      $('#memberAvatar').textContent = initialOf(name);
      $('#memberName').textContent = name;
      $('#memberEmail').textContent = u.email || '';
      $('#memberLinks').innerHTML = [['google', 'Google', 'Gmail และ YouTube', 'gmail'], ['azure', 'Microsoft', 'OneDrive', 'onedrive']].map(([p, label, what, icon]) => {
        const on = !!AUTH.token(p);
        return `<div class="conn-row" style="--c:${svc(icon).color}"><span class="svc-icon">${I[icon]}</span>
          <span class="row-main"><b>${label}</b><span class="row-sub">${what}</span>${on ? `<span class="conn-state">${I.check} เชื่อมแล้ว</span>` : ''}</span>
          <button class="btn ${on ? '' : 'primary'}" type="button" data-provider="${p}">${on ? 'เชื่อมใหม่' : 'เชื่อมต่อ'}</button></div>`;
      }).join('');
    }
  }
  function openAuth(mode) {
    if (!AUTH.enabled) return;
    closeModal();
    if (!$('#closet').hidden) $('#closetClose').click();
    if (mode) authMode = mode;
    authMsg(''); renderAuth();
    authModal.hidden = false;
    (AUTH.user() ? $('#authClose') : $('#authEmail')).focus();
  }
  function closeAuth() {
    if (authModal.hidden) return;
    authModal.hidden = true;
    btnAccount.focus({ preventScroll: true });
  }
  function thaiAuthError(err) {
    const m = String((err && err.message) || err);
    if (/Invalid login credentials/i.test(m)) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
    if (/Email not confirmed/i.test(m)) return 'ยังไม่ได้ยืนยันอีเมล ลองกดลิงก์ในอีเมลที่ส่งไปก่อน';
    if (/already (been )?registered/i.test(m)) return 'อีเมลนี้สมัครไว้แล้ว ลองเข้าสู่ระบบแทน';
    if (/rate limit|too many/i.test(m)) return 'ลองบ่อยเกินไป รอสักครู่แล้วลองใหม่';
    if (/provider is not enabled|unsupported provider/i.test(m)) return 'ยังไม่ได้เปิดการเข้าสู่ระบบแบบนี้ในระบบหลังบ้าน';
    if (/manual linking/i.test(m)) return 'ยังไม่ได้เปิดการเชื่อมหลายบัญชี (Manual linking) ใน Supabase';
    if (/password should/i.test(m)) return 'รหัสผ่านยังไม่ปลอดภัยพอ ลองให้ยาวขึ้นหรือมีตัวเลขผสม';
    if (/failed to fetch|networkerror|load failed/i.test(m)) return 'ติดต่อระบบสมาชิกไม่ได้ ตรวจอินเทอร์เน็ตแล้วลองใหม่';
    return m;
  }
  btnAccount.addEventListener('click', () => openAuth());
  $('#authClose').addEventListener('click', closeAuth);
  $('#tabLogin').addEventListener('click', () => { authMode = 'login'; authMsg(''); renderAuth(); });
  $('#tabSignup').addEventListener('click', () => { authMode = 'signup'; authMsg(''); renderAuth(); });
  authModal.addEventListener('click', ev => {
    if (ev.target === authModal) { closeAuth(); return; }
    const b = ev.target.closest('[data-provider]'); if (!b) return;
    b.disabled = true;
    authMsg(`กำลังไปที่ ${PROVIDER_NAME[b.dataset.provider]}…`);
    AUTH.oauth(b.dataset.provider).catch(err => { b.disabled = false; authMsg(thaiAuthError(err), 'err'); });
  });
  $('#authForgot').addEventListener('click', async () => {
    const email = $('#authEmail').value.trim();
    if (!email) { authMsg('ใส่อีเมลก่อน แล้วกด "ลืมรหัสผ่าน?" อีกครั้ง', 'err'); $('#authEmail').focus(); return; }
    try { await AUTH.resetPassword(email); authMsg('ส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่อีเมลแล้ว', 'ok'); }
    catch (err) { authMsg(thaiAuthError(err), 'err'); }
  });
  $('#authForm').addEventListener('submit', async ev => {
    ev.preventDefault();
    const email = $('#authEmail').value.trim(), pw = $('#authPassword').value, name = $('#authName').value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) { authMsg('รูปแบบอีเมลไม่ถูกต้อง', 'err'); $('#authEmail').focus(); return; }
    if (pw.length < 8) { authMsg('รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร', 'err'); $('#authPassword').focus(); return; }
    const btn = $('#authSubmit'), label = btn.textContent;
    btn.disabled = true; btn.innerHTML = '<span class="spin"></span> กำลังดำเนินการ…';
    try {
      if (authMode === 'signup') {
        const r = await AUTH.signUp(email, pw, name);
        if (r.needsConfirm) authMsg(`สมัครเรียบร้อย ส่งอีเมลยืนยันไปที่ ${email} แล้ว กดลิงก์ในอีเมลแล้วค่อยเข้าสู่ระบบ`, 'ok');
        else closeAuth();
      } else { await AUTH.signIn(email, pw); closeAuth(); }
    } catch (err) { authMsg(thaiAuthError(err), 'err'); }
    btn.disabled = false; btn.textContent = label;
  });
  $('#authSignOut').addEventListener('click', async () => { await AUTH.signOut(); closeAuth(); toast('ออกจากระบบแล้ว'); });

  AUTH.onChange(u => {
    if (u) {
      ['gmail', 'youtube', 'onedrive'].forEach(id => { if (isOn(id)) loadLive(id); });
      if (lastUserId === null) S.say(`ยินดีต้อนรับ ${AUTH.displayName()}${e()}`);
    } else {
      Object.keys(LIVE).forEach(k => { delete LIVE[k]; });
      const d = clone(DEMO); D.emails = d.emails; D.files = d.files; D.videos = d.videos;
      view.gmail = {}; view.onedrive = {};
      if (view.youtube.playing) S.playVideo(null);
      view.youtube = {};
    }
    lastUserId = u ? u.id : null;
    renderAccount(); refreshCounts();
    if (current) renderDrawer();
    if (!modal.hidden) renderModal();
    if (!authModal.hidden) renderAuth();
  });
  renderAccount();

  /* closet and drawer share space, so opening one closes the other */
  $('#btnCloset').addEventListener('click', () => { if (!$('#closet').hidden) { closeDrawer(); closeModal(); } });

  document.addEventListener('keydown', ev => {
    if (ev.key !== 'Escape') return;
    if (!authModal.hidden) closeAuth();
    else if (!modal.hidden) closeModal();
    else if (current && $('#closet').hidden) closeDrawer();
  });

  /* ---------- toast ---------- */
  const toastEl = $('#toast'); let toastTimer = 0;
  function toast(text) {
    toastEl.textContent = text; toastEl.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  /* ---------- start ---------- */
  refreshCounts();
  requestAnimationFrame(updateShift);
  if (location.hash) setTimeout(fromHash, 300);
  if (LIVEAPI) {
    loadNews('all');
    LIVEAPI.weather.now().then(w => { D.weather = w; updateDigest(); if (current === 'news') renderDrawer(); }).catch(() => { /* keep example weather */ });
  }
  setTimeout(() => {
    const n = counts();
    const who = isLive() ? ' คุณ' + AUTH.displayName() : '';
    S.say(`${greet}${who}${greet.endsWith('นะ') ? '' : e()} วันนี้มีอีเมลใหม่ ${n.gmail} ฉบับ`);
  }, 2000);
})();
