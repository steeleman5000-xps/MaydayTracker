import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import type { AppConfig, Matchup, Player, Round, Trip } from '../types';
import { subscribeConfig, subscribeMatchups, subscribePlayers, subscribeRounds, subscribeTrips } from '../lib/db';
import { tripBackgroundUrl } from '../lib/tripAssets';
import { useTripSelection } from '../lib/tripSelection';

export default function Scorecards() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsubs = [
      subscribeConfig(setConfig),
      subscribeTrips(setTrips),
      subscribeRounds(setRounds),
      subscribeMatchups(setMatchups),
      subscribePlayers(setPlayers),
    ];
    setLoaded(true);
    return () => unsubs.forEach((u) => u());
  }, []);

  const { selectedTripId, selectedTrip, selectedRounds, hasUnassignedRounds, selectTrip } = useTripSelection({
    trips,
    rounds,
    config,
    ready: loaded,
  });
  const roundIds = useMemo(() => new Set(selectedRounds.map((round) => round.id)), [selectedRounds]);
  const playerMap = useMemo(() => Object.fromEntries(players.map((player) => [player.id, player])), [players]);
  const roundMap = useMemo(() => Object.fromEntries(selectedRounds.map((round) => [round.id, round])), [selectedRounds]);
  const selectedMatchups = matchups
    .filter((matchup) => roundIds.has(matchup.roundId))
    .sort((a, b) => {
      const roundA = roundMap[a.roundId]?.number ?? 0;
      const roundB = roundMap[b.roundId]?.number ?? 0;
      return roundA - roundB || (a.teeTime ?? '').localeCompare(b.teeTime ?? '') || a.createdAt - b.createdAt;
    });

  return (
    <Layout
      backgroundUrl={tripBackgroundUrl(selectedTrip)}
      trips={trips}
      selectedTripId={selectedTripId}
      hasUnassignedRounds={hasUnassignedRounds}
      onTripChange={selectTrip}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black">Printable Scorecards</h1>
          <p className="mt-1 text-sm text-slate-400">
            Generate branded cards with course data, tee boxes, players, and handicap stroke dots.
          </p>
        </div>

        {selectedMatchups.length === 0 ? (
          <div className="card py-10 text-center text-slate-400">
            <p className="font-semibold text-white">No matchups for this trip yet.</p>
            <p className="mt-1 text-sm">Create matchups in Admin, then print cards from here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedMatchups.map((matchup) => {
              const round = roundMap[matchup.roundId];
              const pA = playerMap[matchup.playerAId];
              const pB = playerMap[matchup.playerBId];
              const pA2 = matchup.playerA2Id ? playerMap[matchup.playerA2Id] : undefined;
              const pB2 = matchup.playerB2Id ? playerMap[matchup.playerB2Id] : undefined;
              if (!round || !pA || !pB) return null;
              return (
                <Link
                  key={matchup.id}
                  to={`/scorecards/${matchup.id}`}
                  className="card block hover:border-emerald-600"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        Round {round.number} · {round.courseName}
                      </div>
                      <div className="mt-1 font-bold text-white">
                        {pA.name}{pA2 ? ` / ${pA2.name}` : ''} <span className="text-slate-500">vs</span> {pB.name}{pB2 ? ` / ${pB2.name}` : ''}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {matchup.teeTime ? formatTime(matchup.teeTime) : 'No tee time'} · {matchup.format === 'fourball' ? 'Fourball' : 'Singles'} · {round.teeName ?? 'tee TBD'}
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-emerald-300">Print</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

function formatTime(time: string): string {
  const [hoursRaw, minutes] = time.split(':').map(Number);
  if (!Number.isFinite(hoursRaw) || !Number.isFinite(minutes)) return time;
  const suffix = hoursRaw >= 12 ? 'PM' : 'AM';
  const hours = hoursRaw % 12 || 12;
  return `${hours}:${String(minutes).padStart(2, '0')} ${suffix}`;
}
