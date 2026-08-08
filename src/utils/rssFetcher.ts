import { NewsArticle, RssFeedSource } from '../types';

export const PRESET_RSS_SOURCES: RssFeedSource[] = [
  {
    id: 'rss-fashionnetwork-fr',
    name: 'FashionNetwork France (실시간 무필터 원본)',
    url: 'https://fr.fashionnetwork.com/rss/feed/fr,0.xml',
    siteUrl: 'https://fr.fashionnetwork.com/news/',
    category: '패션',
    description: '검색어/키워드 필터 없이 FashionNetwork 최신 속보 전체 파싱',
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
    id: 'rss-google-news-paris',
    name: 'Google News France Paris Launch',
    url: 'https://news.google.com/rss/search?q=lancement+produit+Paris+OR+nouveaut%C3%A9+Paris&hl=fr&gl=FR&ceid=FR:fr',
    siteUrl: 'https://news.google.com',
    category: '패션',
    description: '프랑스 전 언론사 실시간 파리 런칭/신제품/팝업 속보',
    isPreset: true,
  },
  {
    id: 'rss-leparisien',
    name: 'Le Parisien',
    url: 'https://www.leparisien.fr/arc/outboundfeeds/rss/',
    siteUrl: 'https://www.leparisien.fr',
    category: '패션',
    description: '파리 현지 라이프스타일, 트렌드 & 팝업 속보',
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
 * Single Site Raw XML Fetcher (No Filter, Pure RSS Items)
 */
export async function fetchSingleSiteFullRss(feedUrl: string = 'https://fr.fashionnetwork.com/rss/feed/fr,0.xml'): Promise<{ articles: NewsArticle[]; sourceXmlBytes: number }> {
  console.log(`[Single Site Engine] Fetching raw XML from: ${feedUrl}`);

  let xmlText: string | null = null;

  // 1. Worker Proxy
  try {
    const res = await fetch(`/api/rss-proxy?url=${encodeURIComponent(feedUrl)}`);
    if (res.ok) {
      const text = await res.text();
      if (text && text.length > 100) xmlText = text;
    }
  } catch (e) {}

  // 2. AllOrigins Proxy
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
 * Genuine Live XML RSS/Atom Fetcher Engine
 */
export async function fetchRssArticles(feed: RssFeedSource): Promise<NewsArticle[]> {
  console.log(`[RSS Engine] Genuine fetch for: ${feed.name} (${feed.url})`);

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

  // Attempt 2: Direct /api/news Endpoint Call
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
 * Genuine XML Parser for RSS 2.0 (<item>), Atom (<entry>), and RDF RSS 1.0 (<item>)
 */
function parseRawXmlToArticles(xmlString: string, feed: Partial<RssFeedSource>): NewsArticle[] {
  const articles: NewsArticle[] = [];
  const feedName = feed.name || 'FashionNetwork France';
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

    nodes.slice(0, 20).forEach((node, idx) => {
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
        link = feed.siteUrl || feed.url || 'https://fr.fashionnetwork.com';
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

      // 5. Intelligent Field Extraction
      const brand = extractBrandFromTitle(title) || feedName;
      const price = extractPriceFromSnippet(description) || '가격 확인 필요';

      articles.push({
        id: `single-rss-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        title: title,
        source: feedName,
        publishedAt: formattedDate,
        url: link,
        snippet: snippet,
        category: normalizeCategory(feedCategory),
        suggestedBrand: brand,
        suggestedProduct: title,
        suggestedLocation: '파리 매장 / 온라인',
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

  itemMatches.slice(0, 20).forEach((itemXml, idx) => {
    const titleMatch = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const linkMatch = itemXml.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i) || itemXml.match(/href=["'](https?:\/\/[^"']+)["']/i);
    const descMatch = itemXml.match(/<(description|summary|content)[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(description|summary|content)>/i);
    const dateMatch = itemXml.match(/<(pubDate|published|updated)[^>]*>([\s\S]*?)<\/(pubDate|published|updated)>/i);

    const title = titleMatch ? stripHtmlTags(titleMatch[1]).trim() : '';
    if (!title) return;

    let link = linkMatch ? (linkMatch[1] || linkMatch[0]).trim() : 'https://fr.fashionnetwork.com';
    link = stripHtmlTags(link);
    if (!link.startsWith('http')) link = 'https://fr.fashionnetwork.com';

    const desc = descMatch ? stripHtmlTags(descMatch[2] || descMatch[1]).trim() : '';
    const snippet = desc.length > 0 ? desc.slice(0, 200) + '...' : title;

    let formattedDate = new Date().toISOString().split('T')[0];
    if (dateMatch && dateMatch[2]) {
      try {
        const d = new Date(dateMatch[2].trim());
        if (!isNaN(d.getTime())) formattedDate = d.toISOString().split('T')[0];
      } catch (e) {}
    }

    articles.push({
      id: `single-regex-${Date.now()}-${idx}`,
      title: title,
      source: feed.name || 'FashionNetwork France',
      publishedAt: formattedDate,
      url: link,
      snippet: snippet,
      category: normalizeCategory(feed.category || '패션'),
      suggestedBrand: extractBrandFromTitle(title) || 'FashionNetwork',
      suggestedProduct: title,
      suggestedLocation: '파리 매장 / 온라인',
      suggestedPrice: extractPriceFromSnippet(desc) || '가격 확인 필요',
      isParsed: false,
    });
  });

  return articles;
}

function normalizeCategory(cat: string): '패션' | '뷰티' | '식품' | '테크' {
  if (!cat) return '패션';
  if (cat.includes('뷰티') || cat.includes('화장품') || cat.includes('Beauté')) return '뷰티';
  if (cat.includes('식품') || cat.includes('디저트') || cat.includes('미식')) return '식품';
  if (cat.includes('테크') || cat.includes('IT') || cat.includes('경제')) return '테크';
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
  const priceMatch = text.match(/\b(\d+[\d\s\.,]*\s*(€|Euros?|EUR))\b/i);
  return priceMatch ? priceMatch[1].trim() : null;
}
