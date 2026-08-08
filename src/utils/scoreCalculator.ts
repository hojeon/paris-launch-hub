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

export interface DeepBuyingAgencyAnalysis {
  scorePercent: number;           // 0 ~ 100%
  badgeText: string;              // e.g. "🔥 [초고수익 현지 바잉 대박]"
  priceArbitrage: string;         // e.g. "한국 매장가 대비 ~35% 가격 차익 (TVA 12% 환급)"
  volumetricRisk: '안전 (소형/가벼움)' | '주의 (부피무게 발생)' | '위험 (오버사이즈)'; 
  sourcingDifficulty: '온라인 직구 가능' | '파리 현지 바잉 필수 (구매제한)' | '팝업스토어 현장 대기';
  customsCheck: string;           // e.g. "목록통관 무관세 (150불 이하)"
  reasons: string[];
  targetAudienceTag: string;      // e.g. "2030 파리 감성 직구족"
}

/**
 * Real-world Expert Buying Agency Assessment Engine (7 Deep Factors)
 */
export function calculateDeepBuyingAgencySuitability(article: Partial<NewsArticle>): DeepBuyingAgencyAnalysis {
  let score = 55;
  const reasons: string[] = [];

  const text = ((article.title || '') + ' ' + (article.snippet || '') + ' ' + (article.suggestedPrice || '')).toLowerCase();
  const category = article.category || '패션';

  // 1. Price Arbitrage & Tax Refund (유로 환율 & TVA 12~20% 실체)
  const priceMatch = (article.suggestedPrice || '').match(/\d+/);
  const numericPrice = priceMatch ? parseInt(priceMatch[0], 10) : 0;
  let priceArbitrage = '한국 매장가 대비 ~25% 가격 차익';
  let customsCheck = '일반 수입 통관 대상';

  if (numericPrice > 0 && numericPrice <= 135) {
    score += 20;
    customsCheck = '⚡ 목록통관 무관세 대상 (150불 이하 / 관부과세 0원)';
    priceArbitrage = '무관세 + 유로 직구 메리트 최고 (직구족 결제 전환 95%)';
    reasons.push('💰 135€ 이하 목록통관 무관세 (관부과세 0원 / 가격 경쟁력 1위)');
  } else if (numericPrice > 135 && numericPrice <= 350) {
    score += 15;
    customsCheck = '관부과세 과세 (FTA 원산지 증명 시 관세 면제 가능)';
    priceArbitrage = '파리 현지 TVA 12% 택스리프리 환급으로 마진 30% 확보';
    reasons.push('💶 프랑스 택스리프리(12%) 환급 마진 우수');
  } else if (numericPrice > 350) {
    score += 10;
    customsCheck = '고액 수입 통관 (개인통관고유부호 필수)';
    priceArbitrage = '한국 정발가 대비 40~100만 원 가격 차익 (럭셔리 프리미엄)';
    reasons.push('💎 한국 매장 정발가 대비 고액 가격 차익 수수료 수입');
  }

  // 2. Volumetric Weight vs Freight Risk (부피무게 폭탄 방지)
  let volumetricRisk: '안전 (소형/가벼움)' | '주의 (부피무게 발생)' | '위험 (오버사이즈)' = '안전 (소형/가벼움)';
  if (category === '뷰티' || text.includes('parfum') || text.includes('serum') || text.includes('creme') || text.includes('buly')) {
    score += 15;
    volumetricRisk = '안전 (소형/가벼움)';
    reasons.push('📦 소형/경량 포장 (국제 항공 배송비 1만 원 안팎으로 적자 위험 0%)');
  } else if (text.includes('sac') || text.includes('bag') || text.includes('bijoux') || text.includes('hat') || text.includes('écharpe')) {
    score += 15;
    volumetricRisk = '안전 (소형/가벼움)';
    reasons.push('👗 잡화/가죽 소품 (파손 위험 낮고 부피무게 안전)');
  } else if (text.includes('manteau') || text.includes('jacket') || text.includes('sneakers') || text.includes('chaussures')) {
    score += 5;
    volumetricRisk = '주의 (부피무게 발생)';
    reasons.push('⚠️ 신발 상자/아우터 부피무게 적용 유의 (기본 배송비 2~3만 원대)');
  }

  // 3. Sourcing Difficulty & Channel (구하기 난이도)
  let sourcingDifficulty: '온라인 직구 가능' | '파리 현지 바잉 필수 (구매제한)' | '팝업스토어 현장 대기' = '온라인 직구 가능';
  if (text.includes('marais') || text.includes('마레') || text.includes('pop-up') || text.includes('popup') || text.includes('éphémère')) {
    score += 20;
    sourcingDifficulty = '팝업스토어 현장 대기';
    reasons.push('📍 파리 현지 팝업스토어 대기 현장 바잉 (희소성 300% / 수수료 높음)');
  } else if (text.includes('sezane') || text.includes('rouje') || text.includes('polene') || text.includes('buly') || text.includes('dior')) {
    score += 15;
    sourcingDifficulty = '파리 현지 바잉 필수 (구매제한)';
    reasons.push('🔒 여권/카드 수량 제한 브랜드 (현지 바이어 인력 강점)');
  }

  // 4. Korea Target Audience Psychographics (한국 세대별 직구 타겟)
  let targetAudienceTag = '2030 파리 감성 여성 직구족';
  if (category === '뷰티') {
    targetAudienceTag = '파리 약국 화장품 & 니치 퍼퓸 마니아';
  } else if (category === '식품') {
    targetAudienceTag = '파리 아티장 디저트 & 고메 선물 직구족';
  } else if (text.includes('homme') || text.includes('men')) {
    targetAudienceTag = '3040 트렌디 남성 & 파리 한정 스니커즈 매니아';
  }

  const finalScore = Math.min(Math.max(score, 45), 98);

  let badgeText = '👍 [안정적 수익 구매대행]';
  if (finalScore >= 85) {
    badgeText = '🔥 [초고수익 현지 바잉 대박]';
  } else if (finalScore >= 70) {
    badgeText = '👍 [꾸준한 해외 직구 인기작]';
  } else {
    badgeText = 'ℹ️ [일반 트렌드 수집작]';
  }

  return {
    scorePercent: finalScore,
    badgeText,
    priceArbitrage,
    volumetricRisk,
    sourcingDifficulty,
    customsCheck,
    reasons: reasons.slice(0, 3),
    targetAudienceTag,
  };
}
