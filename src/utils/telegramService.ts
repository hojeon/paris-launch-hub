import { TelegramConfig, ProductItem } from '../types';

const STORAGE_KEY = 'paris_telegram_config';

export function getTelegramConfig(): TelegramConfig {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved telegram config:', e);
    }
  }
  return {
    botToken: '',
    chatId: '',
    enabled: false,
  };
}

export function saveTelegramConfig(config: TelegramConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/**
 * Sends request using Telegram API with CORS/504 Proxy Fallback
 */
async function callTelegramApi(cleanToken: string, cleanChatId: string, text: string): Promise<{ ok: boolean; data?: any; error?: string }> {
  const targetUrl = `https://api.telegram.org/bot${cleanToken}/sendMessage`;
  const bodyData = {
    chat_id: cleanChatId,
    text: text,
    parse_mode: 'HTML',
  };

  // 1차: 직접 POST 요청
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
    });

    if (response.ok) {
      const data = await response.json();
      return { ok: data.ok, data };
    }
    const errData = await response.json().catch(() => ({}));
    if (errData.description) {
      return { ok: false, data: errData };
    }
  } catch (e) {
    console.warn('Direct Telegram API POST failed, trying proxy relay...', e);
  }

  // 2차: CORS Proxy / Gateway Bypass (504 Gateway Timeout 해결용 릴레이)
  try {
    const queryParams = new URLSearchParams({
      chat_id: cleanChatId,
      text: text,
      parse_mode: 'HTML',
    }).toString();

    const directApiGet = `https://api.telegram.org/bot${cleanToken}/sendMessage?${queryParams}`;
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(directApiGet)}`;

    const proxyRes = await fetch(proxyUrl);
    const data = await proxyRes.json();
    return { ok: !!data.ok, data };
  } catch (e: any) {
    // 3차: Backup Proxy Relay (AllOrigins)
    try {
      const queryParams = new URLSearchParams({
        chat_id: cleanChatId,
        text: text,
        parse_mode: 'HTML',
      }).toString();
      const directApiGet = `https://api.telegram.org/bot${cleanToken}/sendMessage?${queryParams}`;
      const backupProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(directApiGet)}`;

      const backupRes = await fetch(backupProxyUrl);
      const data = await backupRes.json();
      return { ok: !!data.ok, data };
    } catch (backupErr: any) {
      return { ok: false, error: backupErr.message || '네트워크 연결 오류' };
    }
  }
}

/**
 * Tests Telegram bot connection
 */
export async function testTelegramConnection(botToken: string, chatId: string): Promise<{ success: boolean; message: string }> {
  const cleanToken = botToken.trim();
  const cleanChatId = chatId.trim();

  if (!cleanToken || !cleanChatId) {
    return { success: false, message: '봇 토큰과 챗 ID를 모두 입력해주세요.' };
  }

  const text = `<b>🇫🇷 PARIS LAUNCH HUB 텔레그램 연동 성공!</b>\n\n알림 및 컨펌 파이프라인이 정상적으로 연결되었습니다.`;
  const res = await callTelegramApi(cleanToken, cleanChatId, text);

  if (res.ok) {
    return { success: true, message: '✅ 텔레그램 메세지 발송에 성공했습니다! 텔레그램 앱을 확인하세요.' };
  }

  if (res.data) {
    let failReason = `오류 (${res.data.error_code || 'Err'}): ${res.data.description || '발송 실패'}`;
    if (res.data.error_code === 400 && res.data.description?.includes('chat not found')) {
      failReason = `오류 (400): 봇과의 대화가 시작되지 않았습니다. 텔레그램에서 내 봇을 찾아 [/start] 버튼을 먼저 눌러주세요!`;
    } else if (res.data.error_code === 401) {
      failReason = `오류 (401): 봇 토큰(Bot Token)이 올바르지 않습니다. BotFather의 토큰을 다시 확인해주세요.`;
    }
    return { success: false, message: failReason };
  }

  return { success: false, message: `연동 실패: ${res.error || '504 Gateway Timeout 우회 시도 실패'}` };
}

/**
 * Sends a Telegram approval/confirmation message for a product item
 */
export async function sendProductApprovalRequest(
  config: TelegramConfig,
  product: ProductItem,
  customNote?: string
): Promise<{ success: boolean; message: string }> {
  if (!config.enabled || !config.botToken || !config.chatId) {
    return { success: false, message: '텔레그램 봇 연동 설정이 활성화되지 않았습니다.' };
  }

  const importanceBadge = product.importance === '높음' ? '🔴 [중요도 높음]' : product.importance === '중간' ? '🟡 [중요도 중간]' : '🟢 [중요도 일반]';

  const messageText = `
<b>🇫🇷 [파리 신제품 컨펌 요청]</b> ${importanceBadge}

<b>브랜드:</b> ${escapeHtml(product.brand)}
<b>제품명:</b> ${escapeHtml(product.productName)}
<b>카테고리:</b> ${product.category} | <b>가격:</b> ${product.price}
<b>파리 출시일:</b> ${product.launchDate}
<b>판매/팝업 장소:</b> ${escapeHtml(product.location)}

<b>📌 핵심 특징:</b>
<i>${escapeHtml(product.keyFeatures)}</i>

<b>📊 중요도 점수:</b> ${product.importanceScore}점 (${product.importance})
<b>출처:</b> <a href="${product.sourceUrl}">${escapeHtml(product.sourceName)}</a>

${customNote ? `<b>📝 메모:</b> ${escapeHtml(customNote)}\n` : ''}
---
<b>발행 상태:</b> 네이버 블로그 [${product.naverStatus}] | 인스타그램 [${product.instaStatus}]

<i>💡 위 신제품 정보와 콘텐츠 발행 건에 대해 확인 후 승인 여부를 결정해주세요.</i>
`.trim();

  const cleanToken = config.botToken.trim();
  const cleanChatId = config.chatId.trim();

  const res = await callTelegramApi(cleanToken, cleanChatId, messageText);
  if (res.ok) {
    return { success: true, message: '텔레그램으로 승인 요청 메시지를 발송했습니다.' };
  }

  return { success: false, message: res.data?.description || res.error || '발송 실패' };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
