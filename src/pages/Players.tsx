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
  rank: number;
  matches: number;
  holesWon: number;
  grossTotal: number;
  netTotal: number;
  scoredRounds: number;
  wagerWins: number;
};

const EMPTY_RECORD: PlayerRecord = {
  wins: 0,
  losses: 0,
  ties: 0,
  points: 0,
  rank: 0,
  matches: 0,
  holesWon: 0,
  grossTotal: 0,
  netTotal: 0,
  scoredRounds: 0,
  wagerWins: 0,
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
  const selectedRoundIds = useMemo(() => new Set(selectedRounds.map((round) => round.id)), [selectedRounds]);

  const records = useMemo(() => {
    const next = Object.fromEntries(
      players.map((player) => [player.id, { ...EMPTY_RECORD } as PlayerRecord])
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

      const teamAIds = [matchup.playerAId, matchup.playerA2Id].filter((id): id is string => Boolean(id));
      const teamBIds = [matchup.playerBId, matchup.playerB2Id].filter((id): id is string => Boolean(id));

      function add(ids: string[], outcome: 'win' | 'loss' | 'tie', points: number) {
        for (const id of ids) {
          const rec = next[id];
          if (!rec) continue;
          rec.matches++;
          if (outcome === 'win') rec.wins++;
          if (outcome === 'loss') rec.losses++;
          if (outcome === 'tie') rec.ties++;
          rec.points += points;
        }
      }

      if (result.isComplete) {
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

      addNetTotals(next, matchup, result);
      addHoleStats(next, matchup, result);

      if (result.isComplete && matchup.matchWager) {
        if (result.winner === 'A') teamAIds.forEach((id) => { if (next[id]) next[id].wagerWins++; });
        if (result.winner === 'B') teamBIds.forEach((id) => { if (next[id]) next[id].wagerWins++; });
      }
    }

    const ranked = Object.entries(next)
      .sort(([, a], [, b]) => b.points - a.points || b.wins - a.wins || a.netTotal - b.netTotal);
    ranked.forEach(([id], index) => { next[id].rank = index + 1; });

    return next;
  }, [matchups, playerMap, players, selectedRoundIds, selectedRounds]);

  const backgroundUrl = tripBackgroundUrl(selectedTrip);
  const teamAName = selectedTrip?.teamAName || config?.teamAName || 'Team A';
  const teamBName = selectedTrip?.teamBName || config?.teamBName || 'Team B';

  function sortedTeam(teamId: TeamId) {
    return players
      .filter((player) => player.teamId === teamId)
      .sort((a, b) => {
        const recA = records[a.id] ?? EMPTY_RECORD;
        const recB = records[b.id] ?? EMPTY_RECORD;
        return recB.points - recA.points || recB.wins - recA.wins || a.handicap - b.handicap || a.name.localeCompare(b.name);
      });
  }

  const pointsLeader = players.map((player) => ({ player, rec: records[player.id] ?? EMPTY_RECORD }))
    .sort((a, b) => b.rec.points - a.rec.points)[0];
  const netLeader = players
    .map((player) => ({ player, rec: records[player.id] ?? EMPTY_RECORD }))
    .filter((entry) => entry.rec.scoredRounds > 0)
    .sort((a, b) => a.rec.netTotal - b.rec.netTotal)[0];
  const wagerLeader = players.map((player) => ({ player, rec: records[player.id] ?? EMPTY_RECORD }))
    .sort((a, b) => b.rec.wagerWins - a.rec.wagerWins)[0];

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
            Records, net totals, wager wins, and trip analytics for the selected trip.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <LeaderboardCard label="Points Leader" name={pointsLeader?.player.name ?? '-'} value={`${pointsLeader?.rec.points ?? 0} pts`} />
          <LeaderboardCard label="Net Champion" name={netLeader?.player.name ?? '-'} value={netLeader ? String(netLeader.rec.netTotal) : '-'} />
          <LeaderboardCard label="Wager Menace" name={wagerLeader?.player.name ?? '-'} value={`${wagerLeader?.rec.wagerWins ?? 0} wins`} />
        </div>

        <TeamTable title={teamAName} color="blue" players={sortedTeam('A')} records={records} maxPoints={pointsLeader?.rec.points ?? 0} />
        <TeamTable title={teamBName} color="red" players={sortedTeam('B')} records={records} maxPoints={pointsLeader?.rec.points ?? 0} />
      </div>
    </Layout>
  );
}

function TeamTable({
  title,
  color,
  players,
  records,
  maxPoints,
}: {
  title: string;
  color: 'blue' | 'red';
  players: Player[];
  records: Record<string, PlayerRecord>;
  maxPoints: number;
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
              <th className="text-right py-2 px-2">Rank</th>
              <th className="text-right py-2 px-2">HCP</th>
              <th className="text-right py-2 pl-2">Record</th>
              <th className="text-right py-2 pl-2">Pts</th>
              <th className="text-right py-2 pl-2">Net</th>
              <th className="text-right py-2 pl-2">Holes</th>
              <th className="text-right py-2 pl-2">Wagers</th>
            </tr>
          </thead>
          <tbody>
            {players.length === 0 && (
              <tr>
                <td colSpan={8} className="py-4 text-center text-slate-500">No players yet.</td>
              </tr>
            )}
            {players.map((player) => {
              const rec = records[player.id] ?? EMPTY_RECORD;
              const pointWidth = maxPoints > 0 ? `${Math.max(8, (rec.points / maxPoints) * 100)}%` : '0%';
              return (
                <tr key={player.id} className="border-b border-slate-800 last:border-0">
                  <td className="py-2 pr-2 font-medium">
                    <div>{player.name}</div>
                    <div className="mt-1 h-1.5 rounded bg-slate-700">
                      <div className={`h-1.5 rounded ${color === 'blue' ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: pointWidth }} />
                    </div>
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-slate-300">#{rec.rank || '-'}</td>
                  <td className="py-2 px-2 text-right text-slate-300">{player.handicap}</td>
                  <td className="py-2 pl-2 text-right font-mono text-slate-200">
                    {rec.wins}-{rec.losses}-{rec.ties}
                  </td>
                  <td className="py-2 pl-2 text-right font-semibold text-white">{rec.points}</td>
                  <td className="py-2 pl-2 text-right text-slate-200">{rec.scoredRounds ? rec.netTotal : '-'}</td>
                  <td className="py-2 pl-2 text-right text-slate-200">{rec.holesWon}</td>
                  <td className="py-2 pl-2 text-right text-yellow-300">{rec.wagerWins}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LeaderboardCard({ label, name, value }: { label: string; name: string; value: string }) {
  return (
    <div className="card">
      <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</div>
      <div className="mt-2 truncate text-lg font-black text-white">{name}</div>
      <div className="mt-1 text-sm font-semibold text-emerald-300">{value}</div>
    </div>
  );
}

function addNetTotals(records: Record<string, PlayerRecord>, matchup: Matchup, result: ReturnType<typeof calcMatchResult>) {
  const slots = [
    { id: matchup.playerAId, scoreKey: 'playerA' as const, strokeKey: 'a1' as const, manualKey: 'playerA' as const },
    { id: matchup.playerA2Id, scoreKey: 'playerA2' as const, strokeKey: 'a2' as const, manualKey: 'playerA2' as const },
    { id: matchup.playerBId, scoreKey: 'playerB' as const, strokeKey: 'b1' as const, manualKey: 'playerB' as const },
    { id: matchup.playerB2Id, scoreKey: 'playerB2' as const, strokeKey: 'b2' as const, manualKey: 'playerB2' as const },
  ];

  for (const slot of slots) {
    if (!slot.id || !records[slot.id]) continue;
    const manualGross = matchup.manualResult?.playerTotals?.[slot.manualKey];
    if (manualGross != null) {
      records[slot.id].grossTotal += manualGross;
      records[slot.id].netTotal += manualGross - result.strokes[slot.strokeKey];
      records[slot.id].scoredRounds++;
      continue;
    }

    let gross = 0;
    let net = 0;
    let holes = 0;
    for (let hole = 1; hole <= 18; hole++) {
      const score = matchup.scores[hole]?.[slot.scoreKey];
      if (score == null) continue;
      gross += score;
      net += score - (result.strokeHoles[hole]?.[slot.strokeKey] ?? 0);
      holes++;
    }
    if (holes > 0) {
      records[slot.id].grossTotal += gross;
      records[slot.id].netTotal += net;
      records[slot.id].scoredRounds++;
    }
  }
}

function addHoleStats(records: Record<string, PlayerRecord>, matchup: Matchup, result: ReturnType<typeof calcMatchResult>) {
  const teamAIds = [matchup.playerAId, matchup.playerA2Id].filter((id): id is string => Boolean(id));
  const teamBIds = [matchup.playerBId, matchup.playerB2Id].filter((id): id is string => Boolean(id));

  for (let hole = 1; hole <= 18; hole++) {
    const score = matchup.scores[hole];
    if (!score) continue;
    const strokes = result.strokeHoles[hole];
    if (!strokes) continue;

    const aScores = [
      score.playerA != null ? score.playerA - strokes.a1 : null,
      score.playerA2 != null ? score.playerA2 - strokes.a2 : null,
    ].filter((value): value is number => value != null);
    const bScores = [
      score.playerB != null ? score.playerB - strokes.b1 : null,
      score.playerB2 != null ? score.playerB2 - strokes.b2 : null,
    ].filter((value): value is number => value != null);
    if (aScores.length === 0 || bScores.length === 0) continue;

    const bestA = Math.min(...aScores);
    const bestB = Math.min(...bScores);
    if (bestA < bestB) {
      teamAIds.forEach((id) => { if (records[id]) records[id].holesWon++; });
      if (matchup.wagers?.[hole]) teamAIds.forEach((id) => { if (records[id]) records[id].wagerWins++; });
    }
    if (bestB < bestA) {
      teamBIds.forEach((id) => { if (records[id]) records[id].holesWon++; });
      if (matchup.wagers?.[hole]) teamBIds.forEach((id) => { if (records[id]) records[id].wagerWins++; });
    }
  }
}
