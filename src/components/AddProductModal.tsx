import React, { useState } from 'react';
import { ProductItem, Category, Reliability, ProductStatus } from '../types';
import { calculateImportanceScore } from '../utils/scoreCalculator';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: Omit<ProductItem, 'id'>) => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [brand, setBrand] = useState('');
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState<Category>('패션');
  const [status, setStatus] = useState<ProductStatus>('Inbox');
  const [launchDate, setLaunchDate] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [keyFeatures, setKeyFeatures] = useState('');
  const [targetAudience, setTargetAudience] = useState('파리 트렌드 관심 소비자');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceName, setSourceName] = useState('공식 보도자료');
  const [reliability, setReliability] = useState<Reliability>('공식 발표');
  const [followUp, setFollowUp] = useState('추가 기사 및 이미지 확인');

  const [scoreDetails, setScoreDetails] = useState({
    isOfficialAnnouncement: true,
    isAvailableForPurchase: false,
    isParisExclusive: true,
    isMajorEvent: false,
    isTrustedMedia: true,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !productName) return;

    const { score, level } = calculateImportanceScore(scoreDetails);

    const newProduct: Omit<ProductItem, 'id'> = {
      collectedAt: today,
      brand,
      productName,
      category,
      status,
      launchDate: launchDate || '일정 확인 중',
      location: location || '파리 매장',
      price: price || '미정',
      keyFeatures: keyFeatures || '특징 정보 작성 필요',
      targetAudience,
      sourceUrl: sourceUrl || 'https://www.google.com',
      sourceName,
      reliability,
      importance: level,
      importanceScore: score,
      scoreDetails,
      followUp,
      naverStatus: '대기',
      instaStatus: '대기',
      imagePrepared: false,
    };

    onAddProduct(newProduct);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card card shadow-xl">
        <div className="modal-header">
          <h3>파리 신제품 수동 등록</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body grid-2col">
          <div className="form-column">
            <div className="form-group">
              <label>브랜드명 *</label>
              <input
                type="text"
                required
                placeholder="예: Jacquemus, Diptyque"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>신제품 이름 *</label>
              <input
                type="text"
                required
                placeholder="예: Paris Limited Eau de Parfum"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>카테고리</label>
                <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                  <option value="패션">패션</option>
                  <option value="뷰티">뷰티</option>
                  <option value="식품">식품</option>
                  <option value="테크">테크</option>
                  <option value="라이프스타일">라이프스타일</option>
                </select>
              </div>

              <div className="form-group">
                <label>출시 상태</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as ProductStatus)}>
                  <option value="Inbox">Inbox</option>
                  <option value="검증 완료">검증 완료</option>
                  <option value="출시 예정">출시 예정</option>
                  <option value="출시 완료">출시 완료</option>
                  <option value="관찰 목록">관찰 목록</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>파리 출시일</label>
                <input
                  type="text"
                  placeholder="예: 2026-09-01"
                  value={launchDate}
                  onChange={(e) => setLaunchDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>가격(유로)</label>
                <input
                  type="text"
                  placeholder="예: 180 €"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>장소</label>
              <input
                type="text"
                placeholder="예: 파리 샹젤리제 플래그십"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>타깃 고객</label>
              <input
                type="text"
                placeholder="예: 파리 현지 트렌드 세터"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>핵심 특징 (1~2문장)</label>
              <textarea
                rows={2}
                placeholder="제품의 차별점 및 주요 특징을 적어주세요."
                value={keyFeatures}
                onChange={(e) => setKeyFeatures(e.target.value)}
              />
            </div>
          </div>

          <div className="score-rule-column">
            <div className="score-summary-box">
              <h4>중요도 점수 산출</h4>
              <div className="score-display font-playfair">
                <span className="big-score">+{calculateImportanceScore(scoreDetails).score}</span>
                <span className={`score-level-badge ${calculateImportanceScore(scoreDetails).level}`}>
                  {calculateImportanceScore(scoreDetails).level} 중요도
                </span>
              </div>
            </div>

            <div className="checkbox-list">
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={scoreDetails.isOfficialAnnouncement}
                  onChange={() => setScoreDetails({ ...scoreDetails, isOfficialAnnouncement: !scoreDetails.isOfficialAnnouncement })}
                />
                <span>공식 출시 발표 (+3)</span>
              </label>

              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={scoreDetails.isAvailableForPurchase}
                  onChange={() => setScoreDetails({ ...scoreDetails, isAvailableForPurchase: !scoreDetails.isAvailableForPurchase })}
                />
                <span>실제 판매 가능 (+3)</span>
              </label>

              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={scoreDetails.isParisExclusive}
                  onChange={() => setScoreDetails({ ...scoreDetails, isParisExclusive: !scoreDetails.isParisExclusive })}
                />
                <span>파리 한정 / 팝업 제품 (+2)</span>
              </label>

              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={scoreDetails.isMajorEvent}
                  onChange={() => setScoreDetails({ ...scoreDetails, isMajorEvent: !scoreDetails.isMajorEvent })}
                />
                <span>주요 행사 공개 (+2)</span>
              </label>

              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={scoreDetails.isTrustedMedia}
                  onChange={() => setScoreDetails({ ...scoreDetails, isTrustedMedia: !scoreDetails.isTrustedMedia })}
                />
                <span>신뢰 언론 보도 (+1)</span>
              </label>
            </div>

            <div className="form-group mt-3">
              <label>출처 매체명 / URL</label>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="매체명 (예: Le Figaro)"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="URL (http...)"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>신뢰도</label>
                <select value={reliability} onChange={(e) => setReliability(e.target.value as Reliability)}>
                  <option value="공식 발표">공식 발표</option>
                  <option value="언론 보도">언론 보도</option>
                  <option value="SNS 정보">SNS 정보</option>
                </select>
              </div>

              <div className="form-group">
                <label>후속 조치</label>
                <input
                  type="text"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer mt-4">
              <button type="button" className="btn-outline" onClick={onClose}>취소</button>
              <button type="submit" className="btn-primary">신제품 등록</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
