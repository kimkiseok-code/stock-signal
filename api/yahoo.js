export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { symbol, range = '20d', interval = '1d' } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });

  try {
    // 메인 데이터 + 2일치 동시 조회 (전일 종가 정확히 구하기 위함)
    const [mainUrl, prevUrl] = [
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`,
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d&includePrePost=false`
    ];

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
    };

    const [mainR, prevR] = await Promise.all([
      fetch(mainUrl, { headers }),
      fetch(prevUrl, { headers })
    ]);

    if (!mainR.ok) throw new Error(`Yahoo returned ${mainR.status}`);
    const data = await mainR.json();

    // 전일 종가 정확히 계산 (5일치에서 마지막 2개 종가 비교)
    if (prevR.ok && data?.chart?.result?.[0]) {
      const prevData = await prevR.json();
      const prevResult = prevData?.chart?.result?.[0];
      if (prevResult) {
        const prevCloses = (prevResult.indicators?.quote?.[0]?.close || []).filter(c => c != null);
        const prevTimestamps = prevResult.timestamp || [];
        const now = Date.now() / 1000;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTs = today.getTime() / 1000;

        // 오늘 이전 가장 최근 종가 = 전일 종가
        let yesterdayClose = null;
        for (let i = prevTimestamps.length - 1; i >= 0; i--) {
          if (prevTimestamps[i] < todayTs && prevCloses[i]) {
            yesterdayClose = prevCloses[i];
            break;
          }
        }
        // meta에 주입
        if (yesterdayClose && data.chart.result[0].meta) {
          data.chart.result[0].meta.regularMarketPreviousClose = yesterdayClose;
        }
      }
    }

    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
