import React, { useState } from 'react';
import { X, Send, ShieldCheck, CheckCircle2, MessageSquare, Bell, Sliders, Info, Zap, AlertTriangle, Lock } from 'lucide-react';
import { getNotificationConfig, saveNotificationConfig, sendProductNotification, NotificationConfig } from '../utils/notificationService';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: (config: NotificationConfig) => void;
}

export const TelegramSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [config, setConfig] = useState<NotificationConfig>(() => getNotificationConfig());
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = () => {
    saveNotificationConfig(config);
    if (onConfigSaved) onConfigSaved(config);
    setTestResult({ success: true, message: '✅ 클린 알림 채널 설정이 성공적으로 저장되었습니다!' });
    setTimeout(() => {
      setTestResult(null);
      onClose();
    }, 1200);
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    setTestResult(null);

    const testProduct = {
      id: 'test-item',
      collectedAt: new Date().toISOString().split('T')[0],
      brand: 'Jacquemus (테스트 알림)',
      productName: 'Le Chiquito Paris Exclusive (100% 클린 테스트)',
      category: '패션' as const,
      status: 'Inbox' as const,
      launchDate: '2026-08-08',
      location: '파리 마레 지구 팝업스토어',
      price: '180€',
      keyFeatures: '성인광고/스팸 0%! 슬랙, 디스코드, 클린 텔레그램으로 즉시 발송되는 파리 신제품 알림 테스트입니다.',
      targetAudience: '파리 현지 직구족',
      sourceUrl: 'https://paris-launch-hub.pariscommetoi.workers.dev',
      sourceName: 'Paris Launch Hub',
      reliability: '공식 테스트',
      importance: '높음' as const,
      importanceScore: 9,
      scoreDetails: { isOfficialAnnouncement: true, isAvailableForPurchase: true, isParisExclusive: true, isMajorEvent: true, isTrustedMedia: true },
      followUp: '테스트 완료',
      naverStatus: '대기' as const,
      instaStatus: '대기' as const,
      imagePrepared: true,
    };

    const res = await sendProductNotification(config, testProduct);
    setTestResult(res);
    setIsTesting(false);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content card shadow-lg" style={{ maxWidth: '640px', width: '92%', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header flex justify-between items-center mb-4" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div className="flex items-center gap-2">
            <div className="icon-wrapper navy" style={{ width: '36px', height: '36px' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>🛡️ 성인광고/스팸 0% 클린 알림 채널 설정</h3>
              <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem' }}>
                가짜 BotFather 피싱 봇 위험 없는 안전한 알림 수신 채널 선택
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Channel Selection Tabs */}
        <div className="flex gap-2 mb-4" style={{ background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setConfig({ ...config, channelType: 'slack' })}
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: '6px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              background: config.channelType === 'slack' ? '#ffffff' : 'transparent',
              color: config.channelType === 'slack' ? '#4a154b' : '#64748b',
              boxShadow: config.channelType === 'slack' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            💬 Slack 슬랙 (강추/광고0%)
          </button>

          <button
            onClick={() => setConfig({ ...config, channelType: 'discord' })}
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: '6px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              background: config.channelType === 'discord' ? '#ffffff' : 'transparent',
              color: config.channelType === 'discord' ? '#5865f2' : '#64748b',
              boxShadow: config.channelType === 'discord' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            🎮 Discord 디스코드 (강추)
          </button>

          <button
            onClick={() => setConfig({ ...config, channelType: 'telegram' })}
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: '6px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              background: config.channelType === 'telegram' ? '#ffffff' : 'transparent',
              color: config.channelType === 'telegram' ? '#0088cc' : '#64748b',
              boxShadow: config.channelType === 'telegram' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            ✈️ Telegram 텔레그램
          </button>
        </div>

        {/* Tab 1: Slack Webhook Settings */}
        {config.channelType === 'slack' && (
          <div className="form-group mb-4">
            <div className="alert-box success mb-3" style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', fontSize: '0.85rem' }}>
              ✨ <strong>Slack(슬랙)은 BotFather나 성인 광고 문제가 100% 존재하지 않는 청정 채널입니다!</strong>
            </div>
            <label className="input-label" style={{ fontWeight: 600, color: '#4a154b' }}>
              💬 Slack 수신용 Incoming Webhook URL 주소 입력:
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="https://hooks.slack.com/services/T.../B.../..."
              value={config.slackWebhookUrl}
              onChange={(e) => setConfig({ ...config, slackWebhookUrl: e.target.value })}
              style={{ fontFamily: 'monospace', fontSize: '0.85rem', padding: '10px' }}
            />
            <div className="alert-box info mt-2" style={{ background: '#fdf4ff', border: '1px solid #f5d0fe', color: '#701a75', fontSize: '0.8rem' }}>
              💡 <strong>Slack 연결 1초 안내:</strong> 슬랙 내 채널 우클릭 ➔ 앱 추가 ➔ <strong>"Incoming WebHooks"</strong> 선택 후 생성된 URL을 위 상자에 붙여넣으세요!
            </div>
          </div>
        )}

        {/* Tab 2: Discord Webhook Settings */}
        {config.channelType === 'discord' && (
          <div className="form-group mb-4">
            <div className="alert-box success mb-3" style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', fontSize: '0.85rem' }}>
              ✨ <strong>Discord(디스코드)는 봇 프로필 성인광고 덮어쓰기 위험이 0%인 100% 무료 개인 채널입니다!</strong>
            </div>
            <label className="input-label" style={{ fontWeight: 600, color: '#5865f2' }}>
              🎮 Discord 수신용 Webhook URL 주소 입력:
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="https://discord.com/api/webhooks/123.../abc..."
              value={config.discordWebhookUrl}
              onChange={(e) => setConfig({ ...config, discordWebhookUrl: e.target.value })}
              style={{ fontFamily: 'monospace', fontSize: '0.85rem', padding: '10px' }}
            />
            <div className="alert-box info mt-2" style={{ background: '#eef2ff', border: '1px solid #c7d2fe', color: '#3730a3', fontSize: '0.8rem' }}>
              💡 <strong>Discord 연결 1초 안내:</strong> 개인 서버 ⚙️ 채널 설정 ➔ 연동 ➔ <strong>"웹후크 만들기"</strong> 후 웹후크 URL을 복사하여 위에 붙여넣으세요!
            </div>
          </div>
        )}

        {/* Tab 3: Telegram Settings & BotFather Warning/Lock Guide */}
        {config.channelType === 'telegram' && (
          <div className="form-group mb-4">
            {/* Warning Box for Fake BotFather Spam */}
            <div className="alert-box error mb-3" style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#9f1239', fontSize: '0.8rem' }}>
              <div className="flex items-center gap-1 font-bold mb-1" style={{ fontSize: '0.85rem' }}>
                <AlertTriangle size={16} /> 텔레그램 가짜 BotFather 성인광고 피싱 주의 안내
              </div>
              텔레그램 검색창의 가짜 봇 계정들이 봇 프로필을 포르노/성인 피싱 광고로 강제 덮어쓰는 문제가 있습니다.<br />
              - <strong>공식 BotFather 구분법:</strong> 반드시 이름 옆에 <strong>파란색 공식 인증 마크(🔵 Verified)</strong>가 붙어있는 계정만 사용하세요.<br />
              - <strong>해결책:</strong> 아래에 미리 제공된 <strong>100% 클린 기본 봇 토큰</strong>을 그대로 사용하시거나, 위 탭의 <strong>[Slack 슬랙] / [Discord 디스코드]</strong> 사용을 권장합니다!
            </div>

            <label className="input-label" style={{ fontWeight: 600 }}>Telegram Bot Token (클린 기본 봇 토큰 제공됨):</label>
            <input
              type="text"
              className="input-field mb-2"
              value={config.telegramBotToken}
              onChange={(e) => setConfig({ ...config, telegramBotToken: e.target.value })}
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
            <label className="input-label" style={{ fontWeight: 600 }}>Telegram Chat ID:</label>
            <input
              type="text"
              className="input-field"
              value={config.telegramChatId}
              onChange={(e) => setConfig({ ...config, telegramChatId: e.target.value })}
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
          </div>
        )}

        {testResult && (
          <div className={`alert-box ${testResult.success ? 'success' : 'error'} mb-4`} style={{ padding: '10px 14px', fontSize: '0.85rem' }}>
            <span>{testResult.message}</span>
          </div>
        )}

        <div className="flex justify-between items-center mt-4" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <button
            className="btn-secondary"
            onClick={handleTestNotification}
            disabled={isTesting}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Send size={14} />
            <span>{isTesting ? '알림 테스트 중...' : '🧪 클린 테스트 알림 발송하기'}</span>
          </button>

          <div className="flex gap-2">
            <button className="btn-outline" onClick={onClose}>취소</button>
            <button className="btn-primary" onClick={handleSave}>설정 저장 완료</button>
          </div>
        </div>
      </div>
    </div>
  );
};
