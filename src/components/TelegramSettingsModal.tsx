import React, { useState, useEffect } from 'react';
import { TelegramConfig } from '../types';
import { getTelegramConfig, saveTelegramConfig, testTelegramConnection } from '../utils/telegramService';
import { Send, X, CheckCircle, AlertCircle, Info, ExternalLink } from 'lucide-react';

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
            <label>텔레그램 봇 토큰 (Bot Token)</label>
            <input
              type="password"
              placeholder="예: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              value={config.botToken}
              onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="form-group mb-4">
            <label>텔레그램 챗 ID (Chat ID)</label>
            <input
              type="text"
              placeholder="예: 987654321 또는 @your_channel"
              value={config.chatId}
              onChange={(e) => setConfig({ ...config, chatId: e.target.value })}
              className="input-field"
            />
          </div>

          {/* Test Status Result */}
          {testResult && (
            <div className={`alert-box ${testResult.success ? 'success' : 'warning'} mb-4`}>
              {testResult.success ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        <div className="modal-footer flex justify-between items-center">
          <button 
            type="button" 
            className="btn-secondary flex items-center gap-2"
            onClick={handleTestConnection}
            disabled={isTesting || !config.botToken || !config.chatId}
          >
            <Send size={16} />
            <span>{isTesting ? '메세지 발송 중...' : '연동 테스트 전송'}</span>
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
