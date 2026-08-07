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
 * Tests Telegram bot connection by sending a simple test message with 8s Timeout
 */
export async function testTelegramConnection(botToken: string, chatId: string): Promise<{ success: boolean; message: string }> {
  const cleanToken = botToken.trim();
  const cleanChatId = chatId.trim();

  if (!cleanToken || !cleanChatId) {
    return { success: false, message: '봇 토큰과 챗 ID를 모두 입력해주세요.' };
  }

  const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`;
  const text = `<b>🇫🇷 PARIS LAUNCH HUB 텔레그램 연동 성공!</b>\n\n알림 및 컨펌 파이프라인이 정상적으로 연결되었습니다.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: text,
        parse_mode: 'HTML',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    if (data.ok) {
      return { success: true, message: '✅ 텔레그램 메세지 발송에 성공했습니다! 텔레그램 앱을 확인하세요.' };
    } else {
      let failReason = `오류 (${data.error_code}): ${data.description}`;
      if (data.error_code === 400 && data.description.includes('chat not found')) {
        failReason = `오류 (400): 봇과의 대화가 시작되지 않았습니다. 텔레그램에서 @pcds75bot 을 찾아 [/start] 버튼을 먼저 눌러주세요!`;
      } else if (data.error_code === 401) {
        failReason = `오류 (401): 봇 토큰(Bot Token)이 올바르지 않습니다. BotFather의 토큰을 다시 확인해주세요.`;
      }
      return { success: false, message: failReason };
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return { success: false, message: '⏰ 요청 시간 초과 (8초): 텔레그램 API 연결 지연. 봇 토큰이나 네트워크 상태를 확인하세요.' };
    }
    return { success: false, message: `연동 실패: ${error.message || '네트워크/CORS 오류'}` };
  }
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

  const url = `https://api.telegram.org/bot${config.botToken.trim()}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId.trim(),
        text: messageText,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    });

    const data = await response.json();
    if (data.ok) {
      return { success: true, message: '텔레그램으로 승인 요청 메시지를 발송했습니다.' };
    } else {
      return { success: false, message: `발송 실패 (${data.error_code}): ${data.description}` };
    }
  } catch (error: any) {
    return { success: false, message: `네트워크 오류: ${error.message}` };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
