/* Office Hub: ดึงข้อมูลจริงจากแต่ละบริการ แล้วแปลงให้อยู่ในรูปเดียวกับข้อมูลตัวอย่างใน data.js
   Gmail / YouTube ใช้ token ของ Google, OneDrive ใช้ token ของ Microsoft (ได้จาก auth.js)
   ข่าวมาจาก /api/news (Netlify / Cloudflare function) และอากาศจาก Open-Meteo (ไม่ต้องใช้ key) */
(() => {
  'use strict';
  const A = window.HubAuth;
  const C = window.HUB_CONFIG || {};

  class NeedsAuth extends Error { constructor(provider) { super('needs_auth'); this.needsAuth = true; this.provider = provider; } }

  async function api(provider, url, opts = {}) {
    const token = A && A.enabled ? A.token(provider) : null;
    if (!token) throw new NeedsAuth(provider);
    const res = await fetch(url, Object.assign({}, opts, { headers: Object.assign({ Authorization: 'Bearer ' + token }, opts.headers || {}) }));
    if (res.status === 401) { A.forget(provider); throw new NeedsAuth(provider); }
    if (!res.ok) {
      let msg = res.status + '';
      try { const j = await res.json(); msg += ' ' + ((j.error && (j.error.message || j.error)) || ''); } catch (e) { /* not json */ }
      throw new Error(msg.trim());
    }
    return res.status === 204 ? null : res.json();
  }

  /* ---------- helpers ---------- */
  const PASTEL = ['#ffd1dc', '#cfe3ff', '#d9f2e6', '#fff1b8', '#e6dcff', '#ffe0cc', '#d6f0f5'];
  const VIDEO = [['#ffb6c8', '#ffd166'], ['#9db8ff', '#c9b6ff'], ['#8fd3c1', '#fff1b8'], ['#ff9a76', '#ffd1dc'], ['#7d8fe0', '#8fe3c8']];
  const hash = s => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.codePointAt(0)) | 0; return Math.abs(h); };
  const initial = s => { const m = String(s || '').match(/[A-Za-z0-9ก-ฮ]/); return m ? m[0].toUpperCase() : '?'; };
  const textOf = html => new DOMParser().parseFromString(String(html || ''), 'text/html').documentElement.textContent || '';
  const pad = n => String(n).padStart(2, '0');
  function shortTime(d) {
    if (!(d instanceof Date) || isNaN(d)) return '';
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return pad(d.getHours()) + ':' + pad(d.getMinutes());
    const y = new Date(now); y.setDate(now.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return 'เมื่อวาน';
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  }
  function ago(d) {
    if (!(d instanceof Date) || isNaN(d)) return '';
    const m = Math.max(0, Math.round((Date.now() - d) / 60000));
    if (m < 1) return 'เมื่อสักครู่';
    if (m < 60) return m + ' นาทีที่แล้ว';
    const h = Math.round(m / 60); if (h < 24) return h + ' ชั่วโมงที่แล้ว';
    const day = Math.round(h / 24); if (day < 7) return day + ' วันที่แล้ว';
    if (day < 30) return Math.round(day / 7) + ' สัปดาห์ที่แล้ว';
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  const sizeText = b => { if (b == null) return ''; const u = ['B', 'KB', 'MB', 'GB']; let i = 0; while (b >= 1024 && i < 3) { b /= 1024; i++; } return (i ? b.toFixed(1) : b) + ' ' + u[i]; };
  const typeOf = name => {
    const ext = (String(name).split('.').pop() || '').toLowerCase();
    if (['doc', 'docx', 'odt', 'rtf', 'txt'].includes(ext)) return 'doc';
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return 'xls';
    if (['ppt', 'pptx', 'odp', 'key'].includes(ext)) return 'ppt';
    if (ext === 'pdf') return 'pdf';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic', 'svg'].includes(ext)) return 'img';
    return 'other';
  };
  // base64url <-> UTF-8 text
  const b64urlDecode = s => {
    const bin = atob(String(s).replace(/-/g, '+').replace(/_/g, '/'));
    return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
  };
  const b64Encode = s => { const bytes = new TextEncoder().encode(s); let bin = ''; bytes.forEach(b => { bin += String.fromCharCode(b); }); return btoa(bin); };
  const b64url = s => b64Encode(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  /* ---------- Gmail ---------- */
  const GMAIL = 'https://gmail.googleapis.com/gmail/v1/users/me';
  const LABELS = { CATEGORY_PROMOTIONS: 'โปรโมชัน', CATEGORY_SOCIAL: 'โซเชียล', CATEGORY_UPDATES: 'อัปเดต', CATEGORY_FORUMS: 'ฟอรัม', IMPORTANT: 'สำคัญ' };
  function parseFrom(v) {
    const m = String(v || '').match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
    return m ? { name: m[1].trim() || m[2], addr: m[2] } : { name: String(v || '').trim(), addr: String(v || '').trim() };
  }
  const gmail = {
    async list() {
      const l = await api('google', `${GMAIL}/messages?maxResults=15&labelIds=INBOX`);
      const ids = (l.messages || []).map(m => m.id);
      const metas = await Promise.all(ids.map(id =>
        api('google', `${GMAIL}/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`)));
      return metas.map(m => {
        const h = {}; (m.payload && m.payload.headers || []).forEach(x => { h[x.name.toLowerCase()] = x.value; });
        const from = parseFrom(h.from);
        const labels = m.labelIds || [];
        const label = labels.map(x => LABELS[x]).find(Boolean) || 'กล่องจดหมาย';
        return {
          id: m.id, live: true, from: from.name, addr: from.addr, initial: initial(from.name),
          color: PASTEL[hash(from.addr) % PASTEL.length],
          time: shortTime(new Date(Number(m.internalDate))), unread: labels.includes('UNREAD'), label,
          subject: h.subject || '(ไม่มีหัวเรื่อง)', snippet: textOf(m.snippet), body: null, attach: null
        };
      });
    },
    async body(id) {
      const m = await api('google', `${GMAIL}/messages/${id}?format=full`);
      let plain = '', html = ''; const files = [];
      (function walk(p) {
        if (!p) return;
        if (p.filename) files.push(p.filename);
        else if (p.mimeType === 'text/plain' && p.body && p.body.data && !plain) plain = b64urlDecode(p.body.data);
        else if (p.mimeType === 'text/html' && p.body && p.body.data && !html) html = b64urlDecode(p.body.data);
        (p.parts || []).forEach(walk);
      })(m.payload);
      const text = plain || textOf(html.replace(/<(br|\/p|\/div|\/li|\/tr)[^>]*>/gi, '\n'));
      return { body: text.replace(/\n{3,}/g, '\n\n').trim() || textOf(m.snippet), attach: files.length ? files.join(', ') : null };
    },
    async send({ to, subject, body }) {
      const raw = [
        `To: ${to}`,
        `Subject: =?UTF-8?B?${b64Encode(subject || '')}?=`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset="UTF-8"',
        'Content-Transfer-Encoding: base64',
        '',
        b64Encode(body || '')
      ].join('\r\n');
      return api('google', `${GMAIL}/messages/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ raw: b64url(raw) }) });
    }
  };

  /* ---------- YouTube: newest uploads from subscribed channels ---------- */
  const YT = 'https://www.googleapis.com/youtube/v3';
  const youtube = {
    async list() {
      const subs = await api('google', `${YT}/subscriptions?part=snippet&mine=true&maxResults=15&order=relevance`);
      const channels = (subs.items || []).map(s => s.snippet.resourceId.channelId);
      const acts = await Promise.all(channels.map(c =>
        api('google', `${YT}/activities?part=snippet,contentDetails&channelId=${c}&maxResults=3`).catch(() => ({ items: [] }))));
      const seen = new Set();
      return acts.flatMap(a => a.items || [])
        .filter(a => a.snippet.type === 'upload' && a.contentDetails && a.contentDetails.upload)
        .map(a => ({ id: a.contentDetails.upload.videoId, s: a.snippet }))
        .filter(v => !seen.has(v.id) && seen.add(v.id))
        .sort((a, b) => new Date(b.s.publishedAt) - new Date(a.s.publishedAt))
        .slice(0, 10)
        .map(v => {
          const when = new Date(v.s.publishedAt);
          const th = v.s.thumbnails || {};
          return {
            id: v.id, live: true, title: v.s.title, channel: v.s.channelTitle, views: '', ago: ago(when), dur: '',
            colors: VIDEO[hash(v.id) % VIDEO.length], isNew: Date.now() - when < 3 * 864e5, watched: 0,
            thumb: (th.medium || th.default || {}).url || ''
          };
        });
    }
  };

  /* ---------- OneDrive (Microsoft Graph) ---------- */
  const GRAPH = 'https://graph.microsoft.com/v1.0/me/drive';
  const FOLDER_COLORS = ['#4f95ff', '#ff9fb5', '#ffc75c', '#8fd3c1', '#c9b6ff', '#ff9a76'];
  const onedrive = {
    async summary() {
      const [drive, recent, root] = await Promise.all([
        api('azure', GRAPH), api('azure', `${GRAPH}/recent?$top=12`), api('azure', `${GRAPH}/root/children?$top=60`)
      ]);
      const q = drive.quota || {};
      return {
        live: true,
        usedGB: Number(((q.used || 0) / 1e9).toFixed(1)),
        totalGB: Math.round((q.total || 0) / 1e9),
        folders: (root.value || []).filter(i => i.folder).slice(0, 6).map((i, n) => ({
          name: i.name, count: i.folder.childCount, color: FOLDER_COLORS[n % FOLDER_COLORS.length], url: i.webUrl
        })),
        recent: (recent.value || []).map(i => {
          const r = i.remoteItem || {};
          const name = i.name || r.name || '(ไม่มีชื่อ)';
          return { name, type: typeOf(name), size: sizeText(i.size != null ? i.size : r.size),
            mod: shortTime(new Date(i.lastModifiedDateTime || r.lastModifiedDateTime)), url: i.webUrl || r.webUrl };
        })
      };
    }
  };

  /* ---------- News (our own /api/news function) ---------- */
  const news = {
    async list(cat) {
      const res = await fetch('/api/news?cat=' + encodeURIComponent(cat));
      if (!res.ok) throw new Error('news ' + res.status);
      const j = await res.json();
      return (j.items || []).map((x, i) => {
        const when = x.published ? new Date(x.published) : null;
        return { id: cat + '-' + i, live: true, title: x.title, source: x.source, link: x.link,
          time: ago(when), fresh: !!when && Date.now() - when < 3 * 3600e3 };
      });
    }
  };

  /* ---------- Weather (Open-Meteo) ---------- */
  const WMO = [[0, 'ท้องฟ้าแจ่มใส'], [2, 'มีเมฆบางส่วน'], [3, 'เมฆมาก'], [48, 'มีหมอก'], [57, 'ฝนปรอย'], [67, 'ฝนตก'], [77, 'หิมะ'], [82, 'ฝนตกเป็นช่วงๆ'], [86, 'หิมะ'], [99, 'พายุฝนฟ้าคะนอง']];
  const weather = {
    async now() {
      const w = C.weather || { city: 'กรุงเทพฯ', lat: 13.75, lon: 100.52 };
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${w.lat}&longitude=${w.lon}&current=temperature_2m,weather_code&daily=precipitation_probability_max&timezone=auto&forecast_days=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('weather ' + res.status);
      const j = await res.json();
      const code = j.current.weather_code;
      const sky = (WMO.find(([max]) => code <= max) || [0, 'ไม่ทราบ'])[1];
      const rain = j.daily && j.daily.precipitation_probability_max ? j.daily.precipitation_probability_max[0] : null;
      return { live: true, city: w.city, temp: Math.round(j.current.temperature_2m), sky,
        note: rain != null ? `วันนี้มีโอกาสฝนตก ${rain}% · ข้อมูลจาก Open-Meteo` : 'ข้อมูลจาก Open-Meteo' };
    }
  };

  window.HubLive = { gmail, youtube, onedrive, news, weather, NeedsAuth };
})();
