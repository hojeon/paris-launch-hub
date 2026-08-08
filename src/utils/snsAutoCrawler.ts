import { NewsArticle } from '../types';

/**
 * SNS & Hashtag Smart Auto Crawler Engine
 * Strictly filters out any fake/mocked fallback items when real scraping is blocked.
 */
export async function runSnsAutoCrawler(tag: string = 'popupparis'): Promise<NewsArticle[]> {
  console.log(`[SNS Auto Crawler] Scanning trend tag: #${tag}`);

  const articles: NewsArticle[] = [];
  const cleanTag = tag.replace('#', '').trim();

  // Method 1: Worker Proxy Relay for Live SNS Trends
  try {
    const proxyUrl = `/api/rss-proxy?url=${encodeURIComponent(`https://api.allorigins.win/raw?url=https://www.instagram.com/explore/tags/${cleanTag}/`)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const htmlText = await res.text();
      const titleMatches = htmlText.match(/<meta property="og:title" content="([^"]+)"/gi) || [];

      if (titleMatches.length > 0) {
        titleMatches.slice(0, 5).forEach((m: string, idx: number) => {
          const content = m.replace(/<meta property="og:title" content="/i, '').replace(/"$/, '');
          articles.push({
            id: `sns-insta-${Date.now()}-${idx}`,
            title: `📸 [Instagram #${cleanTag}] ${content.slice(0, 80)}`,
            source: `Instagram (#${cleanTag})`,
            publishedAt: new Date().toISOString().split('T')[0],
            url: `https://www.instagram.com/explore/tags/${cleanTag}/`,
            snippet: `인스타그램 실시간 #${cleanTag} 트렌드 팝업 & 인디 브랜드 소식: ${content}`,
            category: '패션',
            suggestedBrand: `#${cleanTag} 트렌드 브랜드`,
            suggestedProduct: `파리 팝업 & 신상 #${cleanTag}`,
            suggestedLocation: '파리 마레 / 팝업스토어 현장',
            suggestedPrice: '현장 확인 필요',
            isParsed: true,
          });
        });
      }
    }
  } catch (err) {
    console.warn('[SNS Auto Crawler] Live scraping blocked', err);
  }

  // 🚫 REMOVED FAKE/MOCKED FALLBACK ARRAY
  // If Instagram blocks DOM scraping, return empty array instead of fake mock items!

  return articles;
}
