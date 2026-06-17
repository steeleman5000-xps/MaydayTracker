import { Link, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import type { AppConfig, Matchup, Player, Round, Trip } from '../types';
import { subscribeConfig, subscribeMatchup, subscribePlayers, subscribeRounds, subscribeTrips } from '../lib/db';
import { calcMatchResult } from '../lib/scoring';
import { DEFAULT_LOGO_URL, tripBackgroundUrl } from '../lib/tripAssets';

type PlayerLine = {
  key: 'a1' | 'a2' | 'b1' | 'b2';
  player: Player;
  team: 'A' | 'B';
  strokes: number;
};

export default function PrintableScorecard() {
  const { matchupId } = useParams<{ matchupId: string }>();
  const [matchup, setMatchup] = useState<Matchup | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    if (!matchupId) return;
    const unsubs = [
      subscribeMatchup(matchupId, setMatchup),
      subscribePlayers(setPlayers),
      subscribeRounds(setRounds),
      subscribeTrips(setTrips),
      subscribeConfig(setConfig),
    ];
    return () => unsubs.forEach((u) => u());
  }, [matchupId]);

  const playerMap = useMemo(() => Object.fromEntries(players.map((player) => [player.id, player])), [players]);
  const round = matchup ? rounds.find((item) => item.id === matchup.roundId) : undefined;
  const trip = round?.tripId ? trips.find((item) => item.id === round.tripId) : undefined;

  if (!matchup || !round || !config) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center text-slate-400">Loading scorecard...</div>
      </Layout>
    );
  }

  const playerA = playerMap[matchup.playerAId];
  const playerB = playerMap[matchup.playerBId];
  const playerA2 = matchup.playerA2Id ? playerMap[matchup.playerA2Id] : undefined;
  const playerB2 = matchup.playerB2Id ? playerMap[matchup.playerB2Id] : undefined;
  if (!playerA || !playerB) {
    return (
      <Layout>
        <div className="py-20 text-center text-slate-400">Players not found.</div>
      </Layout>
    );
  }

  const result = calcMatchResult(matchup, playerA, playerB, round.strokeIndexes, playerA2, playerB2);
  const lines: PlayerLine[] = [
    { key: 'a1', player: playerA, team: 'A', strokes: result.strokes.a1 },
    ...(playerA2 ? [{ key: 'a2' as const, player: playerA2, team: 'A' as const, strokes: result.strokes.a2 }] : []),
    { key: 'b1', player: playerB, team: 'B', strokes: result.strokes.b1 },
    ...(playerB2 ? [{ key: 'b2' as const, player: playerB2, team: 'B' as const, strokes: result.strokes.b2 }] : []),
  ];
  const brandColor = round.courseBrandColor ?? '#0f766e';

  return (
    <Layout backgroundUrl={tripBackgroundUrl(trip)}>
      <div className="scorecard-print-shell space-y-4">
        <div className="flex justify-between gap-3 print:hidden">
          <Link to="/scorecards" className="btn-secondary">Back</Link>
          <button className="btn-primary" onClick={() => window.print()}>Print Scorecard</button>
        </div>

        <div className="rounded-xl bg-white p-4 text-slate-950 shadow-2xl print:rounded-none print:shadow-none">
          <div className="flex items-center justify-between gap-4 border-b-4 pb-3" style={{ borderColor: brandColor }}>
            <div className="flex items-center gap-3">
              <img
                src={round.courseLogoUrl || DEFAULT_LOGO_URL}
                alt={round.courseName}
                className="h-16 w-16 object-contain"
              />
              <div>
                <div className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: brandColor }}>
                  Mayday Golf Championship
                </div>
                <h1 className="text-2xl font-black">{round.courseName}</h1>
                <div className="text-sm text-slate-600">
                  Round {round.number} · {round.teeName ?? 'Tee TBD'} {round.courseRating && round.slopeRating ? `· ${round.courseRating} / ${round.slopeRating}` : ''}
                </div>
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="font-black">{matchup.format === 'fourball' ? 'Fourball Match Play' : 'Singles Match Play'}</div>
              <div>{matchup.teeTime ? formatTime(matchup.teeTime) : 'Tee time TBD'}</div>
              <div>{trip ? `${trip.year} ${trip.name}` : 'Mayday'}</div>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-center text-xs">
              <tbody>
                <ScorecardRow label="Hole" values={holeNumbers()} totals={['OUT', 'IN', 'TOT']} strong />
                <ScorecardRow label="Yards" values={holeValues(round.yardages, '-')} />
                <ScorecardRow label="Par" values={holeValues(round.pars, '-')} strong />
                <ScorecardRow label="HCP" values={holeValues(round.strokeIndexes, '-')} />
                {lines.map((line) => (
                  <tr key={line.key} className="border-t border-slate-300">
                    <th className="w-36 border border-slate-300 bg-slate-100 px-2 py-2 text-left">
                      <div className={line.team === 'A' ? 'text-blue-700' : 'text-red-700'}>{line.player.name}</div>
                      <div className="text-[10px] font-normal text-slate-500">HCP {line.player.handicap} · gets {line.strokes}</div>
                    </th>
                    {Array.from({ length: 18 }, (_, i) => i + 1).map((hole) => {
                      const dots = result.strokeHoles[hole]?.[line.key] ?? 0;
                      return (
                        <td key={hole} className="h-10 border border-slate-300 bg-white px-1">
                          {dots > 0 && <span className="text-[10px] font-black" style={{ color: brandColor }}>{'●'.repeat(dots)}</span>}
                        </td>
                      );
                    })}
                    <td className="border border-slate-300 bg-slate-50 px-1 font-bold"></td>
                    <td className="border border-slate-300 bg-slate-50 px-1 font-bold"></td>
                    <td className="border border-slate-300 bg-slate-100 px-1 font-bold"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-3 text-xs text-slate-600 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-300 p-3">
              <div className="font-black text-slate-900">Stroke Dots</div>
              <p>Dots mark holes where that player receives handicap strokes.</p>
            </div>
            <div className="rounded-lg border border-slate-300 p-3">
              <div className="font-black text-slate-900">Format</div>
              <p>{matchup.format === 'fourball' ? 'Each player plays their ball. Low net team score wins the hole.' : 'Gross score minus strokes. Low net wins the hole.'}</p>
            </div>
            <div className="rounded-lg border border-slate-300 p-3">
              <div className="font-black text-slate-900">Mayday Rule</div>
              <p>Write legibly. The app accepts scores, but the paper card accepts blame.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function ScorecardRow({
  label,
  values,
  totals,
  strong = false,
}: {
  label: string;
  values: Array<string | number>;
  totals?: [string, string, string];
  strong?: boolean;
}) {
  return (
    <tr className={strong ? 'font-black' : ''}>
      <th className="w-36 border border-slate-300 bg-slate-100 px-2 py-1 text-left">{label}</th>
      {values.slice(0, 9).map((value, index) => <td key={index} className="border border-slate-300 px-1 py-1">{value}</td>)}
      <td className="border border-slate-300 bg-slate-100 px-1 py-1">{totals?.[0] ?? sum(values.slice(0, 9))}</td>
      {values.slice(9, 18).map((value, index) => <td key={index + 9} className="border border-slate-300 px-1 py-1">{value}</td>)}
      <td className="border border-slate-300 bg-slate-100 px-1 py-1">{totals?.[1] ?? sum(values.slice(9, 18))}</td>
      <td className="border border-slate-300 bg-slate-200 px-1 py-1">{totals?.[2] ?? sum(values.slice(0, 18))}</td>
    </tr>
  );
}

function holeNumbers() {
  return Array.from({ length: 18 }, (_, i) => i + 1);
}

function holeValues(values: number[] | undefined, fallback: string) {
  return Array.from({ length: 18 }, (_, i) => values?.[i] ?? fallback);
}

function sum(values: Array<string | number>) {
  const nums = values.filter((value): value is number => typeof value === 'number');
  return nums.length === values.length ? nums.reduce((total, value) => total + value, 0) : '';
}

function formatTime(time: string): string {
  const [hoursRaw, minutes] = time.split(':').map(Number);
  if (!Number.isFinite(hoursRaw) || !Number.isFinite(minutes)) return time;
  const suffix = hoursRaw >= 12 ? 'PM' : 'AM';
  const hours = hoursRaw % 12 || 12;
  return `${hours}:${String(minutes).padStart(2, '0')} ${suffix}`;
}
