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
      className="min-h-screen bg-slate-900 flex flex-col relative"
      style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center top', backgroundAttachment: 'fixed' } : undefined}
    >
      {backgroundUrl && <div className="fixed inset-0 bg-slate-950/78 pointer-events-none" />}
      <header className="bg-slate-950/95 border-b border-slate-800 px-3 py-3 sticky top-0 z-10 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img src={DEFAULT_LOGO_URL} alt="Mayday Golf Classic" className="h-9 w-auto" />
            </Link>
            {showTripSelector && (
              <select
                className="h-9 w-[180px] max-w-[52vw] rounded-lg border border-slate-700 bg-slate-900 px-2 text-xs font-semibold text-white focus:border-emerald-500 focus:outline-none sm:w-64 sm:text-sm"
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
        <div className="flex gap-1 text-xs sm:text-sm overflow-x-auto">
          <Link
            to="/"
            className={`px-2 sm:px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
              pathname === '/'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Scores
          </Link>
          <Link
            to="/players"
            className={`px-2 sm:px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
              pathname === '/players'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Players
          </Link>
          <Link
            to="/my-player"
            className={`px-2 sm:px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
              pathname === '/my-player'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Me
          </Link>
          <Link
            to="/admin"
            className={`px-2 sm:px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
              pathname === '/admin'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-400 hover:text-white'
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
