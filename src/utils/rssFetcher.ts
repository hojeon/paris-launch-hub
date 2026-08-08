import { NewsArticle, RssFeedSource } from '../types';

export const PRESET_RSS_SOURCES: RssFeedSource[] = [
  {
    id: 'rss-fashionnetwork-fr',
    name: 'FashionNetwork France (패션/뷰티 런칭)',
    url: 'https://fr.fashionnetwork.com/rss/feed/fr,0.xml',
    siteUrl: 'https://fr.fashionnetwork.com/news/',
    category: '패션',
    description: '파리 패션위크, 명품 브랜딩, 뷰티/의류 런칭 실시간 RSS',
    isPreset: true,
  },
  {
    id: 'rss-google-news-paris-bool-fr',
    name: 'Google News Paris Live (프랑스어 3중 정밀 검색식 🇫🇷)',
    url: 'https://news.google.com/rss/search?q=%28%22lancement%22+OR+%22nouveaut%C3%A9%22+OR+%22disponible%22+OR+%22exclusivit%C3%A9%22+OR+%22boutique+%C3%A9ph%C3%A8re%22+OR+%22pop-up%22%29+AND+%28%22Paris%22+OR+%22France%22%29+AND+%28produit+OR+collection+OR+ouverture+OR+flagship+OR+%22avant-premi%C3%A8re%22%29&hl=fr&gl=FR&ceid=FR:fr',
    siteUrl: 'https://news.google.com',
    category: '패션',
    description: '프랑스 전 언론사 실시간 파리 런칭/신제품/팝업 속보 3중 검색식 자동 수집',
    isPreset: true,
  },
  {
    id: 'rss-google-news-paris-bool-en',
    name: 'Google News Paris Launch (영어 최상급 3중 검색식 🇬🇧)',
    url: 'https://news.google.com/rss/search?q=%28%22Paris%22+OR+%22French%22%29+AND+%28%22new+collection%22+OR+%22product+launch%22+OR+%22flagship+store%22+OR+%22pop-up+store%22+OR+%22exclusive+release%22+OR+%22capsule+collection%22%29+AND+%28fashion+OR+beauty+OR+luxury+OR+footwear+OR+jewelry%29&hl=en-US&gl=US&ceid=US:en',
    siteUrl: 'https://news.google.com',
    category: '패션',
    description: '글로벌 영문 언론사 실시간 파리 런칭/신제품/팝업 3중 영문 검색식 수집',
    isPreset: true,
  },
  {
    id: 'rss-lefigaro-eco',
    name: 'Le Figaro Économie (테크/비즈니스)',
    url: 'https://www.lefigaro.fr/rss/figaro_economie.xml',
    siteUrl: 'https://www.lefigaro.fr/economie',
    category: '테크',
    description: '프랑스 주요 경제, 테크, 비즈니스 신제품 보도자료',
    isPreset: true,
  },
  {
    id: 'rss-leparisien',
    name: 'Le Parisien (파리 팝업 & 라이프)',
    url: 'https://www.leparisien.fr/arc/outboundfeeds/rss/',
    siteUrl: 'https://www.leparisien.fr',
    category: '식품',
    description: '파리 현지 라이프스타일, 트렌드, 팝업 & 디저트 속보',
    isPreset: true,
  },
  {
    id: 'rss-elle-fr',
    name: 'ELLE France (뷰티/트렌드)',
    url: 'https://www.elle.fr/rss/full',
    siteUrl: 'https://www.elle.fr',
    category: '뷰티',
    description: '프랑스 뷰티, 트렌드, 파리 팝업 및 신제품',
    isPreset: true,
  },
];

/**
 * Genuine Live XML RSS/Atom Fetcher Engine
 */
export async function fetchRssArticles(feed: RssFeedSource): Promise<NewsArticle[]> {
  console.log(`[RSS Engine] Live fetch for: ${feed.name} (${feed.url})`);

  let xmlText: string | null = null;

  // Attempt 1: Cloudflare Worker RSS Proxy (/api/rss-proxy?url=...)
  try {
    const workerProxyUrl = `/api/rss-proxy?url=${encodeURIComponent(feed.url)}`;
    const res = await fetch(workerProxyUrl);
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 50 && (text.includes('<rss') || text.includes('<feed') || text.includes('<xml') || text.includes('<item') || text.includes('<entry>'))) {
        xmlText = text;
      } else {
        try {
          const parsedJson = JSON.parse(text);
          if (parsedJson.items && Array.isArray(parsedJson.items)) {
            return parsedJson.items;
          }
        } catch (e) {}
      }
    }
  } catch (err: any) {}

  // Attempt 2: Direct /api/news Endpoint Call Fallback
  if (!xmlText) {
    try {
      const res = await fetch('/api/news');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((item: any, idx: number) => ({
            ...item,
            id: `news-api-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            category: normalizeCategory(item.category || feed.category),
          }));
        }
      }
    } catch (e) {}
  }

  // Attempt 3: AllOrigins Raw Proxy Fallback
  if (!xmlText) {
    try {
      const rawProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feed.url)}`;
      const res = await fetch(rawProxyUrl);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 50) {
          xmlText = text;
        }
      }
    } catch (err: any) {}
  }

  if (xmlText) {
    const articles = parseRawXmlToArticles(xmlText, feed);
    if (articles.length > 0) return articles;
  }

  return [];
}

/**
 * Single Site Raw XML Fetcher
 */
export async function fetchSingleSiteFullRss(feedUrl: string = 'https://fr.fashionnetwork.com/rss/feed/fr,0.xml'): Promise<{ articles: NewsArticle[]; sourceXmlBytes: number }> {
  let xmlText: string | null = null;

  try {
    const res = await fetch(`/api/rss-proxy?url=${encodeURIComponent(feedUrl)}`);
    if (res.ok) {
      const text = await res.text();
      if (text && text.length > 100) xmlText = text;
    }
  } catch (e) {}

  if (!xmlText) {
    try {
      const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`);
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 100) xmlText = text;
      }
    } catch (e) {}
  }

  if (xmlText) {
    const articles = parseRawXmlToArticles(xmlText, {
      id: 'single-site',
      name: 'FashionNetwork France',
      url: feedUrl,
      category: '패션',
    });
    return { articles, sourceXmlBytes: xmlText.length };
  }

  return { articles: [], sourceXmlBytes: 0 };
}

/**
 * Genuine XML Parser for RSS 2.0 (<item>), Atom (<entry>), and RDF RSS 1.0 (<item>)
 */
function parseRawXmlToArticles(xmlString: string, feed: Partial<RssFeedSource>): NewsArticle[] {
  const articles: NewsArticle[] = [];
  const feedName = feed.name || '파리 수집 매체';
  const feedCategory = feed.category || '패션';

  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      return parseXmlWithRegexFallback(xmlString, feed);
    }

    const rssItems = Array.from(xmlDoc.querySelectorAll('item'));
    const atomEntries = Array.from(xmlDoc.querySelectorAll('entry'));
    const nodes = rssItems.length > 0 ? rssItems : atomEntries;

    if (nodes.length === 0) {
      return parseXmlWithRegexFallback(xmlString, feed);
    }

    nodes.slice(0, 25).forEach((node, idx) => {
      // 1. Extract Title
      const titleNode = node.querySelector('title');
      let title = titleNode ? (titleNode.textContent || '').trim() : '';
      title = stripHtmlTags(title);

      if (!title || title === '제목 없음') return;

      // 2. Extract Link
      let link = '';
      const linkNode = node.querySelector('link');
      if (linkNode) {
        link = linkNode.getAttribute('href') || (linkNode.textContent || '').trim();
      }
      if (!link) {
        const guidNode = node.querySelector('guid') || node.querySelector('id');
        link = guidNode ? (guidNode.textContent || '').trim() : '';
      }
      if (!link || !link.startsWith('http')) {
        link = feed.siteUrl || feed.url || 'https://news.google.com';
      }

      // 3. Extract Description / Snippet
      const descNode = node.querySelector('description') || node.querySelector('summary') || node.querySelector('content');
      let description = descNode ? (descNode.textContent || '').trim() : '';
      description = stripHtmlTags(description);

      const snippet = description.length > 0
        ? description.slice(0, 220) + (description.length > 220 ? '...' : '')
        : title;

      // 4. Extract Date
      const dateNode = node.querySelector('pubDate') || node.querySelector('published') || node.querySelector('updated') || node.querySelector('date');
      let pubDateStr = dateNode ? (dateNode.textContent || '').trim() : '';
      let formattedDate = new Date().toISOString().split('T')[0];

      if (pubDateStr) {
        try {
          const parsedDate = new Date(pubDateStr);
          if (!isNaN(parsedDate.getTime())) {
            formattedDate = parsedDate.toISOString().split('T')[0];
          }
        } catch (e) {}
      }

      // 5. Intelligent Field Extraction (Supports English + French)
      const brand = extractBrandFromTitle(title) || feedName;
      const price = extractPriceFromSnippet(description + ' ' + title) || '가격 확인 필요';
      const location = extractLocationFromText(title + ' ' + description) || '파리 매장 / 온라인';

      articles.push({
        id: `full-rss-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        title: title,
        source: feedName,
        publishedAt: formattedDate,
        url: link,
        snippet: snippet,
        category: normalizeCategory(feedCategory),
        suggestedBrand: brand,
        suggestedProduct: title,
        suggestedLocation: location,
        suggestedPrice: price,
        isParsed: false,
      });
    });
  } catch (err) {
    console.error('[RSS Parser] Exception during XML DOM parsing:', err);
  }

  return articles;
}

function parseXmlWithRegexFallback(xmlString: string, feed: Partial<RssFeedSource>): NewsArticle[] {
  const articles: NewsArticle[] = [];
  const itemMatches = xmlString.match(/<(item|entry)[\s\S]*?<\/(item|entry)>/gi) || [];

  itemMatches.slice(0, 25).forEach((itemXml, idx) => {
    const titleMatch = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const linkMatch = itemXml.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i) || itemXml.match(/href=["'](https?:\/\/[^"']+)["']/i);
    const descMatch = itemXml.match(/<(description|summary|content)[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(description|summary|content)>/i);
    const dateMatch = itemXml.match(/<(pubDate|published|updated)[^>]*>([\s\S]*?)<\/(pubDate|published|updated)>/i);

    const title = titleMatch ? stripHtmlTags(titleMatch[1]).trim() : '';
    if (!title) return;

    let link = linkMatch ? (linkMatch[1] || linkMatch[0]).trim() : 'https://news.google.com';
    link = stripHtmlTags(link);
    if (!link.startsWith('http')) link = 'https://news.google.com';

    const desc = descMatch ? stripHtmlTags(descMatch[2] || descMatch[1]).trim() : '';
    const snippet = desc.length > 0 ? desc.slice(0, 220) + '...' : title;

    let formattedDate = new Date().toISOString().split('T')[0];
    if (dateMatch && dateMatch[2]) {
      try {
        const d = new Date(dateMatch[2].trim());
        if (!isNaN(d.getTime())) formattedDate = d.toISOString().split('T')[0];
      } catch (e) {}
    }

    articles.push({
      id: `full-regex-${Date.now()}-${idx}`,
      title: title,
      source: feed.name || '파리 수집 매체',
      publishedAt: formattedDate,
      url: link,
      snippet: snippet,
      category: normalizeCategory(feed.category || '패션'),
      suggestedBrand: extractBrandFromTitle(title) || '파리 브랜드',
      suggestedProduct: title,
      suggestedLocation: extractLocationFromText(title + ' ' + desc) || '파리 매장 / 온라인',
      suggestedPrice: extractPriceFromSnippet(desc + ' ' + title) || '가격 확인 필요',
      isParsed: false,
    });
  });

  return articles;
}

function normalizeCategory(cat: string): '패션' | '뷰티' | '식품' | '테크' {
  if (!cat) return '패션';
  if (cat.includes('뷰티') || cat.includes('화장품') || cat.includes('Beauté') || cat.includes('Beauty')) return '뷰티';
  if (cat.includes('식품') || cat.includes('디저트') || cat.includes('미식') || cat.includes('Food')) return '식품';
  if (cat.includes('테크') || cat.includes('IT') || cat.includes('경제') || cat.includes('Tech')) return '테크';
  return '패션';
}

function stripHtmlTags(str: string): string {
  if (!str) return '';
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>?/gm, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function extractBrandFromTitle(title: string): string {
  const words = title.split(' ');
  if (words.length > 0 && words[0].length > 2) {
    return words[0];
  }
  return '';
}

function extractPriceFromSnippet(text: string): string | null {
  const priceMatch = text.match(/\b(\d+[\d\s\.,]*\s*(€|Euros?|EUR|\$|USD|£|GBP))\b/i);
  return priceMatch ? priceMatch[1].trim() : null;
}

function extractLocationFromText(text: string): string | null {
  if (text.includes('Champs-Élysées') || text.includes('샹젤리제')) return '파리 샹젤리제 플래그십';
  if (text.includes('Marais') || text.includes('마레')) return '파리 마레 지구 (Le Marais)';
  if (text.includes('Galeries Lafayette') || text.includes('라파예트')) return '파리 갤러리 라파예트';
  if (text.includes('Vendôme') || text.includes('방돔')) return '파리 방돔 광장 (Place Vendôme)';
  if (text.includes('Sephora') || text.includes('세포라')) return '파리 세포라 매장';
  return null;
}
