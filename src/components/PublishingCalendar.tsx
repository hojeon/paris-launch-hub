import React from 'react';
import { ProductItem, PublishStatus } from '../types';
import { Calendar, CheckCircle2, Clock, CalendarDays, ExternalLink, Sparkles } from 'lucide-react';

interface PublishingCalendarProps {
  products: ProductItem[];
  onUpdateStatus: (id: string, field: 'naverStatus' | 'instaStatus', status: PublishStatus) => void;
  onToggleImage: (id: string) => void;
}

export const PublishingCalendar: React.FC<PublishingCalendarProps> = ({
  products,
  onUpdateStatus,
  onToggleImage,
}) => {
  const publishRoutines = [
    { day: '월요일 루틴', title: '이번 주 파리 신제품 3선 모음집', cat: '주간 모음집', desc: '주말 동안 수집된 파리 이슈 중 중요도 높은 3개 제품 큐레이션' },
    { day: '수요일 루틴', title: '단일 브랜드 신제품 상세 리뷰', cat: '단일 심층', desc: '공식 발표 및 판매 가능 항목 중 가장 핫한 신제품 1개 집중 분석' },
    { day: '금요일 루틴', title: '파리 팝업 & 이달의 행사 일정 정리', cat: '팝업/행사', desc: '주말에 파리 매장/팝업 방문할 사람들을 위한 스팟 & 캘린더 정리' },
    { day: '월말 루틴', title: '이달의 파리 주목 신제품 TOP 5', cat: '월간 랭킹', desc: '중요도 점수 상위 5개 제품의 총집편 리뷰' },
  ];

  return (
    <div className="calendar-container">
      {/* 1. Top Section: Weekly Operation Routines */}
      <div className="card shadow-md mb-4">
        <div className="card-header mb-3">
          <div className="icon-wrapper gold"><CalendarDays size={20} /></div>
          <div>
            <h3>주간/월간 콘텐츠 발행 루틴 가이드</h3>
            <p className="text-muted">효율적인 피드 운영을 위한 권장 발행 일정 체계입니다.</p>
          </div>
        </div>

        <div className="routine-grid">
          {publishRoutines.map((rt, i) => (
            <div key={i} className="routine-card">
              <div className="routine-header font-playfair">
                <span className="routine-day">{rt.day}</span>
                <span className="routine-cat">{rt.cat}</span>
              </div>
              <h4 className="routine-title">{rt.title}</h4>
              <p className="routine-desc">{rt.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Bottom Section: Publishing Pipeline Matrix */}
      <div className="card shadow-md">
        <div className="card-header space-between mb-4">
          <div>
            <h3>신제품 콘텐츠 발행 파이프라인 관리</h3>
            <p className="text-muted">네이버 원고 및 인스타그램 카드뉴스 준비 현황을 체크하세요.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="product-table">
            <thead>
              <tr>
                <th>브랜드 / 제품명</th>
                <th>파리 출시일</th>
                <th>중요도</th>
                <th>네이버 원고 상태</th>
                <th>인스타 카드뉴스 상태</th>
                <th>이미지 준비</th>
                <th>발행 예정일</th>
                <th>발행 결과 링크</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => (
                <tr key={item.id} className="table-row-hover">
                  <td>
                    <strong>{item.brand}</strong> - {item.productName}
                  </td>
                  <td className="text-xs">{item.launchDate}</td>
                  <td>
                    <span className={`badge-importance ${item.importance}`}>
                      +{item.importanceScore}
                    </span>
                  </td>
                  <td>
                    <select
                      value={item.naverStatus}
                      onChange={(e) => onUpdateStatus(item.id, 'naverStatus', e.target.value as PublishStatus)}
                      className={`status-select ${item.naverStatus}`}
                    >
                      <option value="대기">대기</option>
                      <option value="원고 완료">원고 완료</option>
                      <option value="발행 완료">발행 완료</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={item.instaStatus}
                      onChange={(e) => onUpdateStatus(item.id, 'instaStatus', e.target.value as PublishStatus)}
                      className={`status-select ${item.instaStatus}`}
                    >
                      <option value="대기">대기</option>
                      <option value="카드뉴스 완료">카드뉴스 완료</option>
                      <option value="발행 완료">발행 완료</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className={`check-toggle-btn ${item.imagePrepared ? 'done' : ''}`}
                      onClick={() => onToggleImage(item.id)}
                    >
                      {item.imagePrepared ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                      <span>{item.imagePrepared ? '준비됨' : '미준비'}</span>
                    </button>
                  </td>
                  <td className="text-xs font-medium">
                    {item.scheduledDate || '미정'}
                  </td>
                  <td>
                    <div className="flex-gap-1">
                      {item.naverUrl && (
                        <a href={item.naverUrl} target="_blank" rel="noreferrer" className="btn-icon" title="네이버 글 보기">
                          N
                        </a>
                      )}
                      {item.instaUrl && (
                        <a href={item.instaUrl} target="_blank" rel="noreferrer" className="btn-icon" title="인스타 글 보기">
                          I
                        </a>
                      )}
                      {!item.naverUrl && !item.instaUrl && (
                        <span className="text-xs text-muted">미등록</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
