import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import type { AppConfig, Matchup, Player, Round, TeamId, Trip } from '../types';
import { subscribeConfig, subscribeMatchups, subscribePlayers, subscribeRounds, subscribeTrips } from '../lib/db';
import { calcMatchResult } from '../lib/scoring';
import { tripBackgroundUrl } from '../lib/tripAssets';
import { useTripSelection } from '../lib/tripSelection';

type PlayerRecord = {
  wins: number;
  losses: number;
  ties: number;
  points: number;
};

export default function Players() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [loaded, setLoaded] = useState({
    config: false,
    trips: false,
    players: false,
    rounds: false,
    matchups: false,
  });

  useEffect(() => {
    const unsubs = [
      subscribeConfig((cfg) => {
        setConfig(cfg);
        setLoaded((prev) => ({ ...prev, config: true }));
      }),
      subscribeTrips((nextTrips) => {
        setTrips(nextTrips);
        setLoaded((prev) => ({ ...prev, trips: true }));
      }),
      subscribePlayers((nextPlayers) => {
        setPlayers(nextPlayers);
        setLoaded((prev) => ({ ...prev, players: true }));
      }),
      subscribeRounds((nextRounds) => {
        setRounds(nextRounds);
        setLoaded((prev) => ({ ...prev, rounds: true }));
      }),
      subscribeMatchups((nextMatchups) => {
        setMatchups(nextMatchups);
        setLoaded((prev) => ({ ...prev, matchups: true }));
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const loading = !loaded.config || !loaded.trips || !loaded.players || !loaded.rounds || !loaded.matchups;
  const { selectedTripId, selectedTrip, selectedRounds, hasUnassignedRounds, selectTrip } = useTripSelection({
    trips,
    rounds,
    config,
    ready: !loading,
  });

  const playerMap = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players]);
  const selectedRoundIds = new Set(selectedRounds.map((round) => round.id));

  const records = useMemo(() => {
    const next = Object.fromEntries(
      players.map((player) => [player.id, { wins: 0, losses: 0, ties: 0, points: 0 } as PlayerRecord])
    );

    for (const matchup of matchups) {
      if (!selectedRoundIds.has(matchup.roundId)) continue;
      const round = selectedRounds.find((r) => r.id === matchup.roundId);
      const pA = playerMap[matchup.playerAId];
      const pB = playerMap[matchup.playerBId];
      const pA2 = matchup.playerA2Id ? playerMap[matchup.playerA2Id] : undefined;
      const pB2 = matchup.playerB2Id ? playerMap[matchup.playerB2Id] : undefined;
      if (!round || !pA || !pB) continue;

      const result = calcMatchResult(matchup, pA, pB, round.strokeIndexes, pA2, pB2);
      if (!result.isComplete) continue;

      const teamAIds = [matchup.playerAId, matchup.playerA2Id].filter((id): id is string => Boolean(id));
      const teamBIds = [matchup.playerBId, matchup.playerB2Id].filter((id): id is string => Boolean(id));

      function add(ids: string[], outcome: 'win' | 'loss' | 'tie', points: number) {
        for (const id of ids) {
          const rec = next[id];
          if (!rec) continue;
          if (outcome === 'win') rec.wins++;
          if (outcome === 'loss') rec.losses++;
          if (outcome === 'tie') rec.ties++;
          rec.points += points;
        }
      }

      if (result.winner === 'A') {
        add(teamAIds, 'win', result.pointsA);
        add(teamBIds, 'loss', result.pointsB);
      } else if (result.winner === 'B') {
        add(teamAIds, 'loss', result.pointsA);
        add(teamBIds, 'win', result.pointsB);
      } else {
        add(teamAIds, 'tie', result.pointsA);
        add(teamBIds, 'tie', result.pointsB);
      }
    }

    return next;
  }, [matchups, playerMap, players, selectedRoundIds, selectedRounds]);

  const backgroundUrl = tripBackgroundUrl(selectedTrip);
  const teamAName = selectedTrip?.teamAName || config?.teamAName || 'Team A';
  const teamBName = selectedTrip?.teamBName || config?.teamBName || 'Team B';

  function sortedTeam(teamId: TeamId) {
    return players
      .filter((player) => player.teamId === teamId)
      .sort((a, b) => {
        const recA = records[a.id] ?? { wins: 0, losses: 0, ties: 0, points: 0 };
        const recB = records[b.id] ?? { wins: 0, losses: 0, ties: 0, points: 0 };
        return recB.points - recA.points || recB.wins - recA.wins || a.handicap - b.handicap || a.name.localeCompare(b.name);
      });
  }

  if (loading) {
    return (
      <Layout backgroundUrl={backgroundUrl}>
        <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout
      backgroundUrl={backgroundUrl}
      trips={trips}
      selectedTripId={selectedTripId}
      hasUnassignedRounds={hasUnassignedRounds}
      onTripChange={selectTrip}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black">Players</h1>
          <p className="text-slate-400 text-sm mt-1">
            Records count completed matches for the selected trip.
          </p>
        </div>

        <TeamTable title={teamAName} color="blue" players={sortedTeam('A')} records={records} />
        <TeamTable title={teamBName} color="red" players={sortedTeam('B')} records={records} />
      </div>
    </Layout>
  );
}

function TeamTable({
  title,
  color,
  players,
  records,
}: {
  title: string;
  color: 'blue' | 'red';
  players: Player[];
  records: Record<string, PlayerRecord>;
}) {
  const titleColor = color === 'blue' ? 'text-blue-400' : 'text-red-400';

  return (
    <div>
      <h2 className={`font-bold text-lg mb-2 ${titleColor}`}>{title}</h2>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-xs border-b border-slate-700">
              <th className="text-left py-2 pr-2">Player</th>
              <th className="text-right py-2 px-2">HCP</th>
              <th className="text-right py-2 pl-2">Record</th>
              <th className="text-right py-2 pl-2">Pts</th>
            </tr>
          </thead>
          <tbody>
            {players.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-slate-500">No players yet.</td>
              </tr>
            )}
            {players.map((player) => {
              const rec = records[player.id] ?? { wins: 0, losses: 0, ties: 0, points: 0 };
              return (
                <tr key={player.id} className="border-b border-slate-800 last:border-0">
                  <td className="py-2 pr-2 font-medium">{player.name}</td>
                  <td className="py-2 px-2 text-right text-slate-300">{player.handicap}</td>
                  <td className="py-2 pl-2 text-right font-mono text-slate-200">
                    {rec.wins}-{rec.losses}-{rec.ties}
                  </td>
                  <td className="py-2 pl-2 text-right font-semibold text-white">{rec.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
