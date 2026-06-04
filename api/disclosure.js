export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { type, symbol, stockCode } = req.query;

  try {
    if (type === 'sec') {
      const url = `https://efts.sec.gov/LATEST/search-index?q=%22${encodeURIComponent(symbol || '')}%22&forms=8-K,S-3,6-K,SC%2013G&dateRange=custom&startdt=${getDateDaysAgo(14)}&enddt=${getToday()}`;
      const r = await fetch(url, {
        headers: { 'User-Agent': 'StockSignal/1.0 contact@example.com', 'Accept': 'application/json' }
      });
      const data = await r.json();
      res.status(200).json(data);

    } else if (type === 'dart') {
      const apiKey = process.env.DART_API_KEY || '';
      if (!apiKey) return res.status(200).json({ status: 'no_key', list: [] });

      const code = stockCode || symbol || '';
      const today = getToday().replace(/-/g, '');
      const monthAgo = getDateDaysAgo(30).replace(/-/g, '');

      // 종목코드로 직접 조회 (corp_code 없이 stock_code 파라미터 사용)
      const url = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${apiKey}&stock_code=${code}&bgn_de=${monthAgo}&end_de=${today}&last_reprt_at=N&page_count=20`;
      const r = await fetch(url);
      const data = await r.json();
      res.status(200).json(data);

    } else {
      res.status(400).json({ error: 'type required: sec | dart' });
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
