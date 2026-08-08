import { ScoreDetails, Importance, NewsArticle } from '../types';

export function calculateImportanceScore(details: ScoreDetails): { score: number; level: Importance } {
  let score = 0;

  if (details.isOfficialAnnouncement) score += 3;
  if (details.isAvailableForPurchase) score += 3;
  if (details.isParisExclusive) score += 2;
  if (details.isMajorEvent) score += 2;
  if (details.isTrustedMedia) score += 1;

  let level: Importance = '낮음';
  if (score >= 6) {
    level = '높음';
  } else if (score >= 3) {
    level = '중간';
  }

  return { score, level };
}

export interface BuyingAgencySuitability {
  scorePercent: number; // 0 ~ 100%
  badgeText: string;    // e.g. "🔥 [구매대행 대박 예상]"
  reasons: string[];    // e.g. ["135€ 이하 목록 무관세", "파리 팝업스토어 한정판", "항공 배송 용이 (가벼움)"]
  targetMargin: string; // e.g. "마진율 30%~45% 예상"
}

/**
 * Calculates Korea Buying Agency (해외 직구/구매대행) Suitability Score
 */
export function calculateBuyingAgencySuitability(article: Partial<NewsArticle>): BuyingAgencySuitability {
  let score = 50; // default base score
  const reasons: string[] = [];

  const text = ((article.title || '') + ' ' + (article.snippet || '') + ' ' + (article.suggestedPrice || '')).toLowerCase();
  const category = article.category || '패션';

  // 1. Price Arbitrage & Tariff Free Check (150 USD ~ 135 EUR)
  const priceMatch = (article.suggestedPrice || '').match(/\d+/);
  const numericPrice = priceMatch ? parseInt(priceMatch[0], 10) : 0;

  if (numericPrice > 0 && numericPrice <= 135) {
    score += 20;
    reasons.push('💰 135€ 이하 목록 무관세 (직구 가격 경쟁력 최고)');
  } else if (numericPrice > 135 && numericPrice <= 300) {
    score += 15;
    reasons.push('✨ 파리 매장가 대비 택스리프리(12%) 마진 확보');
  } else if (numericPrice > 300) {
    score += 10;
    reasons.push('💎 하이엔드 프리미엄 대행 (고액 수수료 수입 가능)');
  } else {
    score += 10;
    reasons.push('🏷️ 파리 현지 신상 (가격 대비 마진 우수)');
  }

  // 2. Exclusivity & Rarity Check (파리 현지 희소성)
  if (text.includes('marais') || text.includes('마레') || text.includes('pop-up') || text.includes('popup') || text.includes('éphémère')) {
    score += 20;
    reasons.push('📍 파리 마레 지구 팝업스토어 한정판 (한국 미입점)');
  } else if (text.includes('exclusive') || text.includes('독점') || text.includes('limitée') || text.includes('한정')) {
    score += 15;
    reasons.push('🔥 파리 선출시/한정판 (직구 수요 폭발)');
  } else {
    score += 10;
    reasons.push('🇫🇷 프랑스 파리 정품 오리지널 라인');
  }

  // 3. Logistics & Freight Efficiency (항공 배송 용이성)
  if (category === '뷰티' || text.includes('beauté') || text.includes('parfum') || text.includes('skincare')) {
    score += 15;
    reasons.push('📦 가벼운 용기 & 소형 포장 (국제 배송비 1만 원대)');
  } else if (category === '패션' || text.includes('mode') || text.includes('sac') || text.includes('bag')) {
    score += 15;
    reasons.push('👗 패션 의류/잡화 (파손 위험 적고 배송 효율 우수)');
  } else if (category === '식품') {
    score += 10;
    reasons.push('🍪 파리 고급 디저트/아티장 (선물용 직구 수요)');
  }

  // 4. Korea Virality & Demand Index (한국 직구족 트렌드)
  if (text.includes('sezane') || text.includes('rouje') || text.includes('polene') || text.includes('buly') || text.includes('dior') || text.includes('jacquemus') || text.includes('lacoste')) {
    score += 15;
    reasons.push('❤️ 한국 직구족 최선호 인기 브랜드 (빠른 품절)');
  } else {
    score += 10;
    reasons.push('🌟 SNS 트렌디 핫이슈 신제품');
  }

  // Clamp Score
  const finalScore = Math.min(Math.max(score, 40), 98);

  let badgeText = '👍 [구매대행 추천]';
  let targetMargin = '마진율 25% ~ 35% 예상';

  if (finalScore >= 85) {
    badgeText = '🔥 [구매대행 대박 예상 (강력 추천)]';
    targetMargin = '마진율 35% ~ 50%+ 예상';
  } else if (finalScore >= 70) {
    badgeText = '👍 [구매대행 우수 (안정적 수익)]';
    targetMargin = '마진율 25% ~ 35% 예상';
  } else {
    badgeText = 'ℹ️ [일반 트렌드 참고]';
    targetMargin = '마진율 15% ~ 25% 예상';
  }

  return {
    scorePercent: finalScore,
    badgeText,
    reasons: reasons.slice(0, 3),
    targetMargin,
  };
}
