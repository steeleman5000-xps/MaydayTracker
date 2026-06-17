import { useEffect, useMemo, useState } from 'react';
import type { AppConfig, Round, Trip } from '../types';

export const UNASSIGNED_TRIP = '__unassigned__';
export const SELECTED_TRIP_KEY = 'mayday_selected_trip_id';

const TRIP_CHANGE_EVENT = 'mayday-trip-change';

export function useTripSelection({
  trips,
  rounds,
  config,
  ready = true,
}: {
  trips: Trip[];
  rounds: Round[];
  config: AppConfig | null;
  ready?: boolean;
}) {
  const [selectedTripId, setSelectedTripId] = useState(() => localStorage.getItem(SELECTED_TRIP_KEY) ?? '');
  const hasUnassignedRounds = useMemo(() => rounds.some((round) => !round.tripId), [rounds]);

  useEffect(() => {
    function handleTripChange() {
      setSelectedTripId(localStorage.getItem(SELECTED_TRIP_KEY) ?? '');
    }
    window.addEventListener(TRIP_CHANGE_EVENT, handleTripChange);
    window.addEventListener('storage', handleTripChange);
    return () => {
      window.removeEventListener(TRIP_CHANGE_EVENT, handleTripChange);
      window.removeEventListener('storage', handleTripChange);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const savedTripId = localStorage.getItem(SELECTED_TRIP_KEY) ?? '';
    const resolved = resolveTripId(savedTripId || selectedTripId, trips, rounds, config, hasUnassignedRounds);
    if (resolved !== selectedTripId) setSelectedTripId(resolved);
    if (resolved !== savedTripId) localStorage.setItem(SELECTED_TRIP_KEY, resolved);
  }, [config, hasUnassignedRounds, ready, rounds, selectedTripId, trips]);

  function selectTrip(tripId: string) {
    setSelectedTripId(tripId);
    localStorage.setItem(SELECTED_TRIP_KEY, tripId);
    window.dispatchEvent(new CustomEvent(TRIP_CHANGE_EVENT));
  }

  const selectedRounds = useMemo(
    () => filterRoundsForTrip(rounds, selectedTripId, trips.length),
    [rounds, selectedTripId, trips.length]
  );
  const selectedTrip = trips.find((trip) => trip.id === selectedTripId);

  return {
    selectedTripId,
    selectedTrip,
    selectedRounds,
    hasUnassignedRounds,
    selectTrip,
  };
}

export function filterRoundsForTrip(rounds: Round[], selectedTripId: string, tripCount: number): Round[] {
  if (selectedTripId === UNASSIGNED_TRIP) return rounds.filter((round) => !round.tripId);
  if (selectedTripId) return rounds.filter((round) => round.tripId === selectedTripId);
  return tripCount === 0 ? rounds : [];
}

function resolveTripId(
  requestedTripId: string,
  trips: Trip[],
  rounds: Round[],
  config: AppConfig | null,
  hasUnassignedRounds: boolean
): string {
  if (requestedTripId && trips.some((trip) => trip.id === requestedTripId)) return requestedTripId;
  if (requestedTripId === UNASSIGNED_TRIP && hasUnassignedRounds) return requestedTripId;
  if (config?.activeTripId && trips.some((trip) => trip.id === config.activeTripId)) return config.activeTripId;
  if (trips[0]) return trips[0].id;
  if (hasUnassignedRounds) return UNASSIGNED_TRIP;
  return rounds.length > 0 && trips.length === 0 ? '' : '';
}
