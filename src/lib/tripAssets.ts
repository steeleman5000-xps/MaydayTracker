import type { Trip } from '../types';

export const DEFAULT_LOGO_URL = '/brand/mayday-logo-cropped.png';
export const DEFAULT_TRIP_BACKGROUND_URL = '/trips/example-trip-background.jpg';

export function defaultBackgroundForTrip(year: number, name: string): string {
  const normalized = name.toLowerCase();
  if (
    year === 2026 &&
    normalized.includes('example') &&
    normalized.includes('trip')
  ) {
    return DEFAULT_TRIP_BACKGROUND_URL;
  }
  return '';
}

export function tripBackgroundUrl(trip?: Trip | null): string {
  if (!trip) return '';
  return trip.backgroundUrl || defaultBackgroundForTrip(trip.year, trip.name);
}
