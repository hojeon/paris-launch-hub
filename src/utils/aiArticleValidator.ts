import { NewsArticle } from '../types';

export interface AiValidationResult {
  isCommercialProduct: boolean;
  reason: string;
  brand: string;
  productName: string;
  price: string;
  location: string;
  confidenceScore: number;
}

const MULTI_AI_KEYS_STORAGE = 'paris_multi_ai_api_keys';
let currentKeyIndex = 0;

/**
 * Gets array of up to 7 stored AI API Keys
 */
export function getStoredAiApiKeys(): string[] {
  const saved = localStorage.getItem(MULTI_AI_KEYS_STORAGE);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed.map(k => (k || '').trim()).filter(Boolean);
    } catch (e) {}
  }
  return [];
}

/**
 * Saves array of up to 7 AI API Keys
 */
export function saveStoredAiApiKeys(keys: string[]): void {
  const cleanKeys = keys.map(k => (k || '').trim()).filter(Boolean).slice(0, 7);
  localStorage.setItem(MULTI_AI_KEYS_STORAGE, JSON.stringify(cleanKeys));
}

/**
 * Checks whether at least 1 valid API key is registered
 */
export function hasValidAiApiKey(): boolean {
  return getStoredAiApiKeys().length > 0;
}

/**
 * Selects next available API key in Round-Robin fashion
 */
function getNextAiApiKey(): string | null {
  const keys = getStoredAiApiKeys();
  if (keys.length === 0) return null;
  const key = keys[currentKeyIndex % keys.length];
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return key;
}

/**
 * Strict Gemini LLM Article Gatekeeper Engine
 * ZERO-KEY FALLBACK ELIMINATED: REQUIRES REAL GEMINI API KEY FOR AI VALIDATION.
 */
export async function validateArticleWithAi(article: NewsArticle): Promise<AiValidationResult> {
  const title = article.title || '';
  const snippet = article.snippet || '';
  const keys = getStoredAiApiKeys();

  // 🚫 STRICT RULE: Require API Key. Zero-key fallback completely killed.
  if (keys.length === 0) {
    throw new Error('AI_KEY_REQUIRED: Gemini API Key가 등록되지 않았습니다.');
  }

  // Execute Round-Robin Gemini API Calls with Failover over registered keys
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const activeKey = getNextAiApiKey();
    if (!activeKey) break;

    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeKey}`;
      const prompt = `Analyze this French article to see if it's a real physical consumer product launch or pop-up collection for shopping/buying agency.
Return ONLY valid JSON with no markdown formatting:
{
  "isCommercialProduct": boolean,
  "reason": "short explanation in Korean",
  "brand": "extracted brand name",
  "productName": "extracted product name",
  "price": "extracted price or '확인필요'",
  "location": "location in Paris"
}

Title: ${title}
Snippet: ${snippet}`;

      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (res.ok) {
        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        return {
          isCommercialProduct: Boolean(parsed.isCommercialProduct),
          reason: `Gemini LLM (7-Key 로드밸런싱) 판정: ${parsed.reason}`,
          brand: parsed.brand || article.suggestedBrand || '미정',
          productName: parsed.productName || title,
          price: parsed.price || article.suggestedPrice || '가격 확인 필요',
          location: parsed.location || article.suggestedLocation || '파리 매장',
          confidenceScore: 99,
        };
      } else if (res.status === 429) {
        console.warn(`[7-Key Load Balancer] Key index ${attempt} hit Rate Limit (429), failing over to next Key...`);
        continue;
      }
    } catch (err) {
      console.warn(`[7-Key Load Balancer] Error on key index ${attempt}, trying next key...`, err);
    }
  }

  // If all keys failed or rate-limited
  return {
    isCommercialProduct: false,
    reason: 'Gemini API 호출 제한 또는 키 오류로 검증 실패',
    brand: article.suggestedBrand || '미정',
    productName: title,
    price: '확인필요',
    location: '파리',
    confidenceScore: 0,
  };
}

/**
 * Batch AI Article Validator
 */
export async function filterArticlesWithAi(rawArticles: NewsArticle[]): Promise<{ validProducts: NewsArticle[]; rejectedCount: number }> {
  if (!hasValidAiApiKey()) {
    throw new Error('AI_KEY_REQUIRED');
  }

  const validProducts: NewsArticle[] = [];
  let rejectedCount = 0;

  for (const article of rawArticles) {
    try {
      const aiRes = await validateArticleWithAi(article);
      if (aiRes.isCommercialProduct) {
        validProducts.push({
          ...article,
          suggestedBrand: aiRes.brand,
          suggestedProduct: aiRes.productName,
          suggestedPrice: aiRes.price,
          suggestedLocation: aiRes.location,
          isParsed: true,
        });
      } else {
        rejectedCount++;
        console.warn(`[Gemini LLM Rejected Non-Product]: ${article.title} -> ${aiRes.reason}`);
      }
    } catch (e: any) {
      if (e.message === 'AI_KEY_REQUIRED') throw e;
      rejectedCount++;
    }
  }

  return { validProducts, rejectedCount };
}
