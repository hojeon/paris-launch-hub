export type Category = '패션' | '뷰티' | '식품' | '테크' | '라이프스타일' | '기타';

export type ProductStatus = 'Inbox' | '검증 완료' | '출시 예정' | '출시 완료' | '관찰 목록' | '보관';

export type Reliability = '공식 발표' | '언론 보도' | 'SNS 정보';

export type Importance = '높음' | '중간' | '낮음';

export type PublishStatus = '대기' | '원고 완료' | '카드뉴스 완료' | '발행 완료';

export type TelegramStatus = '미전송' | '컨펌 대기중' | '승인 완료' | '보류';

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

export interface RssFeedSource {
  id: string;
  name: string;
  url: string;
  category: Category;
  description: string;
  isPreset?: boolean;
}

export interface ScoreDetails {
  isOfficialAnnouncement: boolean; // +3
  isAvailableForPurchase: boolean; // +3
  isParisExclusive: boolean;       // +2
  isMajorEvent: boolean;           // +2
  isTrustedMedia: boolean;         // +1
}

export interface ProductItem {
  id: string;
  collectedAt: string;         // 수집일
  brand: string;               // 브랜드
  productName: string;         // 제품명
  category: Category;          // 카테고리
  status: ProductStatus;       // 출시 상태
  launchDate: string;          // 파리 출시일
  location: string;            // 장소 (매장/팝업/온라인 등)
  price: string;               // 가격 (유로 기준)
  keyFeatures: string;         // 핵심 특징 (1~2문장)
  targetAudience: string;      // 타깃 고객
  sourceUrl: string;           // 출처 (기사/공식 페이지 링크)
  sourceName: string;          // 출처 매체/채널명
  reliability: Reliability;    // 신뢰도
  importance: Importance;     // 중요도 (자동 산출: 높음>=6, 중간 3~5, 낮음 <=2)
  importanceScore: number;     // 중요도 총점
  scoreDetails: ScoreDetails;  // 점수 산출 세부 내역
  followUp: string;            // 후속 조치

  // 발행 관리 필드
  naverStatus: PublishStatus;
  instaStatus: PublishStatus;
  imagePrepared: boolean;
  scheduledDate?: string;
  naverUrl?: string;
  instaUrl?: string;
  reusable?: boolean;

  // 텔레그램 승인 관리
  telegramStatus?: TelegramStatus;
  telegramSentAt?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  snippet: string;
  category: Category;
  suggestedBrand: string;
  suggestedProduct: string;
  suggestedLocation: string;
  suggestedPrice: string;
  isParsed: boolean;
}

