import { Link, useLocation } from 'react-router-dom';
import { DEFAULT_LOGO_URL } from '../lib/tripAssets';
import { UNASSIGNED_TRIP } from '../lib/tripSelection';
import type { Trip } from '../types';

interface Props {
  children: React.ReactNode;
  backgroundUrl?: string;
  trips?: Trip[];
  selectedTripId?: string;
  hasUnassignedRounds?: boolean;
  onTripChange?: (tripId: string) => void;
}

export default function Layout({
  children,
  backgroundUrl,
  trips = [],
  selectedTripId = '',
  hasUnassignedRounds = false,
  onTripChange,
}: Props) {
  const { pathname } = useLocation();
  const showTripSelector = Boolean(onTripChange) && (trips.length > 0 || hasUnassignedRounds);

  return (
    <div
      className="min-h-screen bg-slate-950 flex flex-col relative"
    >
      {backgroundUrl && (
        <>
          <div
            className="fixed inset-0 bg-cover bg-center bg-fixed opacity-20 pointer-events-none"
            style={{ backgroundImage: `url(${backgroundUrl})` }}
          />
          <div className="fixed inset-0 bg-slate-950/84 pointer-events-none" />
        </>
      )}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-3 py-2 text-slate-950 shadow-sm backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-2 lg:grid-cols-[auto_1fr_auto]">
          <div className="flex min-w-0 items-center gap-2 justify-between lg:justify-start">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img src={DEFAULT_LOGO_URL} alt="Mayday Golf Classic" className="h-11 w-auto" />
            </Link>
            {showTripSelector && (
              <select
                className="h-9 w-[180px] max-w-[52vw] rounded-lg border border-slate-300 bg-slate-50 px-2 text-xs font-semibold text-slate-900 focus:border-emerald-600 focus:outline-none sm:w-64 sm:text-sm"
                value={selectedTripId}
                onChange={(e) => onTripChange?.(e.target.value)}
                aria-label="Selected trip"
              >
                {trips.map((trip) => (
                  <option key={trip.id} value={trip.id}>{trip.year} {trip.name}</option>
                ))}
                {hasUnassignedRounds && <option value={UNASSIGNED_TRIP}>Unassigned rounds</option>}
                {trips.length === 0 && !hasUnassignedRounds && <option value="">No trips yet</option>}
              </select>
            )}
          </div>
          <div className="hidden text-center font-black uppercase tracking-[0.22em] text-slate-900 sm:block">
            Mayday Golf Championship
          </div>
        <div className="flex gap-1 overflow-x-auto text-xs sm:text-sm lg:justify-end">
          <Link
            to="/scores"
            className={`px-2 sm:px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
              pathname === '/scores'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            Scores
          </Link>
          <Link
            to="/players"
            className={`px-2 sm:px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
              pathname === '/players'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            Players
          </Link>
          <Link
            to="/itinerary"
            className={`px-2 sm:px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
              pathname === '/itinerary'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            Itinerary
          </Link>
          <Link
            to="/scorecards"
            className={`px-2 sm:px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
              pathname.startsWith('/scorecards')
                ? 'bg-emerald-700 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            Cards
          </Link>
          <Link
            to="/merch"
            className={`px-2 sm:px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
              pathname === '/merch'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            Merch
          </Link>
          <Link
            to="/games"
            className={`px-2 sm:px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
              pathname === '/games'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            Games
          </Link>
          <Link
            to="/my-player"
            className={`px-2 sm:px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
              pathname === '/my-player'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            Me
          </Link>
          <Link
            to="/admin"
            className={`px-2 sm:px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
              pathname === '/admin'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            Admin
          </Link>
        </div>
        </div>
      </header>
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full relative z-0">{children}</main>
    </div>
  );
}
