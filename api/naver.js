export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'code required' });

  try {
    // 네이버 금융 시세 API
    const url = `https://finance.naver.com/item/sise.naver?code=${code}`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://finance.naver.com',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9'
      }
    });
    const html = await r.text();

    // 현재가
    const priceMatch = html.match(/<dd class="no_up"|<dd class="no_down"|<dd class="no_same"[^>]*>[\s\S]*?<span[^>]*>([\d,]+)<\/span>/);
    
    // 네이버 금융 JSON API (더 안정적)
    const jsonUrl = `https://polling.finance.naver.com/api/realtime/domestic/stock/${code}`;
    const jr = await fetch(jsonUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://finance.naver.com',
      }
    });
    
    if (jr.ok) {
      const jdata = await jr.json();
      const stock = jdata?.result?.areas?.[0]?.datas?.[0];
      if (stock) {
        return res.status(200).json({
          code,
          price: parseFloat(stock.nv) || 0,          // 현재가
          change: parseFloat(stock.cv) || 0,          // 전일대비
          changePercent: parseFloat(stock.cr) || 0,   // 등락률
          prevClose: parseFloat(stock.pcv) || 0,      // 전일종가
          open: parseFloat(stock.ov) || 0,            // 시가
          high: parseFloat(stock.hv) || 0,            // 고가
          low: parseFloat(stock.lv) || 0,             // 저가
          volume: parseFloat(stock.tv) || 0,          // 거래량
          name: stock.nm || '',                        // 종목명
          source: 'naver_realtime'
        });
      }
    }

    // 폴백: 네이버 금융 시세 페이지 파싱
    const itemUrl = `https://finance.naver.com/item/main.naver?code=${code}`;
    const ir = await fetch(itemUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://finance.naver.com',
      }
    });
    const ihtml = await ir.text();

    const getVal = (pattern) => {
      const m = ihtml.match(pattern);
      return m ? parseFloat(m[1].replace(/,/g, '')) : 0;
    };

    const price = getVal(/id="가격"[^>]*>([\d,]+)/);
    const change = getVal(/id="전일대비"[^>]*>([\d,]+)/);
    const changePercent = getVal(/등락률"[^>]*>([-\d.]+)/);
    const volume = getVal(/거래량[^>]*>([\d,]+)/);

    res.status(200).json({
      code, price, change, changePercent, volume,
      source: 'naver_html'
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
