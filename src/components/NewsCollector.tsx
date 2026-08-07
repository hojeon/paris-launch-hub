import React, { useState } from 'react';
import { NewsArticle, ProductItem } from '../types';
import { Search, Copy, Check, ExternalLink, PlusCircle, Bookmark, Rss, ArrowRight } from 'lucide-react';
import { calculateImportanceScore } from '../utils/scoreCalculator';

interface NewsCollectorProps {
  newsList: NewsArticle[];
  onImportToInbox: (product: Omit<ProductItem, 'id'>) => void;
  onRemoveNews: (newsId: string) => void;
}

export const NewsCollector: React.FC<NewsCollectorProps> = ({
  newsList,
  onImportToInbox,
  onRemoveNews,
}) => {
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('전체');

  const mediaList = [
    { name: 'Le Figaro', category: '総合/경제', url: 'https://www.lefigaro.fr' },
    { name: 'Les Échos', category: '경제/테크', url: 'https://www.lesechos.fr' },
    { name: 'Le Parisien', category: '파리 지역/라이프', url: 'https://www.leparisien.fr' },
    { name: 'BFM Business', category: '비즈니스/산업', url: 'https://www.bfmbusiness.bfmtv.com' },
    { name: 'Maddyness', category: '스타트업/테크', url: 'https://www.maddyness.com' },
    { name: 'FashionNetwork', category: '패션/뷰티', url: 'https://fr.fashionnetwork.com' },
    { name: 'Sortir à Paris', category: '팝업/디저트/문화', url: 'https://www.sortiraparis.com' },
    { name: 'Time Out Paris', category: '트렌드/트렌디 스팟', url: 'https://www.timeout.fr/paris' },
  ];

  const presetQueries = [
    { label: '영어 기본', query: `"Paris launch" new product` },
    { label: '프랑스어 기본', query: `"lancement à Paris" produit` },
    { label: '프랑스어 신제품', query: `"sortie à Paris" nouveauté` },
    { label: '패션위크 신제품', query: `"Paris Fashion Week" new product` },
    { label: '뷰티 파리', query: `beauty Paris launch` },
    { label: '테크 파리', query: `tech Paris launch` },
    { label: '식음료 파리', query: `food Paris nouveauté` },
  ];

  const recommendedBoolQuery = `("lancement" OR "nouveauté" OR "disponible") AND ("Paris" OR "France") AND (produit OR collection OR ouverture)`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(label);
    setTimeout(() => setCopiedQuery(null), 2000);
  };

  const handleQuickImport = (article: NewsArticle) => {
    const today = new Date().toISOString().split('T')[0];
    const initialDetails = {
      isOfficialAnnouncement: true,
      isAvailableForPurchase: false,
      isParisExclusive: true,
      isMajorEvent: false,
      isTrustedMedia: true,
    };
    const { score, level } = calculateImportanceScore(initialDetails);

    const newProduct: Omit<ProductItem, 'id'> = {
      collectedAt: today,
      brand: article.suggestedBrand || '미정 브랜드',
      productName: article.suggestedProduct || article.title,
      category: article.category,
      status: 'Inbox',
      launchDate: '일정 확인 필요',
      location: article.suggestedLocation || '파리 매장/팝업',
      price: article.suggestedPrice || '가격 확인 필요',
      keyFeatures: article.snippet,
      targetAudience: '파리 현지 소비자 & 직구족',
      sourceUrl: article.url,
      sourceName: article.source,
      reliability: '언론 보도',
      importance: level,
      importanceScore: score,
      scoreDetails: initialDetails,
      followUp: '공식 보도자료 및 추가 이미지 수집 필요',
      naverStatus: '대기',
      instaStatus: '대기',
      imagePrepared: false,
    };

    onImportToInbox(newProduct);
    onRemoveNews(article.id);
  };

  const filteredNews = selectedCategoryFilter === '전체'
    ? newsList
    : newsList.filter(n => n.category === selectedCategoryFilter);

  return (
    <div className="collector-container">
      {/* 1. Top Section: Google Alerts & Media Subscriber Guide */}
      <div className="section-grid">
        {/* Left: Google Alerts Keyword Builder */}
        <div className="card shadow-md">
          <div className="card-header">
            <div className="icon-wrapper gold"><Search size={20} /></div>
            <div>
              <h3>Google Alerts & 검색 키워드 조합기</h3>
              <p className="text-muted">한국어·영어·프랑스어를 조합하여 수집 정확도를 높이세요.</p>
            </div>
          </div>

          <div className="query-presets">
            {presetQueries.map((item, idx) => (
              <div key={idx} className="query-chip" onClick={() => handleCopy(item.query, item.label)}>
                <span className="chip-label">{item.label}</span>
                <code className="chip-code">{item.query}</code>
                {copiedQuery === item.label ? <Check size={14} className="text-gold" /> : <Copy size={14} />}
              </div>
            ))}
          </div>

          <div className="bool-query-box">
            <div className="bool-title">
              <span>💡 프랑스어 추천 정밀 검색식</span>
              <button 
                className="btn-text" 
                onClick={() => handleCopy(recommendedBoolQuery, 'boolean')}
              >
                {copiedQuery === 'boolean' ? <Check size={14} /> : <Copy size={14} />}
                <span>검색식 복사</span>
              </button>
            </div>
            <textarea readOnly value={recommendedBoolQuery} className="code-textarea" />
          </div>
        </div>

        {/* Right: France Media Channels */}
        <div className="card shadow-md">
          <div className="card-header">
            <div className="icon-wrapper navy"><Rss size={20} /></div>
            <div>
              <h3>프랑스 파리 추천 매체 구독 (8선)</h3>
              <p className="text-muted">카테고리별 현지 매체를 모니터링하여 속보를 탐지하세요.</p>
            </div>
          </div>

          <div className="media-grid">
            {mediaList.map((media, idx) => (
              <a 
                key={idx} 
                href={media.url} 
                target="_blank" 
                rel="noreferrer" 
                className="media-card-link"
              >
                <div className="media-info">
                  <span className="media-name">{media.name}</span>
                  <span className="media-cat">{media.category}</span>
                </div>
                <ExternalLink size={14} className="text-muted" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Bottom Section: Live Feed to DB Inbox Import */}
      <div className="card shadow-md margin-top-lg">
        <div className="card-header space-between">
          <div className="header-with-badge">
            <div className="icon-wrapper rose"><Bookmark size={20} /></div>
            <div>
              <h3>실시간 파리 속보 뉴스 & 1-Click DB 수집함</h3>
              <p className="text-muted">탐지된 뉴스를 확인하고 바로 DB Inbox로 가져오세요.</p>
            </div>
          </div>

          <div className="filter-chips">
            {['전체', '패션', '뷰티', '식품', '테크'].map(cat => (
              <button
                key={cat}
                className={`chip-btn ${selectedCategoryFilter === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategoryFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredNews.length === 0 ? (
          <div className="empty-state">
            <Check size={40} className="text-muted mb-2" />
            <h4>모든 최신 뉴스가 DB Inbox로 수집되었습니다.</h4>
            <p className="text-muted">상단의 키워드로 새로운 기사를 탐색해보세요!</p>
          </div>
        ) : (
          <div className="news-feed-list">
            {filteredNews.map((article) => (
              <div key={article.id} className="news-item-card">
                <div className="news-meta">
                  <span className="badge-cat">{article.category}</span>
                  <span className="source-tag">{article.source}</span>
                  <span className="date-tag">{article.publishedAt}</span>
                </div>

                <h4 className="news-title">{article.title}</h4>
                <p className="news-snippet">{article.snippet}</p>

                <div className="parsed-preview-box">
                  <div className="preview-pill">
                    <strong>추출 브랜드:</strong> {article.suggestedBrand}
                  </div>
                  <div className="preview-pill">
                    <strong>추출 제품:</strong> {article.suggestedProduct}
                  </div>
                  <div className="preview-pill">
                    <strong>장소:</strong> {article.suggestedLocation}
                  </div>
                  <div className="preview-pill">
                    <strong>예상가격:</strong> {article.suggestedPrice}
                  </div>
                </div>

                <div className="news-card-actions">
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn-outline btn-sm"
                  >
                    <span>원문 읽기</span>
                    <ExternalLink size={14} />
                  </a>

                  <button 
                    className="btn-primary btn-sm"
                    onClick={() => handleQuickImport(article)}
                  >
                    <PlusCircle size={14} />
                    <span>DB Inbox에 1-Click 추가</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
