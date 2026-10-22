// Netlify Function: GET /api/news?cat=all|tech|business|sports|ent
// Reads Thai headlines from Google News RSS and returns small JSON for the News panel.
// The same logic for Cloudflare Pages lives in functions/api/news.js.

const TOPICS = { all: '', tech: 'TECHNOLOGY', business: 'BUSINESS', sports: 'SPORTS', ent: 'ENTERTAINMENT' };

const decode = s => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  .trim();
const pick = (xml, tag) => { const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)); return m ? decode(m[1]) : ''; };

function parse(xml, limit = 20) {
  const items = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const raw = m[1];
    const source = pick(raw, 'source');
    let title = pick(raw, 'title');
    if (source && title.endsWith(' - ' + source)) title = title.slice(0, -(source.length + 3));
    const date = new Date(pick(raw, 'pubDate'));
    items.push({ title, source, link: pick(raw, 'link'), published: isNaN(date) ? null : date.toISOString() });
    if (items.length >= limit) break;
  }
  return items;
}

export default async (req) => {
  const cat = new URL(req.url).searchParams.get('cat') || 'all';
  if (!(cat in TOPICS)) return Response.json({ error: 'unknown category' }, { status: 400 });
  const topic = TOPICS[cat] ? `/headlines/section/topic/${TOPICS[cat]}` : '';
  try {
    const res = await fetch(`https://news.google.com/rss${topic}?hl=th&gl=TH&ceid=TH:th`, { headers: { 'User-Agent': 'OfficeHub/1.0 (+news panel)' } });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const items = parse(await res.text());
    return Response.json({ cat, fetchedAt: new Date().toISOString(), items }, {
      headers: { 'Cache-Control': 'public, max-age=300', 'Netlify-CDN-Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300' }
    });
  } catch (err) {
    return Response.json({ error: 'news unavailable', detail: String(err.message || err) }, { status: 502 });
  }
};

export const config = { path: '/api/news' };
