import React, { useState } from 'react';
import { ProductItem } from '../types';
import { 
  Copy, Check, FileText, Instagram, Sparkles, Download, 
  ChevronLeft, ChevronRight, Eye, RefreshCw, Share2 
} from 'lucide-react';

interface ContentFactoryProps {
  products: ProductItem[];
  selectedProduct: ProductItem | null;
  onSelectProduct: (product: ProductItem) => void;
}

export const ContentFactory: React.FC<ContentFactoryProps> = ({
  products,
  selectedProduct,
  onSelectProduct,
}) => {
  const [activeChannel, setActiveChannel] = useState<'naver' | 'instagram'>('naver');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState<number>(1);

  const product = selectedProduct || products[0];

  if (!product) {
    return (
      <div className="card shadow-md p-8 text-center">
        <h3>등록된 신제품이 없습니다.</h3>
        <p className="text-muted">신제품 DB에서 항목을 먼저 등록하거나 선택해주세요.</p>
      </div>
    );
  }

  // --- Naver Blog Post Generation ---
  const naverTitle = `파리 신제품 소식 | [${product.brand}] ${product.productName} 파리 공식 출시`;
  const naverContent = `🇫🇷 파리 현지 신제품 속보

[${product.brand}] ${product.productName}

━━━━━━━━━━━━━━━━━━━━━

📌 한눈에 보는 요약
• 브랜드: ${product.brand}
• 제품명: ${product.productName}
• 카테고리: ${product.category}
• 파리 출시일: ${product.launchDate}
• 파리 판매 장소: ${product.location}
• 가격: ${product.price}

━━━━━━━━━━━━━━━━━━━━━

✨ 1. 제품 상세 소개
프랑스 파리에서 주목받고 있는 ${product.brand}의 신작, "${product.productName}" 소식을 전해드립니다.
${product.keyFeatures}

🎯 2. 타깃 고객 및 추천 대상
- ${product.targetAudience}
- 파리 현지 신제품 및 한정판 스팟에 관심 있는 분

📍 3. 파리 출시일 & 구매 장소
- 공식 출시(예정)일: ${product.launchDate}
- 구매/체험 장소: ${product.location}
- 유로 가격: ${product.price}

💬 4. 현지 반응 및 특징 한줄평
"파리 현지 ${product.reliability}을 통해 검증된 소식으로, ${product.importanceScore >= 6 ? '상당히 주목할 만한 파리 주요 핫이슈' : '관심 있게 지켜볼 만한 신제품'}입니다."

🔗 5. 공식 링크 및 출처
- 정보 출처: ${product.sourceName} (${product.sourceUrl})

━━━━━━━━━━━━━━━━━━━━━

🏷️ 관련 키워드
#파리신제품 #프랑스출시 #파리팝업 #신제품출시일정 #${product.brand.replace(/\s+/g, '')} #${product.productName.replace(/\s+/g, '')} #파리쇼핑`;

  // --- Instagram Caption & Slides ---
  const instaCaption = `🇫🇷 파리 신제품 소식

[${product.brand}]가 ${product.productName}을(를) 출시합니다.

📍 출시 장소: ${product.location}
📅 출시일: ${product.launchDate}
💶 가격: ${product.price}
✨ 핵심 특징: ${product.keyFeatures}

파리에서 먼저 공개되는 이번 제품은
${product.targetAudience}에게 특히 주목받고 있습니다.

출처: ${product.sourceName}

#파리신제품 #프랑스브랜드 #파리쇼핑 #신제품출시 #${product.brand.replace(/\s+/g, '')} #${product.category}`;

  const slides = [
    {
      num: 1,
      tag: 'NEW LAUNCH IN PARIS',
      title: `${product.brand}`,
      subtitle: product.productName,
      footer: '🇫🇷 PARIS EXCLUSIVE NEWS',
      bgStyle: 'gradient-navy',
    },
    {
      num: 2,
      tag: 'WHAT IS NEW?',
      title: '무엇이 출시됐나요?',
      desc: product.keyFeatures,
      footer: `Category: ${product.category}`,
      bgStyle: 'gradient-dark',
    },
    {
      num: 3,
      tag: 'KEY FEATURES',
      title: '주요 특징 3가지',
      bullets: [
        `파리 현지 ${product.reliability} 확인 완료`,
        `주요 장소: ${product.location}`,
        `공식 출시가격: ${product.price}`,
      ],
      footer: 'PARIS LAUNCH HUB',
      bgStyle: 'gradient-gold',
    },
    {
      num: 4,
      tag: 'LOCATION & PRICE',
      title: '파리 출시 정보',
      infoGrid: [
        { label: '📅 출시일', val: product.launchDate },
        { label: '📍 장소', val: product.location },
        { label: '💶 가격', val: product.price },
      ],
      footer: 'SAVE FOR YOUR PARIS TRIP',
      bgStyle: 'gradient-rose',
    },
    {
      num: 5,
      tag: 'WHY IT MATTERS',
      title: '왜 주목할 만한가?',
      desc: `${product.targetAudience}에게 최적화된 신제품으로, 파리 현지 중요도 점수 ${product.importanceScore}점을 기록한 핫이슈입니다.`,
      footer: 'PARIS TREND REPORT',
      bgStyle: 'gradient-dark',
    },
    {
      num: 6,
      tag: 'SOURCE & SAVE',
      title: '정보 저장 & 공유',
      desc: `출처: ${product.sourceName}\n\n도움이 되셨다면 좋아요와 저장(Bookmark)을 눌러주세요! 📌`,
      footer: '@paris_launch_official',
      bgStyle: 'gradient-navy',
    },
  ];

  const handleCopyText = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="factory-container">
      {/* Product Selector Header */}
      <div className="card shadow-md mb-4 p-4">
        <div className="product-selector-bar">
          <div className="selector-label">
            <Sparkles size={18} className="text-gold" />
            <span>원고 생성 대상 신제품:</span>
          </div>

          <select
            value={product.id}
            onChange={(e) => {
              const found = products.find((p) => p.id === e.target.value);
              if (found) onSelectProduct(found);
            }}
            className="select-input product-select-lg"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.brand}] {p.productName} (중요도: +{p.importanceScore})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Channel Switch Tabs */}
      <div className="channel-switch-tabs mb-4">
        <button
          className={`channel-tab ${activeChannel === 'naver' ? 'active' : ''}`}
          onClick={() => setActiveChannel('naver')}
        >
          <FileText size={18} />
          <span>네이버 블로그 긴 원고 (SEO 최적화)</span>
        </button>

        <button
          className={`channel-tab ${activeChannel === 'instagram' ? 'active' : ''}`}
          onClick={() => setActiveChannel('instagram')}
        >
          <Instagram size={18} />
          <span>인스타그램 캐러셀 (6장 카드뉴스 & 캡션)</span>
        </button>
      </div>

      {/* NAVER BLOG SECTION */}
      {activeChannel === 'naver' && (
        <div className="card shadow-md">
          <div className="card-header space-between">
            <div>
              <h3>네이버 블로그 원고 자동 완성</h3>
              <p className="text-muted">검색 유입 SEO 제목 및 8단계 정률 포맷이 구성되었습니다.</p>
            </div>

            <div className="flex-gap-2">
              <button
                className="btn-outline btn-sm"
                onClick={() => handleCopyText(naverTitle, 'naver-title')}
              >
                {copiedType === 'naver-title' ? <Check size={14} /> : <Copy size={14} />}
                <span>제목만 복사</span>
              </button>

              <button
                className="btn-primary btn-sm"
                onClick={() => handleCopyText(`${naverTitle}\n\n${naverContent}`, 'naver-all')}
              >
                {copiedType === 'naver-all' ? <Check size={14} /> : <Copy size={14} />}
                <span>전체 원고 복사</span>
              </button>
            </div>
          </div>

          <div className="naver-preview-box">
            <div className="blog-title-box">
              <span className="blog-tag">네이버 블로그 제목</span>
              <h3 className="blog-title-text">{naverTitle}</h3>
            </div>

            <div className="blog-body-box">
              <pre className="blog-body-text">{naverContent}</pre>
            </div>
          </div>
        </div>
      )}

      {/* INSTAGRAM CAROUSEL SECTION */}
      {activeChannel === 'instagram' && (
        <div className="section-grid">
          {/* Left: Carousel Slide Visual Preview */}
          <div className="card shadow-md">
            <div className="card-header space-between">
              <div>
                <h3>인스타그램 6장 캐러셀 뷰어</h3>
                <p className="text-muted">카드뉴스 디자인 프리뷰입니다.</p>
              </div>

              <div className="slide-counter-badge">
                {currentSlide} / {slides.length} Slide
              </div>
            </div>

            {/* Slide Card Component */}
            <div className={`insta-slide-card ${slides[currentSlide - 1].bgStyle}`}>
              <div className="slide-top">
                <span className="slide-tag">{slides[currentSlide - 1].tag}</span>
                <span className="slide-number">0{currentSlide}</span>
              </div>

              <div className="slide-content font-playfair">
                <h2 className="slide-title">{slides[currentSlide - 1].title}</h2>
                {slides[currentSlide - 1].subtitle && (
                  <h3 className="slide-subtitle">{slides[currentSlide - 1].subtitle}</h3>
                )}
                {slides[currentSlide - 1].desc && (
                  <p className="slide-desc">{slides[currentSlide - 1].desc}</p>
                )}
                {slides[currentSlide - 1].bullets && (
                  <ul className="slide-bullets">
                    {slides[currentSlide - 1].bullets?.map((b, i) => (
                      <li key={i}>• {b}</li>
                    ))}
                  </ul>
                )}
                {slides[currentSlide - 1].infoGrid && (
                  <div className="slide-info-grid">
                    {slides[currentSlide - 1].infoGrid?.map((ig, i) => (
                      <div key={i} className="info-box">
                        <span className="lbl">{ig.label}</span>
                        <span className="val">{ig.val}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="slide-footer">
                <span>{slides[currentSlide - 1].footer}</span>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="slide-nav-controls">
              <button
                className="btn-outline btn-sm"
                disabled={currentSlide === 1}
                onClick={() => setCurrentSlide((prev) => Math.max(1, prev - 1))}
              >
                <ChevronLeft size={16} /> 이전 슬라이드
              </button>

              <div className="slide-dots">
                {slides.map((s) => (
                  <span
                    key={s.num}
                    className={`dot ${currentSlide === s.num ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(s.num)}
                  />
                ))}
              </div>

              <button
                className="btn-outline btn-sm"
                disabled={currentSlide === slides.length}
                onClick={() => setCurrentSlide((prev) => Math.min(slides.length, prev + 1))}
              >
                다음 슬라이드 <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Right: Caption Generator */}
          <div className="card shadow-md">
            <div className="card-header space-between">
              <div>
                <h3>인스타그램 캡션 & 해시태그</h3>
                <p className="text-muted">이모지와 추천 해시태그가 포함된 캡션입니다.</p>
              </div>

              <button
                className="btn-primary btn-sm"
                onClick={() => handleCopyText(instaCaption, 'insta-caption')}
              >
                {copiedType === 'insta-caption' ? <Check size={14} /> : <Copy size={14} />}
                <span>캡션 복사</span>
              </button>
            </div>

            <div className="caption-preview-box">
              <pre className="caption-text">{instaCaption}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
