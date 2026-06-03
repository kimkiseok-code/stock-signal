export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { type, symbol, cik, corpCode } = req.query;

  try {
    if (type === 'sec') {
      // SEC EDGAR full-text search RSS
      const query = cik
        ? `https://efts.sec.gov/LATEST/search-index?q=%22${encodeURIComponent(symbol || '')}%22&dateRange=custom&startdt=${getDateDaysAgo(30)}&enddt=${getToday()}&forms=8-K,S-3,SC%2013G`
        : `https://efts.sec.gov/LATEST/search-index?q=%22${encodeURIComponent(symbol || '')}%22&forms=8-K,S-3,6-K,SC%2013G&dateRange=custom&startdt=${getDateDaysAgo(14)}&enddt=${getToday()}`;

      const r = await fetch(query, {
        headers: { 'User-Agent': 'StockSignal/1.0 contact@example.com', 'Accept': 'application/json' }
      });
      const data = await r.json();
      res.status(200).json(data);
    } else if (type === 'dart') {
      // DART 공시 API
      const apiKey = process.env.DART_API_KEY || '';
      if (!apiKey) return res.status(200).json({ status: 'no_key', list: [] });
      const today = getToday().replace(/-/g, '');
      const monthAgo = getDateDaysAgo(30).replace(/-/g, '');
      const url = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${apiKey}&corp_code=${corpCode || ''}&bgn_de=${monthAgo}&end_de=${today}&last_reprt_at=N&pblntf_ty=A&page_count=20`;
      const r = await fetch(url);
      const data = await r.json();
      res.status(200).json(data);
    } else if (type === 'sec_rss') {
      // SEC EDGAR RSS feed for latest filings
      const r = await fetch(
        `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${encodeURIComponent(symbol || '')}&type=8-K&dateb=&owner=include&count=10&search_text=&output=atom`,
        { headers: { 'User-Agent': 'StockSignal/1.0 contact@example.com' } }
      );
      const text = await r.text();
      res.setHeader('Content-Type', 'application/xml');
      res.status(200).send(text);
    } else {
      res.status(400).json({ error: 'type required: sec | dart | sec_rss' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}
function getDateDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}
