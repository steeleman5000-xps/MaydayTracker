import type { Trip } from '../types';

export const DEFAULT_LOGO_URL = '/brand/mayday-logo-cropped.png';

export function tripBackgroundUrl(trip?: Trip | null): string {
  if (!trip) return '';
  return trip.backgroundUrl || '';
}
