// Netlify Function: GET /api/stocks
// Latest prices for a fixed list of Thai (SET) and US stocks from Yahoo Finance's chart endpoint.
// The same logic for Cloudflare Pages lives in functions/api/stocks.js (keep the two in sync).

const SYMBOLS = [
  // Thai market
  ['^SET.BK', 'SET', 'th'], ['PTT.BK', 'PTT', 'th'], ['AOT.BK', 'AOT', 'th'], ['CPALL.BK', 'CPALL', 'th'],
  ['ADVANC.BK', 'ADVANC', 'th'], ['KBANK.BK', 'KBANK', 'th'], ['SCB.BK', 'SCB', 'th'], ['DELTA.BK', 'DELTA', 'th'],
  ['GULF.BK', 'GULF', 'th'], ['BDMS.BK', 'BDMS', 'th'],
  // US market
  ['^GSPC', 'S&P 500', 'us'], ['^IXIC', 'NASDAQ', 'us'], ['^DJI', 'DOW', 'us'], ['AAPL', 'AAPL', 'us'],
  ['MSFT', 'MSFT', 'us'], ['NVDA', 'NVDA', 'us'], ['GOOGL', 'GOOGL', 'us'], ['AMZN', 'AMZN', 'us'],
  ['META', 'META', 'us'], ['TSLA', 'TSLA', 'us']
];

async function quote([symbol, label, market]) {
  const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (OfficeHub ticker)' }
  });
  if (!res.ok) throw new Error(`${symbol} ${res.status}`);
  const m = (await res.json()).chart.result[0].meta;
  const price = m.regularMarketPrice, prev = m.chartPreviousClose ?? m.previousClose;
  return {
    symbol, label, market, price, prev,
    change: prev ? price - prev : 0,
    changePct: prev ? ((price - prev) / prev) * 100 : 0,
    currency: m.currency,
    time: m.regularMarketTime ? new Date(m.regularMarketTime * 1000).toISOString() : null
  };
}

export default async () => {
  const results = await Promise.allSettled(SYMBOLS.map(quote));
  const items = results.filter(r => r.status === 'fulfilled').map(r => r.value);
  if (!items.length) return Response.json({ error: 'stocks unavailable' }, { status: 502 });
  return Response.json({ fetchedAt: new Date().toISOString(), source: 'Yahoo Finance', items }, {
    headers: { 'Cache-Control': 'public, max-age=60', 'Netlify-CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' }
  });
};

export const config = { path: '/api/stocks' };
