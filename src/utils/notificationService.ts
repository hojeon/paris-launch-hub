import { ProductItem } from '../types';

export interface NotificationConfig {
  channelType: 'telegram' | 'slack' | 'discord';
  telegramBotToken: string;
  telegramChatId: string;
  slackWebhookUrl: string;
  discordWebhookUrl: string;
  enabled: boolean;
}

const STORAGE_KEY = 'paris_notification_config';

export const DEFAULT_NOTIF_CONFIG: NotificationConfig = {
  channelType: 'slack', // Default to 100% Clean Slack Webhook
  telegramBotToken: '8280306445:AAEJ7RSWSltrkaAy0G5qvOAsbgzhcuPbG7E',
  telegramChatId: '7875527137',
  slackWebhookUrl: '',
  discordWebhookUrl: '',
  enabled: true,
};

export function getNotificationConfig(): NotificationConfig {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_NOTIF_CONFIG, ...parsed };
    } catch (e) {}
  }
  return DEFAULT_NOTIF_CONFIG;
}

export function saveNotificationConfig(config: NotificationConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/**
 * Sends clean real-time product notification to Slack, Discord, or Telegram (0% Ads Guarantee)
 */
export async function sendProductNotification(
  config: NotificationConfig,
  product: ProductItem
): Promise<{ success: boolean; message: string }> {
  if (!config.enabled) {
    return { success: false, message: '알림 전송이 비활성화되어 있습니다.' };
  }

  const importanceBadge = product.importance === '높음' ? '🔴 [중요도 높음]' : product.importance === '중간' ? '🟡 [중요도 중간]' : '🟢 [중요도 일반]';

  // 1. Slack Webhook Relay (100% Clean, 0% Ads)
  if (config.channelType === 'slack' && config.slackWebhookUrl.trim()) {
    try {
      const slackPayload = {
        text: `🇫🇷 *[파리 신제품 컨펌 요청]* ${importanceBadge}\n*브랜드:* ${product.brand} | *제품명:* ${product.productName}\n*가격:* ${product.price} | *장소:* ${product.location}\n*원문:* ${product.sourceUrl}`,
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: `🇫🇷 [파리 신제품 속보] ${product.brand}` }
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*제품명:*\n${product.productName}` },
              { type: 'mrkdwn', text: `*가격 / 장소:*\n${product.price} / ${product.location}` }
            ]
          },
          {
            type: 'section',
            text: { type: 'mrkdwn', text: `*📌 핵심 특징:*\n${product.keyFeatures}` }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: '🔗 원문 기사 바로보기' },
                url: product.sourceUrl,
                style: 'primary'
              }
            ]
          }
        ]
      };

      const res = await fetch(config.slackWebhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload),
      });

      if (res.ok) {
        return { success: true, message: '✅ 슬랙(Slack) 채널로 100% 클린 알림 카드가 전송되었습니다!' };
      }
    } catch (err: any) {
      return { success: false, message: `슬랙 전송 오류: ${err.message}` };
    }
  }

  // 2. Discord Webhook Relay (100% Clean, 0% Ads)
  if (config.channelType === 'discord' && config.discordWebhookUrl.trim()) {
    try {
      const discordPayload = {
        username: 'Paris Launch Hub Bot',
        content: `🇫🇷 **[파리 신제품 속보]** ${importanceBadge}`,
        embeds: [
          {
            title: `${product.brand} - ${product.productName}`,
            url: product.sourceUrl,
            color: 0x6366f1, // Indigo
            fields: [
              { name: '🏷️ 카테고리 / 가격', value: `${product.category} | ${product.price}`, inline: true },
              { name: '📍 장소', value: product.location, inline: true },
              { name: '📌 핵심 특징 & 구매대행 리포트', value: product.keyFeatures.slice(0, 1000) }
            ],
            footer: { text: `출처: ${product.sourceName}` }
          }
        ]
      };

      const res = await fetch(config.discordWebhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload),
      });

      if (res.ok) {
        return { success: true, message: '✅ 디스코드(Discord) 채널로 100% 클린 알림이 전송되었습니다!' };
      }
    } catch (err: any) {
      return { success: false, message: `디스코드 전송 오류: ${err.message}` };
    }
  }

  // 3. Telegram Relay Fallback
  try {
    const res = await fetch('https://paris-launch-hub.pariscommetoi.workers.dev/api/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botToken: config.telegramBotToken,
        chatId: config.telegramChatId,
        text: `🇫🇷 [파리 신제품] ${product.brand} - ${product.productName}\n${product.sourceUrl}`,
      }),
    });
    if (res.ok) {
      return { success: true, message: '텔레그램 메시지 전송 성공' };
    }
  } catch (e) {}

  return { success: false, message: '알림 채널 URL을 확인해 주세요.' };
}
