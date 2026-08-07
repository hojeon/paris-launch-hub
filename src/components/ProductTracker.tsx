import React, { useState } from 'react';
import { ProductItem, ProductStatus, Category, Reliability, Importance, TelegramConfig } from '../types';
import { calculateImportanceScore } from '../utils/scoreCalculator';
import { sendProductApprovalRequest, getTelegramConfig } from '../utils/telegramService';
import { 
  Filter, Search, ArrowUpDown, Edit3, Trash2, ExternalLink, 
  CheckCircle2, AlertCircle, Sparkles, LayoutGrid, List, Sliders, ChevronDown, Send, Check 
} from 'lucide-react';

interface ProductTrackerProps {
  products: ProductItem[];
  onUpdateProduct: (product: ProductItem) => void;
  onDeleteProduct: (id: string) => void;
  onSelectForContent: (product: ProductItem) => void;
  telegramConfig?: TelegramConfig;
}


export const ProductTracker: React.FC<ProductTrackerProps> = ({
  products,
  onUpdateProduct,
  onDeleteProduct,
  onSelectForContent,
}) => {
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('전체');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'importance' | 'date' | 'launch'>('importance');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  const statuses: (ProductStatus | '전체')[] = [
    '전체', 'Inbox', '검증 완료', '출시 예정', '출시 완료', '관찰 목록', '보관'
  ];

  // Filtering & Sorting Logic
  const filteredProducts = products.filter((p) => {
    const matchesStatus = selectedStatusTab === '전체' || p.status === selectedStatusTab;
    const matchesCategory = selectedCategory === '전체' || p.category === selectedCategory;
    const matchesSearch = 
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'importance') {
      return b.importanceScore - a.importanceScore;
    } else if (sortBy === 'date') {
      return new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime();
    } else {
      return a.launchDate.localeCompare(b.launchDate);
    }
  });

  const handleScoreChange = (field: keyof ProductItem['scoreDetails']) => {
    if (!editingProduct) return;
    const updatedDetails = {
      ...editingProduct.scoreDetails,
      [field]: !editingProduct.scoreDetails[field],
    };
    const { score, level } = calculateImportanceScore(updatedDetails);

    setEditingProduct({
      ...editingProduct,
      scoreDetails: updatedDetails,
      importanceScore: score,
      importance: level,
    });
  };

  const handleSaveEdit = () => {
    if (editingProduct) {
      onUpdateProduct(editingProduct);
      setEditingProduct(null);
    }
  };

  const handleSendTelegramApproval = async (item: ProductItem) => {
    const config = getTelegramConfig();
    const result = await sendProductApprovalRequest(config, item);
    alert(result.message);
    if (result.success) {
      onUpdateProduct({
        ...item,
        telegramStatus: '컨펌 대기중',
        telegramSentAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      });
    }
  };

  return (
    <div className="tracker-container">

      {/* Top Filter Bar */}
      <div className="card shadow-md mb-4">
        <div className="tracker-controls">
          {/* Status Tabs */}
          <div className="status-tabs-row">
            {statuses.map((st) => {
              const count = st === '전체' 
                ? products.length 
                : products.filter(p => p.status === st).length;

              return (
                <button
                  key={st}
                  className={`status-tab-btn ${selectedStatusTab === st ? 'active' : ''}`}
                  onClick={() => setSelectedStatusTab(st)}
                >
                  <span>{st}</span>
                  <span className="tab-count">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="controls-right-row">
            {/* Search */}
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="브랜드, 제품명, 장소 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="select-input"
            >
              <option value="전체">모든 카테고리</option>
              <option value="패션">패션</option>
              <option value="뷰티">뷰티</option>
              <option value="식품">식품</option>
              <option value="테크">테크</option>
              <option value="라이프스타일">라이프스타일</option>
            </select>

            {/* Sort select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="select-input"
            >
              <option value="importance">중요도 높은 순</option>
              <option value="date">최근 수집일 순</option>
              <option value="launch">출시일 순</option>
            </select>

            {/* View Mode Toggle */}
            <div className="view-toggle">
              <button
                className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="테이블 뷰"
              >
                <List size={16} />
              </button>
              <button
                className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                onClick={() => setViewMode('kanban')}
                title="칸반 보드 뷰"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="card shadow-md p-0 overflow-x-auto">
          <table className="product-table">
            <thead>
              <tr>
                <th>수집일</th>
                <th>중요도</th>
                <th>브랜드 / 제품명</th>
                <th>카테고리</th>
                <th>상태</th>
                <th>파리 출시일</th>
                <th>장소</th>
                <th>가격</th>
                <th>신뢰도</th>
                <th>후속 조치</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-muted">
                    등록되거나 검색된 신제품이 없습니다.
                  </td>
                </tr>
              ) : (
                sortedProducts.map((item) => (
                  <tr key={item.id} className="table-row-hover">
                    <td className="text-xs text-muted">{item.collectedAt}</td>
                    <td>
                      <div className="importance-badge-wrapper">
                        <span className={`badge-importance ${item.importance}`}>
                          +{item.importanceScore} {item.importance}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="product-title-cell">
                        <span className="brand-name">{item.brand}</span>
                        <strong className="product-name">{item.productName}</strong>
                        <p className="key-feature-snippet">{item.keyFeatures}</p>
                      </div>
                    </td>
                    <td><span className="badge-cat">{item.category}</span></td>
                    <td>
                      <span className={`status-pill ${item.status}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="text-sm font-medium">{item.launchDate}</td>
                    <td className="text-xs text-muted max-w-xs">{item.location}</td>
                    <td className="text-sm font-semibold text-gold">{item.price}</td>
                    <td className="text-xs">{item.reliability}</td>
                    <td className="text-xs text-muted max-w-xs">{item.followUp}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon"
                          title="텔레그램으로 컨펌 요청 전송"
                          onClick={() => handleSendTelegramApproval(item)}
                        >
                          <Send size={16} className={item.telegramStatus ? 'text-gold' : ''} />
                        </button>
                        <button
                          className="btn-icon"
                          title="콘텐츠 생성기로 전송"
                          onClick={() => onSelectForContent(item)}
                        >
                          <Sparkles size={16} className="text-gold" />
                        </button>
                        <button
                          className="btn-icon"
                          title="상세/중요도 편집"
                          onClick={() => setEditingProduct(item)}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          className="btn-icon danger"
                          title="삭제"
                          onClick={() => onDeleteProduct(item.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* KANBAN VIEW */
        <div className="kanban-grid">
          {['Inbox', '검증 완료', '출시 예정', '출시 완료', '관찰 목록', '보관'].map((colStatus) => {
            const colItems = sortedProducts.filter((p) => p.status === colStatus);

            return (
              <div key={colStatus} className="kanban-column card">
                <div className="kanban-col-header">
                  <span className={`status-pill ${colStatus}`}>{colStatus}</span>
                  <span className="col-count">{colItems.length}</span>
                </div>

                <div className="kanban-cards-container">
                  {colItems.map((item) => (
                    <div key={item.id} className="kanban-card">
                      <div className="kanban-card-top">
                        <span className="brand-name">{item.brand}</span>
                        <span className={`badge-importance ${item.importance}`}>
                          +{item.importanceScore}
                        </span>
                      </div>
                      <h4 className="kanban-product-name">{item.productName}</h4>
                      <p className="kanban-features">{item.keyFeatures}</p>

                      <div className="kanban-meta-row">
                        <span>📍 {item.location}</span>
                        <span className="text-gold font-semibold">💶 {item.price}</span>
                      </div>

                      <div className="kanban-card-footer">
                        <button
                          className="btn-text text-xs"
                          onClick={() => setEditingProduct(item)}
                        >
                          <Edit3 size={12} /> 편집/점수
                        </button>
                        <button
                          className="btn-primary btn-xs"
                          onClick={() => onSelectForContent(item)}
                        >
                          <Sparkles size={12} /> 콘텐츠 제작
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT & IMPORTANCE MODAL */}
      {editingProduct && (
        <div className="modal-backdrop">
          <div className="modal-card card shadow-xl">
            <div className="modal-header">
              <h3>제품 상세 수정 & 중요도 점수 산출</h3>
              <button className="btn-icon" onClick={() => setEditingProduct(null)}>✕</button>
            </div>

            <div className="modal-body grid-2col">
              {/* Left Column: Basic Info */}
              <div className="form-column">
                <div className="form-group">
                  <label>브랜드명</label>
                  <input
                    type="text"
                    value={editingProduct.brand}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>제품명</label>
                  <input
                    type="text"
                    value={editingProduct.productName}
                    onChange={(e) => setEditingProduct({ ...editingProduct, productName: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>카테고리</label>
                    <select
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as Category })}
                    >
                      <option value="패션">패션</option>
                      <option value="뷰티">뷰티</option>
                      <option value="식품">식품</option>
                      <option value="테크">테크</option>
                      <option value="라이프스타일">라이프스타일</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>출시 상태</label>
                    <select
                      value={editingProduct.status}
                      onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value as ProductStatus })}
                    >
                      <option value="Inbox">Inbox</option>
                      <option value="검증 완료">검증 완료</option>
                      <option value="출시 예정">출시 예정</option>
                      <option value="출시 완료">출시 완료</option>
                      <option value="관찰 목록">관찰 목록</option>
                      <option value="보관">보관</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>파리 출시일</label>
                    <input
                      type="text"
                      value={editingProduct.launchDate}
                      onChange={(e) => setEditingProduct({ ...editingProduct, launchDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>가격(유로)</label>
                    <input
                      type="text"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>장소 (매장/팝업 스토어 위치)</label>
                  <input
                    type="text"
                    value={editingProduct.location}
                    onChange={(e) => setEditingProduct({ ...editingProduct, location: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>핵심 특징 (1~2문장 요약)</label>
                  <textarea
                    rows={3}
                    value={editingProduct.keyFeatures}
                    onChange={(e) => setEditingProduct({ ...editingProduct, keyFeatures: e.target.value })}
                  />
                </div>
              </div>

              {/* Right Column: Score Calculation Rule Engine */}
              <div className="score-rule-column">
                <div className="score-summary-box">
                  <h4>중요도 점수 산출 엔진</h4>
                  <div className="score-display font-playfair">
                    <span className="big-score">+{editingProduct.importanceScore}</span>
                    <span className={`score-level-badge ${editingProduct.importance}`}>
                      {editingProduct.importance} 중요도
                    </span>
                  </div>
                </div>

                <div className="checkbox-list">
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={editingProduct.scoreDetails.isOfficialAnnouncement}
                      onChange={() => handleScoreChange('isOfficialAnnouncement')}
                    />
                    <div>
                      <strong>공식 출시 발표 (+3)</strong>
                      <p className="text-xs text-muted">브랜드 공식 Communiqués de presse 또는 지사 발표</p>
                    </div>
                  </label>

                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={editingProduct.scoreDetails.isAvailableForPurchase}
                      onChange={() => handleScoreChange('isAvailableForPurchase')}
                    />
                    <div>
                      <strong>실제 판매 가능 (+3)</strong>
                      <p className="text-xs text-muted">파리에서 구매 가능한 상품 (단순 전시 및 발표 제외)</p>
                    </div>
                  </label>

                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={editingProduct.scoreDetails.isParisExclusive}
                      onChange={() => handleScoreChange('isParisExclusive')}
                    />
                    <div>
                      <strong>파리 한정 / 팝업 제품 (+2)</strong>
                      <p className="text-xs text-muted">Paris Exclusive, Limited Flagship, Pop-up</p>
                    </div>
                  </label>

                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={editingProduct.scoreDetails.isMajorEvent}
                      onChange={() => handleScoreChange('isMajorEvent')}
                    />
                    <div>
                      <strong>주요 행사 공개 (+2)</strong>
                      <p className="text-xs text-muted">Fashion Week, VivaTech, Maison&Objet 공개</p>
                    </div>
                  </label>

                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={editingProduct.scoreDetails.isTrustedMedia}
                      onChange={() => handleScoreChange('isTrustedMedia')}
                    />
                    <div>
                      <strong>신뢰 언론 보도 (+1)</strong>
                      <p className="text-xs text-muted">Le Figaro, Les Échos, FashionNetwork 등 수록</p>
                    </div>
                  </label>
                </div>

                <div className="form-group mt-4">
                  <label>후속 조치 (Follow-up)</label>
                  <input
                    type="text"
                    value={editingProduct.followUp}
                    onChange={(e) => setEditingProduct({ ...editingProduct, followUp: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setEditingProduct(null)}>취소</button>
              <button className="btn-primary" onClick={handleSaveEdit}>저장하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
