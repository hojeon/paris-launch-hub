import React, { useState, useEffect } from 'react';
import { TelegramConfig } from '../types';
import { getTelegramConfig, saveTelegramConfig, testTelegramConnection } from '../utils/telegramService';
import { Send, X, CheckCircle, AlertCircle, Info, ExternalLink, Zap, Eye, EyeOff } from 'lucide-react';

interface TelegramSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: (config: TelegramConfig) => void;
}

export const TelegramSettingsModal: React.FC<TelegramSettingsModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [config, setConfig] = useState<TelegramConfig>({
    botToken: '',
    chatId: '',
    enabled: false,
  });

  const [showToken, setShowToken] = useState<boolean>(true);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const current = getTelegramConfig();
      setConfig(current);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveTelegramConfig(config);
    onConfigSaved(config);
    onClose();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testTelegramConnection(config.botToken, config.chatId);
    setIsTesting(false);
    setTestResult(result);
  };

  const getDirectTelegramUrl = () => {
    const token = config.botToken.trim();
    const chat = config.chatId.trim();
    if (!token || !chat) return '';
    const msg = encodeURIComponent('🇫🇷 [PARIS LAUNCH HUB] 1-Click 직통 연동 테스트 성공!');
    return `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chat}&text=${msg}`;
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content card shadow-lg" style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <div className="icon-wrapper blue">
              <Send size={20} />
            </div>
            <div>
              <h3>텔레그램 봇 연동 및 알림 설정</h3>
              <p className="subtitle">모바일 텔레그램으로 파리 신제품 브리핑 & 승인(컨펌) 메시지 수신</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Guide Banner */}
          <div className="alert-box info mb-4">
            <Info size={18} />
            <div>
              <strong>텔레그램 봇 만들기 안내</strong>
              <p style={{ fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                1. Telegram에서 <code>@BotFather</code> 검색 후 <code>/newbot</code>을 입력하여 봇 토큰 생성<br />
                2. 생성된 봇에게 대화를 시작한 후 <code>@userinfobot</code> 등을 통해 내 Chat ID 확인<br />
                <a 
                  href="https://t.me/BotFather" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-1 text-gold hover:underline"
                  style={{ display: 'inline-flex', marginTop: '4px' }}
                >
                  BotFather 바로가기 <ExternalLink size={12} />
                </a>
              </p>
            </div>
          </div>

          <div className="form-group mb-3">
            <label className="flex justify-between items-center">
              <span>텔레그램 알림 활성화</span>
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </label>
          </div>

          <div className="form-group mb-3">
            <div className="flex justify-between items-center mb-1">
              <label>텔레그램 봇 토큰 (Bot Token)</label>
              <button 
                type="button" 
                className="btn-text" 
                onClick={() => setShowToken(!showToken)}
                style={{ fontSize: '0.75rem', display: 'flex', itemsCenter: 'center', gap: '4px' }}
              >
                {showToken ? <EyeOff size={12} /> : <Eye size={12} />}
                <span>{showToken ? '숨기기' : '보기'}</span>
              </button>
            </div>
            <input
              type={showToken ? 'text' : 'password'}
              placeholder="예: 7875527137:AAEXXXXXXXX..."
              value={config.botToken}
              onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
              className="input-field"
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
          </div>

          <div className="form-group mb-4">
            <label>텔레그램 챗 ID (Chat ID)</label>
            <input
              type="text"
              placeholder="예: 7875527137"
              value={config.chatId}
              onChange={(e) => setConfig({ ...config, chatId: e.target.value })}
              className="input-field"
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
          </div>

          {/* Direct Link Banner Always Visible when values entered */}
          <div className="alert-box mb-4" style={{ background: 'rgba(217, 119, 6, 0.08)', border: '1px solid var(--border-gold)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                ⚡ 1초 직통 테스트 딥링크 (CORS 방화벽 100% 우회):
              </span>
              {getDirectTelegramUrl() ? (
                <a
                  href={getDirectTelegramUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary btn-xs flex items-center gap-1"
                  style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #d97706, #b45309)' }}
                >
                  <Zap size={12} />
                  <span>직통 메세지 전송 탭 열기</span>
                  <ExternalLink size={12} />
                </a>
              ) : (
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>봇 토큰과 챗 ID를 입력하면 활성화됩니다</span>
              )}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              위 버튼을 누르시면 브라우저가 직접 텔레그램 메세지를 전송하며 스마트폰 텔레그램 앱에 띵동! 수신됩니다.
            </span>
          </div>

          {/* Test Status Result */}
          {testResult && (
            <div className={`alert-box ${testResult.success ? 'success' : 'warning'} mb-4`}>
              {testResult.success ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        <div className="modal-footer flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '8px' }}>
          <button 
            type="button" 
            className="btn-secondary flex items-center gap-2"
            onClick={handleTestConnection}
            disabled={isTesting || !config.botToken || !config.chatId}
          >
            <Send size={16} />
            <span>{isTesting ? '발송 중...' : '자동 테스트 전송'}</span>
          </button>

          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="button" className="btn-primary" onClick={handleSave}>
              설정 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
