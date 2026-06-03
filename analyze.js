export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { stockData } = req.body;
  if (!stockData) return res.status(400).json({ error: 'stockData required' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: `당신은 주식 시그널 분석 전문가입니다. 제공된 데이터를 분석하여 JSON 형식으로만 응답하세요.
응답 형식:
{
  "score": 0~100 (선매수 종합 점수),
  "direction": "BULLISH" | "BEARISH" | "NEUTRAL",
  "strength": "STRONG" | "MODERATE" | "WEAK",
  "signals": [{"type":"시그널명","impact":"positive|negative|neutral","desc":"설명"}],
  "summary": "3줄 이내 핵심 판단",
  "risk": "리스크 요인",
  "action": "WATCH" | "BUY_SIGNAL" | "SELL_SIGNAL" | "AVOID"
}
투자 조언이 아닌 데이터 분석 결과임을 인지하고 객관적으로 분석하세요.`,
        messages: [{ role: 'user', content: JSON.stringify(stockData) }]
      })
    });
    const data = await r.json();
    const text = data.content?.[0]?.text || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    res.status(200).json(JSON.parse(clean));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
