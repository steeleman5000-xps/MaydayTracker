import type { Trip } from '../types';

export const DEFAULT_LOGO_URL = '/brand/mayday-logo-cropped.png';
export const SILVERADO_2026_BACKGROUND_URL = '/trips/2026-silverado-napa-valley.jpg';

export function defaultBackgroundForTrip(year: number, name: string): string {
  const normalized = name.toLowerCase();
  if (
    year === 2026 &&
    normalized.includes('silverado') &&
    normalized.includes('napa')
  ) {
    return SILVERADO_2026_BACKGROUND_URL;
  }
  return '';
}

export function tripBackgroundUrl(trip?: Trip | null): string {
  if (!trip) return '';
  return trip.backgroundUrl || defaultBackgroundForTrip(trip.year, trip.name);
}
