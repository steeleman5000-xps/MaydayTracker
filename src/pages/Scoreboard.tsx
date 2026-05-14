import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import MatchCard from '../components/MatchCard';
import type { Player, Round, Matchup, AppConfig } from '../types';
import { subscribeConfig, subscribePlayers, subscribeRounds, subscribeMatchups } from '../lib/db';
import { calcMatchResult, aggregateTeamPoints } from '../lib/scoring';

export default function Scoreboard() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [matchups, setMatchups] = useState<Matchup[]>([]);

  useEffect(() => {
    const unsubs = [
      subscribeConfig(setConfig),
      subscribePlayers(setPlayers),
      subscribeRounds(setRounds),
      subscribeMatchups(setMatchups),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
  const roundMap = Object.fromEntries(rounds.map((r) => [r.id, r]));

  const allResults = matchups.flatMap((m) => {
    const pA = playerMap[m.playerAId];
    const pB = playerMap[m.playerBId];
    const pA2 = m.playerA2Id ? playerMap[m.playerA2Id] : undefined;
    const pB2 = m.playerB2Id ? playerMap[m.playerB2Id] : undefined;
    const round = roundMap[m.roundId];
    if (!pA || !pB || !round) return [];
    return [calcMatchResult(m, pA, pB, round.strokeIndexes, pA2, pB2)];
  });

  const totals = aggregateTeamPoints(allResults);
  const teamAName = config?.teamAName ?? 'Team A';
  const teamBName = config?.teamBName ?? 'Team B';
  const maxPoints = rounds.length * players.filter((p) => p.teamId === 'A').length;

  const loading = !config && rounds.length === 0 && players.length === 0;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 text-slate-400">
          Loading…
        </div>
      </Layout>
    );
  }

  if (rounds.length === 0) {
    return (
      <Layout>
        <div className="text-center py-20 text-slate-400">
          <div className="text-5xl mb-4">⛳</div>
          <p className="text-lg font-medium">Tournament not set up yet.</p>
          <p className="text-sm mt-1">Head to Admin to add players, rounds, and matchups.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Team scoreboard */}
        <div className="card">
          <h2 className="text-center text-slate-400 text-xs uppercase tracking-widest mb-4">Team Standings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-4 bg-blue-950 rounded-xl border border-blue-800">
              <div className="text-blue-400 font-bold text-lg">{teamAName}</div>
              <div className="text-5xl font-black text-white mt-2">{totals.A}</div>
              <div className="text-blue-400 text-xs mt-1">points</div>
            </div>
            <div className="flex flex-col items-center p-4 bg-red-950 rounded-xl border border-red-800">
              <div className="text-red-400 font-bold text-lg">{teamBName}</div>
              <div className="text-5xl font-black text-white mt-2">{totals.B}</div>
              <div className="text-red-400 text-xs mt-1">points</div>
            </div>
          </div>
          {maxPoints > 0 && (
            <div className="mt-3 text-center text-slate-500 text-xs">
              {maxPoints} points available across {rounds.length} round{rounds.length > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Per-round breakdown */}
        {rounds.map((round) => {
          const roundMatchups = matchups.filter((m) => m.roundId === round.id);
          const roundResults = roundMatchups.flatMap((m) => {
            const pA = playerMap[m.playerAId];
            const pB = playerMap[m.playerBId];
            const pA2 = m.playerA2Id ? playerMap[m.playerA2Id] : undefined;
            const pB2 = m.playerB2Id ? playerMap[m.playerB2Id] : undefined;
            if (!pA || !pB) return [];
            return [calcMatchResult(m, pA, pB, round.strokeIndexes, pA2, pB2)];
          });
          const roundTotals = aggregateTeamPoints(roundResults);

          return (
            <div key={round.id}>
              <div className="flex items-baseline justify-between mb-2 px-1">
                <h2 className="font-bold text-lg">
                  Round {round.number}
                  <span className="text-slate-400 font-normal text-sm ml-2">{round.courseName}</span>
                </h2>
                <span className="text-sm text-slate-400">
                  <span className="text-blue-400">{roundTotals.A}</span>
                  {' – '}
                  <span className="text-red-400">{roundTotals.B}</span>
                </span>
              </div>
              <div className="space-y-2">
                {roundMatchups.length === 0 && (
                  <p className="text-slate-500 text-sm px-1">No matchups yet.</p>
                )}
                {roundMatchups.map((m) => {
                  const pA = playerMap[m.playerAId];
                  const pB = playerMap[m.playerBId];
                  const pA2 = m.playerA2Id ? playerMap[m.playerA2Id] : undefined;
                  const pB2 = m.playerB2Id ? playerMap[m.playerB2Id] : undefined;
                  if (!pA || !pB || !config) return null;
                  return (
                    <MatchCard
                      key={m.id}
                      matchup={m}
                      playerA={pA}
                      playerB={pB}
                      playerA2={pA2}
                      playerB2={pB2}
                      round={round}
                      config={config}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
