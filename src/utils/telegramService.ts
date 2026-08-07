import { TelegramConfig, ProductItem } from '../types';

const STORAGE_KEY = 'paris_telegram_config';

export const VALID_DEFAULT_BOT_TOKEN = '8280306445:AAEJ7RSWSltrkaAy0G5qvOAsbgzhcuPbG7E';
export const VALID_DEFAULT_CHAT_ID = '7875527137';

const DEFAULT_CONFIG: TelegramConfig = {
  botToken: VALID_DEFAULT_BOT_TOKEN,
  chatId: VALID_DEFAULT_CHAT_ID,
  enabled: true,
};

export function getTelegramConfig(): TelegramConfig {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // 토큰에 마스킹 점(•)이 섞여있거나 무효한 경우 자동 정제
      if (parsed.botToken && !parsed.botToken.includes('•') && parsed.botToken.includes(':')) {
        return {
          botToken: parsed.botToken.trim(),
          chatId: (parsed.chatId || VALID_DEFAULT_CHAT_ID).trim(),
          enabled: parsed.enabled ?? true,
        };
      }
    } catch (e) {
      console.error('Failed to parse saved telegram config:', e);
    }
  }
  return DEFAULT_CONFIG;
}

export function saveTelegramConfig(config: TelegramConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/**
 * Robust Multi-Relay Telegram Dispatcher
 */
async function callTelegramApi(cleanToken: string, cleanChatId: string, text: string): Promise<{ ok: boolean; data?: any; error?: string }> {
  // 사용자가 마스킹된 점을 제출한 경우 기본 유효 토큰으로 강제 치환
  const actualToken = (!cleanToken || cleanToken.includes('•') || !cleanToken.includes(':'))
    ? VALID_DEFAULT_BOT_TOKEN
    : cleanToken;
  const actualChatId = (!cleanChatId || cleanChatId.includes('•'))
    ? VALID_DEFAULT_CHAT_ID
    : cleanChatId;

  const encodedText = encodeURIComponent(text);
  const targetGetUrl = `https://api.telegram.org/bot${actualToken}/sendMessage?chat_id=${actualChatId}&text=${encodedText}`;

  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 3500): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  // Relay 1: AllOrigins Proxy
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetGetUrl)}`;
    const res = await fetchWithTimeout(proxyUrl, {}, 3500);
    if (res.ok) {
      const data = await res.json();
      if (data && data.ok === true) {
        return { ok: true, data };
      } else if (data && data.description) {
        return { ok: false, data };
      }
    }
  } catch (e) {
    console.warn('Relay 1 (AllOrigins) failed:', e);
  }

  // Relay 2: Corsproxy.io
  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetGetUrl)}`;
    const res = await fetchWithTimeout(proxyUrl, {}, 3500);
    if (res.ok) {
      const data = await res.json();
      if (data && data.ok === true) {
        return { ok: true, data };
      } else if (data && data.description) {
        return { ok: false, data };
      }
    }
  } catch (e) {
    console.warn('Relay 2 (Corsproxy) failed:', e);
  }

  // Relay 3: Direct POST
  try {
    const res = await fetchWithTimeout(`https://api.telegram.org/bot${actualToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: actualChatId,
        text: text,
      }),
    }, 3500);
    if (res.ok) {
      const data = await res.json();
      if (data && data.ok === true) {
        return { ok: true, data };
      }
    }
  } catch (e) {
    console.warn('Direct POST failed:', e);
  }

  return { ok: false, error: '텔레그램 네트워크 504 타임아웃' };
}

/**
 * Tests Telegram bot connection
 */
export async function testTelegramConnection(botToken: string, chatId: string): Promise<{ success: boolean; message: string }> {
  const text = `🇫🇷 [PARIS LAUNCH HUB] 텔레그램 연동 성공!\n\n모바일 알림 및 신제품 컨펌 승인 파이프라인이 연결되었습니다.`;
  const res = await callTelegramApi(botToken, chatId, text);

  if (res.ok && res.data?.ok === true) {
    return { success: true, message: '✅ 텔레그램 메시지 실제 발송 성공! 스마트폰 텔레그램 앱을 확인하세요.' };
  }

  if (res.data) {
    let failReason = `오류 (${res.data.error_code || 'Err'}): ${res.data.description || '발송 실패'}`;
    if (res.data.error_code === 400 && res.data.description?.includes('chat not found')) {
      failReason = `오류 (400): 봇과의 대화가 시작되지 않았습니다. 텔레그램에서 내 봇(@pcds75bot)을 찾아 [/start] 버튼을 누르고 메시지를 한 번 보내주세요!`;
    } else if (res.data.error_code === 401) {
      failReason = `오류 (401): 봇 토큰(Bot Token)이 올바르지 않습니다. BotFather의 토큰을 다시 확인해주세요.`;
    }
    return { success: false, message: failReason };
  }

  return { success: false, message: `❌ 발송 실패: ${res.error || '텔레그램 API 타임아웃'}` };
}

/**
 * Sends a Telegram approval/confirmation message for a product item
 */
export async function sendProductApprovalRequest(
  config: TelegramConfig,
  product: ProductItem,
  customNote?: string
): Promise<{ success: boolean; message: string }> {
  const importanceBadge = product.importance === '높음' ? '🔴 [중요도 높음]' : product.importance === '중간' ? '🟡 [중요도 중간]' : '🟢 [중요도 일반]';

  const messageText = `
🇫🇷 [파리 신제품 컨펌 요청] ${importanceBadge}

• 브랜드: ${product.brand}
• 제품명: ${product.productName}
• 카테고리: ${product.category} | 가격: ${product.price}
• 파리 출시일: ${product.launchDate}
• 장소: ${product.location}

📌 핵심 특징:
${product.keyFeatures}

📊 중요도 점수: ${product.importanceScore}점 (${product.importance})
출처: ${product.sourceName} (${product.sourceUrl})
${customNote ? `📝 메모: ${customNote}\n` : ''}
---
발행 상태: 네이버 블로그 [${product.naverStatus}] | 인스타그램 [${product.instaStatus}]
`.trim();

  const res = await callTelegramApi(config.botToken, config.chatId, messageText);
  if (res.ok && res.data?.ok === true) {
    return { success: true, message: '텔레그램으로 승인 요청 메시지를 발송했습니다.' };
  }

  return { success: false, message: res.data?.description || res.error || '발송 실패' };
}
