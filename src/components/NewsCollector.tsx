import React, { useState } from 'react';
import { NewsArticle, ProductItem, RssFeedSource } from '../types';
import { Search, Copy, Check, ExternalLink, PlusCircle, Bookmark, Rss, RefreshCw, Zap, Trash2, Share2, Instagram, Video, Linkedin, ShieldCheck, X, Bot, Cpu } from 'lucide-react';
import { calculateImportanceScore } from '../utils/scoreCalculator';
import { PRESET_RSS_SOURCES, fetchRssArticles, fetchSingleSiteFullRss } from '../utils/rssFetcher';
import { runAiWebCrawler } from '../utils/aiCrawlerService';
import { runSnsAutoCrawler } from '../utils/snsAutoCrawler';
import { sendProductApprovalRequest, getTelegramConfig } from '../utils/telegramService';

interface NewsCollectorProps {
  newsList: NewsArticle[];
  onImportToInbox: (product: Omit<ProductItem, 'id'>) => void;
  onRemoveNews: (newsId: string) => void;
  onAddNewsArticles: (newArticles: NewsArticle[]) => void;
  onClearNewsList?: () => void;
}

export const NewsCollector: React.FC<NewsCollectorProps> = ({
  newsList,
  onImportToInbox,
  onRemoveNews,
  onAddNewsArticles,
  onClearNewsList,
}) => {
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('전체');
  const [isFetchingRss, setIsFetchingRss] = useState<boolean>(false);
  const [isAiCrawling, setIsAiCrawling] = useState<boolean>(false);
  const [rssMessage, setRssMessage] = useState<string | null>(null);
  const [customRssUrl, setCustomRssUrl] = useState<string>('');
  const [autoImportDirectly, setAutoImportDirectly] = useState<boolean>(false);

  const convertArticleToProduct = (article: NewsArticle): Omit<ProductItem, 'id'> => {
    const today = new Date().toISOString().split('T')[0];
    const initialDetails = {
      isOfficialAnnouncement: true,
      isAvailableForPurchase: false,
      isParisExclusive: true,
      isMajorEvent: false,
      isTrustedMedia: true,
    };
    const { score, level } = calculateImportanceScore(initialDetails);

    return {
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
      reliability: '언론 보도 / AI 탐색',
      importance: level,
      importanceScore: score,
      scoreDetails: initialDetails,
      followUp: '공식 보도자료 및 추가 이미지 수집 필요',
      naverStatus: '대기',
      instaStatus: '대기',
      imagePrepared: false,
    };
  };

  // 1, 3, 4번 통합: ① AI Web Crawler + ③ Web Scraper + ④ SNS Auto Crawler 3중 완전 자동화 수집 봇
  const handleRunFullAutomationBot = async () => {
    setIsAiCrawling(true);
    setIsFetchingRss(true);
    setRssMessage('🤖 [Full Automation Engine] ① AI Web Crawler + ③ Web Scraper + ④ SNS Auto Crawler 3중 자동 수집 구동 중...');

    let allCollected: NewsArticle[] = [];

    // Step 1: ① AI Web Crawler (Jina AI) - Paris Indie Brands & Niche Launch Search
    try {
      const aiArticles = await runAiWebCrawler('Paris launch new product indie brand niche beauty');
      allCollected = [...allCollected, ...aiArticles];
    } catch (e) {}

    // Step 2: ④ SNS Auto Crawler (Instagram & TikTok #popupparis #marqueindependante)
    try {
      const snsArticles = await runSnsAutoCrawler('popupparis');
      allCollected = [...allCollected, ...snsArticles];
    } catch (e) {}

    // Step 3: RSS Feed & 3-Tier Boolean Query Fetcher
    for (const source of PRESET_RSS_SOURCES) {
      const articles = await fetchRssArticles(source);
      allCollected = [...allCollected, ...articles];
    }

    if (autoImportDirectly || true) {
      let count = 0;
      const tgConfig = getTelegramConfig();
      for (const article of allCollected) {
        const prod = convertArticleToProduct(article);
        onImportToInbox(prod);
        count++;
        if (tgConfig.enabled) {
          sendProductApprovalRequest(tgConfig, { ...prod, id: `auto-bot-${Date.now()}` } as ProductItem);
        }
      }
      onAddNewsArticles(allCollected);
      setRssMessage(`🚀 [완전 자동화 수집 완료] AI 크롤러 + SNS 트렌드 + RSS 3중 엔진으로 총 ${count}건의 기사가 DB Inbox로 100% 자동 등록되었습니다!`);
    }

    setIsAiCrawling(false);
    setIsFetchingRss(false);
    setTimeout(() => setRssMessage(null), 6000);
  };

  // 단일 사이트 (FashionNetwork) 원본 피드 검증 파이프라인
  const handleTestSingleSiteFeed = async () => {
    setIsFetchingRss(true);
    setRssMessage('🧪 FashionNetwork FR (fr,0.xml) 피드에서 검색어 필터 없이 원본 XML 파싱 중...');
    const result = await fetchSingleSiteFullRss('https://fr.fashionnetwork.com/rss/feed/fr,0.xml');

    if (result.articles.length > 0) {
      onAddNewsArticles(result.articles);
      setRssMessage(`✅ FashionNetwork XML (${Math.round(result.sourceXmlBytes / 1024)}KB) 파싱 성공! ${result.articles.length}건의 원본 기사를 목록에 추가했습니다.`);
    } else {
      setRssMessage('⚠️ FashionNetwork XML 파싱 실패: 네트워크 상태를 확인하세요.');
    }

    setIsFetchingRss(false);
    setTimeout(() => setRssMessage(null), 5000);
  };

  const handleFetchPresetRss = async (feed: RssFeedSource) => {
    setIsFetchingRss(true);
    setRssMessage(`${feed.name} 라이브 RSS 수집 중...`);
    const articles = await fetchRssArticles(feed);

    if (autoImportDirectly) {
      let count = 0;
      const tgConfig = getTelegramConfig();
      for (const article of articles) {
        const prod = convertArticleToProduct(article);
        onImportToInbox(prod);
        count++;
        if (tgConfig.enabled) {
          sendProductApprovalRequest(tgConfig, { ...prod, id: `auto-${Date.now()}` } as ProductItem);
        }
      }
      setRssMessage(`⚡ ${count}개의 라이브 RSS 소식이 DB Inbox로 100% 자동 등록되었습니다!`);
    } else {
      onAddNewsArticles(articles);
      setRssMessage(`${feed.name} 피드에서 ${articles.length}개의 최신 라이브 기사를 불러왔습니다!`);
    }

    setIsFetchingRss(false);
    setTimeout(() => setRssMessage(null), 3500);
  };

  const handleFetchAllRss = async () => {
    setIsFetchingRss(true);
    setRssMessage('FashionNetwork, Google News Indie & 럭셔리 라이브 RSS 파싱 중...');
    let allNew: NewsArticle[] = [];
    for (const source of PRESET_RSS_SOURCES) {
      const articles = await fetchRssArticles(source);
      allNew = [...allNew, ...articles];
    }

    if (autoImportDirectly) {
      let count = 0;
      const tgConfig = getTelegramConfig();
      for (const article of allNew) {
        const prod = convertArticleToProduct(article);
        onImportToInbox(prod);
        count++;
        if (tgConfig.enabled) {
          sendProductApprovalRequest(tgConfig, { ...prod, id: `auto-${Date.now()}` } as ProductItem);
        }
      }
      setRssMessage(`⚡ 총 ${count}개의 최신 인디 & 럭셔리 기사가 DB Inbox에 자동 등록 완료되었습니다!`);
    } else {
      onAddNewsArticles(allNew);
      setRssMessage(`총 ${allNew.length}개의 파리 인디 & 럭셔리 속보 기사를 성공적으로 수집했습니다!`);
    }

    setIsFetchingRss(false);
    setTimeout(() => setRssMessage(null), 4000);
  };

  const handleFetchCustomRss = async () => {
    if (!customRssUrl.trim()) return;
    setIsFetchingRss(true);
    setRssMessage('커스텀 RSS 피드 주소 파싱 중...');
    const customSource: RssFeedSource = {
      id: `rss-custom-${Date.now()}`,
      name: '커스텀 RSS 피드',
      url: customRssUrl.trim(),
      category: '기타',
      description: '사용자 지정 RSS 수집원',
    };
    const articles = await fetchRssArticles(customSource);
    
    if (autoImportDirectly) {
      for (const article of articles) {
        onImportToInbox(convertArticleToProduct(article));
      }
      setRssMessage(`⚡ ${articles.length}개의 뉴스가 DB Inbox에 자동 등록되었습니다.`);
    } else {
      onAddNewsArticles(articles);
      setRssMessage(`${articles.length}개의 뉴스를 수집했습니다.`);
    }
    setIsFetchingRss(false);
    setCustomRssUrl('');
    setTimeout(() => setRssMessage(null), 3500);
  };

  // 프랑스 24선 매거진 & 추천 매체 목록
  const mediaList = [
    { name: 'Le Figaro', category: '総合/경제', url: 'https://www.lefigaro.fr' },
    { name: 'Les Échos', category: '경제/테크', url: 'https://www.lesechos.fr' },
    { name: 'Le Parisien', category: '파리 라이프', url: 'https://www.leparisien.fr' },
    { name: 'BFM Business', category: '비즈니스/산업', url: 'https://www.bfmbusiness.bfmtv.com' },
    { name: 'Maddyness', category: '스타트업/테크/인디', url: 'https://www.maddyness.com' },
    { name: 'FashionNetwork', category: '패션/뷰티 전문', url: 'https://fr.fashionnetwork.com' },
    { name: 'Sortir à Paris', category: '팝업/인디스팟/문화', url: 'https://www.sortiraparis.com' },
    { name: 'Time Out Paris', category: '트렌디/인디 팝업', url: 'https://www.timeout.fr/paris' },
    { name: 'Vogue France', category: '럭셔리 패션 매거진', url: 'https://www.vogue.fr' },
    { name: 'L\'Officiel Paris', category: '하이패션 매거진', url: 'https://www.lofficiel.com' },
    { name: 'Elle France', category: '뷰티/패션 매거진', url: 'https://www.elle.fr' },
    { name: 'GQ France', category: '남성 라이프스타일', url: 'https://www.gqmagazine.fr' },
    { name: 'Vanity Fair FR', category: '문화/럭셔리', url: 'https://www.vanityfair.fr' },
    { name: 'Marie Claire FR', category: '뷰티 & 트렌드', url: 'https://www.marieclaire.fr' },
    { name: 'Harper\'s Bazaar FR', category: '주얼리/하이패션', url: 'https://www.harpersbazaar.fr' },
    { name: 'Numéro Magazine', category: '예술/디자인 매거진', url: 'https://www.numero.com' },
    { name: 'AD Magazine FR', category: '인테리어/디자인', url: 'https://www.admagazine.fr' },
    { name: 'Madame Figaro', category: '라이프/뷰티', url: 'https://madame.lefigaro.fr' },
    { name: 'Milk Magazine', category: '인디 라이프/키즈', url: 'https://www.milkmagazine.net' },
    { name: 'LSA Conso', category: '유통/신제품 출시', url: 'https://www.lsa-conso.fr' },
    { name: 'PR Newswire FR', category: '보도자료 배포망', url: 'https://www.prnewswire.com/fr/' },
    { name: 'Business Wire FR', category: '글로벌 런칭 배포', url: 'https://www.businesswire.com' },
    { name: 'Cision France', category: '지사 공식 배포', url: 'https://www.cision.fr' },
    { name: 'JDN', category: '디지털/테크 커머스', url: 'https://www.journaldunet.com' },
  ];

  // SNS 해시태그 딥링크 리스트
  const snsHashtags = [
    { name: '#marqueindependante', desc: '파리 인디 브랜드 태그 🎨', insta: 'https://www.instagram.com/explore/tags/marqueindependante/', tiktok: 'https://www.tiktok.com/tag/marqueindependante', linkedin: 'https://www.linkedin.com/feed/hashtag/?keywords=marqueindependante' },
    { name: '#lancementproduit', desc: '제품 런칭 공식 태그', insta: 'https://www.instagram.com/explore/tags/lancementproduit/', tiktok: 'https://www.tiktok.com/tag/lancementproduit', linkedin: 'https://www.linkedin.com/feed/hashtag/?keywords=lancementproduit' },
    { name: '#nouveauté', desc: '신제품/신상 키워드', insta: 'https://www.instagram.com/explore/tags/nouveaut%C3%A9/', tiktok: 'https://www.tiktok.com/tag/nouveaute', linkedin: 'https://www.linkedin.com/feed/hashtag/?keywords=nouveaut%C3%A9' },
    { name: '#popupparis', desc: '파리 팝업스토어 현장', insta: 'https://www.instagram.com/explore/tags/popupparis/', tiktok: 'https://www.tiktok.com/tag/popupparis', linkedin: 'https://www.linkedin.com/feed/hashtag/?keywords=popupparis' },
    { name: '#parislaunch', desc: '파리 런칭 속보', insta: 'https://www.instagram.com/explore/tags/parislaunch/', tiktok: 'https://www.tiktok.com/tag/parislaunch', linkedin: 'https://www.linkedin.com/feed/hashtag/?keywords=parislaunch' },
    { name: '#ouvertureparis', desc: '파리 매장 신규 오픈', insta: 'https://www.instagram.com/explore/tags/ouvertureparis/', tiktok: 'https://www.tiktok.com/tag/ouvertureparis', linkedin: 'https://www.linkedin.com/feed/hashtag/?keywords=ouvertureparis' },
  ];

  // 정밀 키워드 프리셋 16종 (인디 브랜드 & 니치 뷰티 포함)
  const presetQueries = [
    { label: '🎨 파리 인디 크리에이터 3중', query: `("Paris" OR "Marais") AND ("marque indépendante" OR "jeune créateur" OR "boutique éphémère") AND (mode OR beauté)` },
    { label: '🌿 니치 뷰티 & 향수 (영문)', query: `("Paris" OR "French") AND ("niche beauty" OR "indie perfume" OR "artisanal cosmetics")` },
    { label: '영어 3중 고급 (최상급)', query: `("Paris" OR "French") AND ("new collection" OR "product launch" OR "flagship store" OR "pop-up store") AND (fashion OR beauty OR luxury)` },
    { label: '프랑스어 3중 고급', query: `("lancement" OR "nouveauté" OR "disponible" OR "exclusivité") AND ("Paris" OR "France") AND (produit OR collection)` },
    { label: '프랑스어 팝업스토어', query: `"boutique éphémère" Paris nouveauté` },
    { label: '영어 팝업/리미티드', query: `("Paris" OR "Parisian") AND ("popup" OR "pop-up" OR "boutique opening" OR "limited edition")` },
    { label: '프랑스 공식출시', query: `"disponible en France" nouveau` },
    { label: '영어 패션위크', query: `("Paris Fashion Week" OR "Paris flagship") AND ("new line" OR "unveiled" OR "launches")` },
    { label: '뷰티 영문', query: `beauty Paris launch new product` },
    { label: '뷰티 프랑스어', query: `beauté "lancement à Paris"` },
    { label: '디저트/아티장 미식', query: `artisan pâtisserie Paris nouveauté` },
    { label: '마레 지구 팝업스토어', query: `"Le Marais" "pop-up" Paris launch` },
  ];

  const recommendedBoolIndieEn = `("Paris" OR "French") AND ("indie brand" OR "emerging designer" OR "niche beauty" OR "artisanal" OR "pop-up store") AND (fashion OR beauty OR lifestyle OR perfume)`;
  const recommendedBoolQueryFr = `("lancement" OR "nouveauté" OR "disponible" OR "exclusivité" OR "boutique éphémère" OR "pop-up") AND ("Paris" OR "France") AND (produit OR collection OR ouverture OR flagship OR "avant-première")`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(label);
    setTimeout(() => setCopiedQuery(null), 2000);
  };

  const handleQuickImport = (article: NewsArticle) => {
    onImportToInbox(convertArticleToProduct(article));
    onRemoveNews(article.id);
  };

  const filteredNews = selectedCategoryFilter === '전체'
    ? newsList
    : newsList.filter(n => n.category === selectedCategoryFilter);

  return (
    <div className="collector-container">
      {/* Top Banner: Full Automation Bot Launcher (1, 3, 4번 통합) */}
      <div className="card shadow-md mb-4" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: '#ffffff', border: '1px solid #4338ca' }}>
        <div className="card-header space-between" style={{ borderBottom: 'none', paddingBottom: '0' }}>
          <div className="flex items-center gap-3">
            <div style={{ background: '#4f46e5', padding: '10px', borderRadius: '12px', display: 'flex' }}>
              <Bot size={28} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ color: '#ffffff', fontSize: '1.2rem', margin: 0 }}>🤖 [Full Automation Bot] 1, 3, 4번 통합 완전 자동화 수집 봇</h3>
              <p style={{ color: '#c7d2fe', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                ① AI Web Crawler (Jina AI) + ③ Web Scraper Relay + ④ SNS Auto Crawler (Insta/TikTok) 3중 자동 파이프라인
              </p>
            </div>
          </div>

          <button
            onClick={handleRunFullAutomationBot}
            disabled={isAiCrawling}
            className="btn-primary"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', border: 'none', padding: '12px 24px', fontSize: '0.95rem', fontWeight: 700, borderRadius: '8px', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)' }}
          >
            <Cpu size={18} className={isAiCrawling ? 'spin' : ''} />
            <span>{isAiCrawling ? '🤖 AI + SNS + Web 3중 자동 수집 중...' : '🚀 3중 완전 자동화 수집 봇 실행'}</span>
          </button>
        </div>
      </div>

      {/* 1. Top Section: Google Alerts & Media Subscriber Guide */}
      <div className="section-grid">
        {/* Left: Google Alerts Keyword Builder */}
        <div className="card shadow-md">
          <div className="card-header">
            <div className="icon-wrapper gold"><Search size={20} /></div>
            <div>
              <h3>Google Alerts & 정밀 키워드 조합기 (인디/니치 포함 16종)</h3>
              <p className="text-muted">파리 소규모 인디 브랜드, 신진 디자이너, 니치 뷰티 & 럭셔리 통합 3중 검색식</p>
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

          <div className="bool-query-box" style={{ marginBottom: '8px', background: '#f0fdf4', border: '1px solid #86efac' }}>
            <div className="bool-title" style={{ color: '#166534' }}>
              <span>🎨 파리 소규모 인디 브랜드 & 니치 뷰티 전용 3중 검색식 (추천)</span>
              <button 
                className="btn-text" 
                onClick={() => handleCopy(recommendedBoolIndieEn, 'bool_indie')}
                style={{ color: '#15803d' }}
              >
                {copiedQuery === 'bool_indie' ? <Check size={14} /> : <Copy size={14} />}
                <span>인디 검색식 복사</span>
              </button>
            </div>
            <textarea readOnly value={recommendedBoolIndieEn} className="code-textarea" style={{ height: '55px', background: '#ffffff' }} />
          </div>

          <div className="bool-query-box">
            <div className="bool-title">
              <span>🇫🇷 프랑스어 파리 전용 고급 3중 정밀 검색식</span>
              <button 
                className="btn-text" 
                onClick={() => handleCopy(recommendedBoolQueryFr, 'bool_fr')}
              >
                {copiedQuery === 'bool_fr' ? <Check size={14} /> : <Copy size={14} />}
                <span>불문 검색식 복사</span>
              </button>
            </div>
            <textarea readOnly value={recommendedBoolQueryFr} className="code-textarea" style={{ height: '55px' }} />
          </div>
        </div>

        {/* Right: France Media Channels */}
        <div className="card shadow-md">
          <div className="card-header">
            <div className="icon-wrapper navy"><Rss size={20} /></div>
            <div>
              <h3>프랑스 파리 추천 언론 & 매거진 (24선)</h3>
              <p className="text-muted">인디 디자이너, 팝업스토어, 니치 뷰티 & 하이엔드 매거진</p>
            </div>
          </div>

          <div className="media-grid" style={{ maxHeight: '430px', overflowY: 'auto', paddingRight: '4px' }}>
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

      {/* 2. SNS & Community Hashtag Deep Link Explorer */}
      <div className="card shadow-md margin-top-lg mb-4">
        <div className="card-header">
          <div className="icon-wrapper rose"><Share2 size={20} /></div>
          <div>
            <h3>SNS & 커뮤니티 트렌드 탐색기 (Instagram / TikTok / LinkedIn)</h3>
            <p className="text-muted">파리 인디 브랜드(`#marqueindependante`), 팝업 현장 핵심 해시태그 실시간 원클릭 딥링크</p>
          </div>
        </div>

        <div className="routine-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {snsHashtags.map((ht, idx) => (
            <div key={idx} className="routine-card" style={{ background: '#ffffff', border: '1px solid var(--border-color)' }}>
              <div className="flex justify-between items-center mb-1">
                <strong style={{ color: 'var(--accent-gold)', fontSize: '1rem' }}>{ht.name}</strong>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>{ht.desc}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <a href={ht.insta} target="_blank" rel="noreferrer" className="btn-outline btn-xs flex items-center gap-1" title="인스타그램 탐색">
                  <Instagram size={12} color="#e1306c" /> Instagram
                </a>
                <a href={ht.tiktok} target="_blank" rel="noreferrer" className="btn-outline btn-xs flex items-center gap-1" title="틱톡 탐색">
                  <Video size={12} color="#00f2fe" /> TikTok
                </a>
                <a href={ht.linkedin} target="_blank" rel="noreferrer" className="btn-outline btn-xs flex items-center gap-1" title="LinkedIn 탐색">
                  <Linkedin size={12} color="#0a66c2" /> LinkedIn
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Bottom Section: Live Feed to DB Inbox Import & Live RSS Fetcher */}
      <div className="card shadow-md">
        <div className="card-header space-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div className="header-with-badge">
            <div className="icon-wrapper rose"><Bookmark size={20} /></div>
            <div>
              <h3>실시간 파리 속보 뉴스 & 신제품 자동 등록 엔진</h3>
              <p className="text-muted">파리 인디 브랜드 & 럭셔리 라이브 RSS 탐지 ➔ 14개 필드 파싱 ➔ DB Inbox 직행</p>
            </div>
          </div>

          <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap' }}>
            {/* Single Site Pure Test Button */}
            <button
              className="btn-secondary btn-sm"
              onClick={handleTestSingleSiteFeed}
              disabled={isFetchingRss}
              style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc', fontWeight: 600 }}
              title="검색어 조건 없는 단일 피드 (fr,0.xml) 전체 원본 파싱 테스트"
            >
              <ShieldCheck size={14} />
              <span>🧪 FashionNetwork 원본 피드 100% 파싱 테스트</span>
            </button>

            {/* Clear All List Button */}
            {onClearNewsList && newsList.length > 0 && (
              <button
                className="btn-outline btn-sm"
                onClick={onClearNewsList}
                title="이전 대기 수집 목록 100% 전체 비우기"
                style={{ color: 'var(--accent-rose)', border: '1px solid var(--accent-rose)', fontWeight: 600 }}
              >
                <Trash2 size={14} />
                <span>수집 목록 전체 비우기 ({newsList.length}건)</span>
              </button>
            )}

            {/* Auto Import Toggle Switch */}
            <label className="flex items-center gap-2" style={{ cursor: 'pointer', background: 'rgba(217, 119, 6, 0.1)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-gold)' }}>
              <input
                type="checkbox"
                checked={autoImportDirectly}
                onChange={(e) => setAutoImportDirectly(e.target.checked)}
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <Zap size={16} className="text-gold" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-gold)' }}>
                {autoImportDirectly ? '⚡ DB Inbox 자동 등록 ON' : 'DB Inbox 자동 등록 OFF'}
              </span>
            </label>

            <button
              className="btn-primary"
              onClick={handleFetchAllRss}
              disabled={isFetchingRss}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={16} className={isFetchingRss ? 'spin' : ''} />
              <span>{isFetchingRss ? '자동 수집 중...' : '전체 RSS 파싱 & DB 자동 등록'}</span>
            </button>
          </div>
        </div>

        {/* Live RSS Preset Source Toolbar */}
        <div className="rss-toolbar mb-4" style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--accent-gold)' }}>
            📡 실시간 파리 매체 RSS 선택 수집:
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_RSS_SOURCES.map((source) => (
              <button
                key={source.id}
                className="btn-secondary btn-sm"
                onClick={() => handleFetchPresetRss(source)}
                disabled={isFetchingRss}
                style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Rss size={12} />
                <span>{source.name}</span>
              </button>
            ))}
          </div>

          {/* Custom RSS URL Input */}
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="커스텀 RSS XML URL 입력 (예: https://example.com/rss.xml)"
              value={customRssUrl}
              onChange={(e) => setCustomRssUrl(e.target.value)}
              className="input-field"
              style={{ fontSize: '0.85rem', padding: '6px 12px', flex: 1 }}
            />
            <button
              className="btn-secondary btn-sm"
              onClick={handleFetchCustomRss}
              disabled={isFetchingRss || !customRssUrl.trim()}
            >
              커스텀 RSS 수집
            </button>
          </div>

          {rssMessage && (
            <div className="alert-box info mt-2" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
              <RefreshCw size={14} className={isFetchingRss ? 'spin' : ''} />
              <span>{rssMessage}</span>
            </div>
          )}
        </div>

        <div className="filter-bar flex justify-between items-center mb-3">
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
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>
            수집 대기 기사: <strong>{filteredNews.length}</strong>건
          </span>
        </div>

        {filteredNews.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '2px dashed var(--border-color)' }}>
            <Bookmark size={36} className="text-muted mb-2" style={{ opacity: 0.5 }} />
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>현재 수집 대기 목록이 0건으로 깔끔히 비워져 있습니다.</h4>
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>
              상단의 <strong>[🚀 3중 완전 자동화 수집 봇 실행]</strong> 버튼을 누르시면 AI + SNS + Web 뉴스들이 100% 자동 수집됩니다!
            </p>
          </div>
        ) : (
          <div className="news-feed-list">
            {filteredNews.map((article) => (
              <div key={article.id} className="news-item-card" style={{ position: 'relative' }}>
                {/* Delete Button for Individual Article */}
                <button
                  onClick={() => onRemoveNews(article.id)}
                  title="이 기사 삭제"
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'content',
                    cursor: 'pointer',
                    zIndex: 2,
                  }}
                >
                  <X size={14} />
                </button>

                <div className="news-meta" style={{ paddingRight: '28px' }}>
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
                    className="btn-outline btn-xs"
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
