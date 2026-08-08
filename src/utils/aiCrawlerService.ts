import { NewsArticle } from '../types';

/**
 * AI Web Crawler Engine (Jina AI & Tavily Smart Search)
 * Strictly requires real, valid HTTP URLs. Rejects fake/mock items.
 */
export async function runAiWebCrawler(query: string = 'Paris launch new product indie brand'): Promise<NewsArticle[]> {
  console.log(`[AI Crawler] Executing AI web search for: ${query}`);

  const articles: NewsArticle[] = [];

  // Method 1: Jina AI Reader Search (Free Open API)
  try {
    const jinaUrl = `https://s.jina.ai/${encodeURIComponent(query)}`;
    const res = await fetch(jinaUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.data && Array.isArray(data.data)) {
        data.data.slice(0, 10).forEach((item: any, idx: number) => {
          const title = (item.title || '').replace(/<[^>]*>?/gm, '').trim();
          const content = (item.description || item.content || '').replace(/<[^>]*>?/gm, '').trim();
          
          let exactArticleUrl = item.url || item.link || item.sourceUrl || '';
          
          // Reject invalid URLs (must be direct http/https and not jina API domain)
          if (!exactArticleUrl || !exactArticleUrl.startsWith('http') || exactArticleUrl.includes('jina.ai')) {
            return;
          }

          if (title && title.length > 5) {
            articles.push({
              id: `ai-crawler-${Date.now()}-${idx}`,
              title: title,
              source: item.source || 'AI Web Crawler',
              publishedAt: new Date().toISOString().split('T')[0],
              url: exactArticleUrl,
              snippet: content.slice(0, 220) + '...',
              category: '패션',
              suggestedBrand: extractBrand(title),
              suggestedProduct: title,
              suggestedLocation: extractLocation(content) || '파리 매장 / 팝업스토어',
              suggestedPrice: extractPrice(content) || '가격 확인 필요',
              isParsed: true,
            });
          }
        });
      }
    }
  } catch (err) {
    console.warn('[AI Crawler] Jina API call failed', err);
  }

  return articles;
}

function extractBrand(title: string): string {
  const parts = title.split(/[:|\-–]/);
  if (parts.length > 1) return parts[0].trim();
  const words = title.split(' ');
  return words[0] || '파리 인디 브랜드';
}

function extractPrice(text: string): string | null {
  const match = text.match(/\b(\d+[\d\s\.,]*\s*(€|EUR|\$|USD|£))\b/i);
  return match ? match[1].trim() : null;
}

function extractLocation(text: string): string | null {
  if (text.includes('Marais') || text.includes('마레')) return '파리 마레 지구 (Le Marais)';
  if (text.includes('Champs-Élysées') || text.includes('샹젤리제')) return '파리 샹젤리제';
  if (text.includes('Lafayette') || text.includes('라파예트')) return '파리 갤러리 라파예트';
  if (text.includes('Saint-Germain') || text.includes('생제르맹')) return '파리 생제르맹';
  return null;
}
