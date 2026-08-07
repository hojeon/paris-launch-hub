import React from 'react';
import { Newspaper, Database, Sparkles, Calendar, PlusCircle, Compass } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAddModal: () => void;
  inboxCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  inboxCount,
}) => {
  return (
    <header className="header-container">
      <div className="header-inner">
        {/* Brand Logo */}
        <div className="brand-logo" onClick={() => setActiveTab('tracker')}>
          <div className="flag-badge">🇫🇷 PARIS</div>
          <div className="logo-text">
            <h1>PARIS LAUNCH HUB</h1>
            <span className="subtitle">파리 신제품 모니터링 & 콘텐츠 팩토리</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'collector' ? 'active' : ''}`}
            onClick={() => setActiveTab('collector')}
          >
            <Newspaper size={18} />
            <span>뉴스 수집 & 알림</span>
            {inboxCount > 0 && <span className="badge-count">{inboxCount}</span>}
          </button>

          <button
            className={`nav-tab ${activeTab === 'tracker' ? 'active' : ''}`}
            onClick={() => setActiveTab('tracker')}
          >
            <Database size={18} />
            <span>신제품 DB 트래커</span>
          </button>

          <button
            className={`nav-tab ${activeTab === 'factory' ? 'active' : ''}`}
            onClick={() => setActiveTab('factory')}
          >
            <Sparkles size={18} />
            <span>콘텐츠 팩토리 (블로그/인스타)</span>
          </button>

          <button
            className={`nav-tab ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            <Calendar size={18} />
            <span>발행 파이프라인</span>
          </button>
        </nav>

        {/* Right Action */}
        <div className="header-actions">
          <button className="btn-primary" onClick={onOpenAddModal}>
            <PlusCircle size={16} />
            <span>신제품 수동 등록</span>
          </button>
        </div>
      </div>
    </header>
  );
};
