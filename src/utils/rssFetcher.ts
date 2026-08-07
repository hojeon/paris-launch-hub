import { NewsArticle, RssFeedSource } from '../types';

export const PRESET_RSS_SOURCES: RssFeedSource[] = [
  {
    id: 'rss-google-news-paris',
    name: 'Google News Paris Launch Live',
    url: 'https://news.google.com/rss/search?q=lancement+produit+Paris+OR+nouveaut%C3%A9+Paris+OR+popup+Paris&hl=fr&gl=FR&ceid=FR:fr',
    siteUrl: 'https://news.google.com',
    category: '패션',
    description: '프랑스 전 언론사 실시간 파리 런칭/신제품/팝업 속보',
    isPreset: true,
  },
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
  {
    id: 'rss-elle-fr',
    name: 'ELLE France',
    url: 'https://www.elle.fr/rss/full',
    siteUrl: 'https://www.elle.fr',
    category: '뷰티',
    description: '프랑스 뷰티, 트렌드, 파리 팝업 및 신제품',
    isPreset: true,
  },
];

/**
 * Universal XML & Atom RSS Parser
 */
export async function fetchRssArticles(feed: RssFeedSource): Promise<NewsArticle[]> {
  // Strategy 1: Cloudflare Worker High-Speed RSS Proxy (/api/rss-proxy?url=...)
  try {
    const workerProxyUrl = `/api/rss-proxy?url=${encodeURIComponent(feed.url)}`;
    const res = await fetch(workerProxyUrl);
    if (res.ok) {
      const xmlText = await res.text();
      const articles = parseXmlArticles(xmlText, feed);
      if (articles.length > 0) return articles;
    }
  } catch (err) {
    console.warn(`Worker RSS proxy failed for ${feed.name}:`, err);
  }

  // Strategy 2: rss2json API Fallback
  try {
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
    const response = await fetch(proxyUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'ok' && Array.isArray(data.items) && data.items.length > 0) {
        return data.items.map((item: any, idx: number) => {
          const title = (item.title || '제목 없음').replace(/<[^>]*>?/gm, '').trim();
          const rawSnippet = item.description || item.content || '';
          const snippet = rawSnippet.replace(/<[^>]*>?/gm, '').slice(0, 180) + '...';
          const articleUrl = sanitizeArticleUrl(item.link || item.guid, feed);

          return {
            id: `rss-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
            title: title,
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
  } catch (err) {}

  // Strategy 3: AllOrigins Raw XML Proxy
  try {
    const rawProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feed.url)}`;
    const res = await fetch(rawProxyUrl);
    if (res.ok) {
      const xmlText = await res.text();
      const articles = parseXmlArticles(xmlText, feed);
      if (articles.length > 0) return articles;
    }
  } catch (err) {}

  return [];
}

/**
 * Parses both RSS (<item>) and Atom (<entry>) XML formats
 */
function parseXmlArticles(xmlText: string, feed: RssFeedSource): NewsArticle[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  // Support both RSS (<item>) and Atom (<entry>)
  const rssItems = Array.from(xmlDoc.querySelectorAll('item'));
  const atomEntries = Array.from(xmlDoc.querySelectorAll('entry'));
  const nodes = rssItems.length > 0 ? rssItems : atomEntries;

  if (nodes.length === 0) return [];

  return nodes.slice(0, 12).map((node, idx) => {
    const titleNode = node.querySelector('title');
    const title = titleNode ? titleNode.textContent || '제목 없음' : '제목 없음';

    let link = '';
    const linkNode = node.querySelector('link');
    if (linkNode) {
      link = linkNode.getAttribute('href') || linkNode.textContent || '';
    }
    if (!link) {
      link = node.querySelector('guid')?.textContent || feed.siteUrl;
    }

    const descNode = node.querySelector('description') || node.querySelector('summary') || node.querySelector('content');
    const description = descNode ? descNode.textContent || '' : '';

    const pubDateNode = node.querySelector('pubDate') || node.querySelector('published') || node.querySelector('updated');
    const pubDate = pubDateNode ? pubDateNode.textContent || '' : '';

    const cleanTitle = title.replace(/<[^>]*>?/gm, '').trim();
    const snippet = description.replace(/<[^>]*>?/gm, '').slice(0, 180) + '...';
    const articleUrl = sanitizeArticleUrl(link, feed);

    return {
      id: `rss-xml-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      title: cleanTitle,
      source: feed.name,
      publishedAt: pubDate ? new Date(pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      url: articleUrl,
      snippet: snippet.trim() || cleanTitle,
      category: feed.category,
      suggestedBrand: extractBrandFromTitle(cleanTitle) || feed.name,
      suggestedProduct: cleanTitle,
      suggestedLocation: '파리 매장 / 온라인',
      suggestedPrice: '가격 미정',
      isParsed: false,
    };
  });
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
