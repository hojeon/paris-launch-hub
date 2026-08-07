import { NewsArticle, RssFeedSource } from '../types';

export const PRESET_RSS_SOURCES: RssFeedSource[] = [
  {
    id: 'rss-lefigaro-eco',
    name: 'Le Figaro Économie',
    url: 'https://www.lefigaro.fr/rss/figaro_economie.xml',
    siteUrl: 'https://www.lefigaro.fr/economie',
    category: '테크',
    description: '프랑스 주요 경제, 테크, 비즈니스 신제품 보도자료',
    isPreset: true,
  },
  {
    id: 'rss-fashionnetwork',
    name: 'FashionNetwork France',
    url: 'https://fr.fashionnetwork.com/rss/news',
    siteUrl: 'https://fr.fashionnetwork.com/news/',
    category: '패션',
    description: '파리 패션위크, 명품 브랜딩, 뷰티/의류 런칭 뉴스',
    isPreset: true,
  },
  {
    id: 'rss-vogue',
    name: 'Vogue France',
    url: 'https://www.vogue.fr/rss/news',
    siteUrl: 'https://www.vogue.fr',
    category: '패션',
    description: '파리 하이 패션, 럭셔리 컬렉션 & 뷰티 런칭',
    isPreset: true,
  },
  {
    id: 'rss-lsa',
    name: 'LSA Conso',
    url: 'https://www.lsa-conso.fr/rss',
    siteUrl: 'https://www.lsa-conso.fr',
    category: '식품',
    description: '프랑스 소비재, 유통, 식음료 신제품 런칭 전문',
    isPreset: true,
  },
  {
    id: 'rss-sortiraparis',
    name: 'Sortir à Paris',
    url: 'https://www.sortiraparis.com/rss',
    siteUrl: 'https://www.sortiraparis.com/',
    category: '식품',
    description: '파리 현지 팝업스토어, 미식 디저트, 트렌디 스팟',
    isPreset: true,
  },
  {
    id: 'rss-lesechos',
    name: 'Les Échos',
    url: 'https://www.lesechos.fr/rss/rss_lesechos_une.xml',
    siteUrl: 'https://www.lesechos.fr/',
    category: '라이프스타일',
    description: '프랑스 프리미엄 소비재 및 스타트업 라이프스타일',
    isPreset: true,
  },
];

/**
 * Fetches and parses REAL live RSS Feed items with multi-fallback (rss2json + AllOrigins + DOMParser)
 */
export async function fetchRssArticles(feed: RssFeedSource): Promise<NewsArticle[]> {
  // Strategy 1: rss2json Public API
  try {
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
    const response = await fetch(proxyUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'ok' && Array.isArray(data.items) && data.items.length > 0) {
        return data.items.map((item: any, idx: number) => {
          const title = item.title || '제목 없음';
          const rawSnippet = item.description || item.content || '';
          const snippet = rawSnippet.replace(/<[^>]*>?/gm, '').slice(0, 180) + '...';
          const articleUrl = sanitizeArticleUrl(item.link || item.guid, feed);

          return {
            id: `rss-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
            title: title.trim(),
            source: feed.name,
            publishedAt: item.pubDate ? item.pubDate.split(' ')[0] : new Date().toISOString().split('T')[0],
            url: articleUrl,
            snippet: snippet.trim() || title,
            category: feed.category,
            suggestedBrand: extractBrandFromTitle(title) || feed.name,
            suggestedProduct: title,
            suggestedLocation: '파리 매장 / 온라인',
            suggestedPrice: '가격 미정',
            isParsed: false,
          };
        });
      }
    }
  } catch (err) {
    console.warn(`rss2json failed for ${feed.name}, trying DOMParser relay...`, err);
  }

  // Strategy 2: AllOrigins Raw Proxy + DOMParser (Parses REAL XML items from French media)
  try {
    const rawProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feed.url)}`;
    const res = await fetch(rawProxyUrl);
    if (res.ok) {
      const xmlText = await res.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const items = Array.from(xmlDoc.querySelectorAll('item'));

      if (items.length > 0) {
        return items.slice(0, 8).map((item, idx) => {
          const title = item.querySelector('title')?.textContent || '제목 없음';
          const link = item.querySelector('link')?.textContent || item.querySelector('guid')?.textContent || feed.siteUrl;
          const description = item.querySelector('description')?.textContent || '';
          const pubDate = item.querySelector('pubDate')?.textContent || '';

          const snippet = description.replace(/<[^>]*>?/gm, '').slice(0, 180) + '...';
          const articleUrl = sanitizeArticleUrl(link, feed);

          return {
            id: `rss-xml-${Date.now()}-${idx}`,
            title: title.trim(),
            source: feed.name,
            publishedAt: pubDate ? new Date(pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            url: articleUrl,
            snippet: snippet.trim() || title,
            category: feed.category,
            suggestedBrand: extractBrandFromTitle(title) || feed.name,
            suggestedProduct: title,
            suggestedLocation: '파리 매장 / 온라인',
            suggestedPrice: '가격 미정',
            isParsed: false,
          };
        });
      }
    }
  } catch (err) {
    console.warn(`DOMParser relay failed for ${feed.name}:`, err);
  }

  return [];
}

function sanitizeArticleUrl(url: string | undefined, feed: RssFeedSource): string {
  if (!url || url.endsWith('.xml') || url.includes('/rss')) {
    return feed.siteUrl || feed.url.replace(/\/rss.*$/, '').replace(/\.xml$/, '');
  }
  return url;
}

function extractBrandFromTitle(title: string): string {
  const words = title.split(' ');
  if (words.length > 0 && words[0].length > 2) {
    return words[0];
  }
  return '';
}
