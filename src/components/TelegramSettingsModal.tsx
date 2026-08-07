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
    botToken: '8280306445:AAEJ7RSWSltrkaAy0G5qvOAsbgzhcuPbG7E',
    chatId: '7875527137',
    enabled: true,
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
    try {
      const result = await testTelegramConnection(config.botToken, config.chatId);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `❌ 네트워크 오류: ${err.message || '요청 중 예외가 발생했습니다.'}`
      });
    } finally {
      setIsTesting(false);
    }
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
              <strong>텔레그램 봇 설정 완료 (@빠꼼데 봇)</strong>
              <p style={{ fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                봇 토큰과 챗 ID(<code>7875527137</code>)가 사전 세팅되었습니다.<br />
                텔레그램 앱에서 <code>@pcds75bot</code> 봇에게 <strong>/start</strong>를 1회 보내두시면 즉시 수신 가능합니다.
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
                style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {showToken ? <EyeOff size={12} /> : <Eye size={12} />}
                <span>{showToken ? '숨기기' : '보기'}</span>
              </button>
            </div>
            <input
              type={showToken ? 'text' : 'password'}
              placeholder="8280306445:AAEJ7RSWSltrkaAy0G5qvOAsbgzhcuPbG7E"
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
              placeholder="7875527137"
              value={config.chatId}
              onChange={(e) => setConfig({ ...config, chatId: e.target.value })}
              className="input-field"
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
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

        <div className="modal-footer flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '8px' }}>
          <button 
            type="button" 
            className="btn-primary flex items-center gap-2"
            onClick={handleTestConnection}
            disabled={isTesting}
          >
            <Zap size={16} />
            <span>{isTesting ? '우회 서버 발송 중...' : '⚡ 텔레그램 테스트 메시지 즉시 전송'}</span>
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
