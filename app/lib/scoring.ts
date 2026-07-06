export interface ScoreResult {
  score: number;
  distanceKm: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

export function calculateScore(
  guess: LatLng,
  correct: LatLng,
  timeTaken: number,
  totalTime: number
): ScoreResult {
  const distanceKm = haversineDistance(guess, correct);
  const distScore = Math.max(0, 4000 * Math.exp(-distanceKm / 500));
  const timeBonus = Math.round(1000 * Math.max(0, 1 - timeTaken / totalTime));
  const score = Math.min(5000, Math.max(0, Math.round(distScore + timeBonus)));
  return { score, distanceKm };
}
