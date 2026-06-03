# 📡 SignalHunter — 선매수 시그널 스캐너

미국(NYSE/NASDAQ) + 한국(KOSPI/KOSDAQ) 주식 선매수 시그널 분석 대시보드

## 파일 구조

```
stock-signal/
├── index.html          # 메인 앱
├── vercel.json         # Vercel 라우팅
├── api/
│   ├── yahoo.js        # Yahoo Finance 프록시 (CORS 우회)
│   ├── disclosure.js   # SEC EDGAR + DART 공시 프록시
│   └── analyze.js      # Claude AI 분석 프록시
└── README.md
```

## Vercel 배포

```bash
npm i -g vercel
vercel --prod
```

## 환경변수 설정 (Vercel Dashboard → Settings → Environment Variables)

| 키 | 설명 | 필수 |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude AI 분석용 | 권장 |
| `DART_API_KEY` | 한국 DART 공시 조회 | 선택 |

- DART API 무료 발급: https://opendart.fss.or.kr
- Yahoo Finance: 키 불필요
- SEC EDGAR: 키 불필요

## 분석 시그널 목록

| 시그널 | 방향 | 설명 |
|---|---|---|
| 거래량 급증 | BULL | 평균 대비 1.5배+ |
| 거래량 급감 | WATCH | 유동성 고갈, 변동성 전조 |
| SEC 공시 | NEUTRAL | 8-K, S-3, 6-K 탐지 |
| DART 공시 | NEUTRAL | 한국 공시정보 탐지 |
| 신규 계약 | BULL | 뉴스 키워드 탐지 |
| 추가증자/희석 | BEAR | S-3 + 저점 근접 |
| 공매도 압박 | BEAR | 급락 + 대량거래 조합 |
| 가격 돌파 | BULL | 52주 고점 + 거래량 |
| RSI 시그널 | TECH | 과매도(<30) / 과매수(>70) |

## 면책사항

본 앱은 공개 데이터 기반 정보 분석 도구입니다.
투자 결정의 책임은 사용자에게 있으며, 투자 조언이 아닙니다.
