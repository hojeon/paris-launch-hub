import { ScoreDetails, Importance } from '../types';

export function calculateImportanceScore(details: ScoreDetails): { score: number; level: Importance } {
  let score = 0;

  if (details.isOfficialAnnouncement) score += 3;
  if (details.isAvailableForPurchase) score += 3;
  if (details.isParisExclusive) score += 2;
  if (details.isMajorEvent) score += 2;
  if (details.isTrustedMedia) score += 1;

  let level: Importance = '낮음';
  if (score >= 6) {
    level = '높음';
  } else if (score >= 3) {
    level = '중간';
  }

  return { score, level };
}
