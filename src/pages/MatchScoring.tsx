import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import type { Matchup, Player, Round, AppConfig, Trip, ManualPlayerTotals } from '../types';
import {
  subscribeMatchup, subscribeConfig, subscribeRounds, subscribePlayers, subscribeTrips,
  updateHoleScore, setMatchupStatus, saveHoleWager, saveMatchWager, saveManualResult, type ScoreField,
} from '../lib/db';
import type { WagerType, HoleWager, Wager } from '../types';
import { calcMatchResult } from '../lib/scoring';
import { getHoleComment } from '../lib/holeComments';

type LocalScores = Record<number, { a: string; a2: string; b: string; b2: string }>;
type WagerTarget = { scope: 'match' } | { scope: 'hole'; hole: number };
type ManualTotalField = keyof ManualPlayerTotals;
type ManualTotalState = Record<ManualTotalField, string>;

const EMPTY_MANUAL_TOTALS: ManualTotalState = {
  playerA: '',
  playerA2: '',
  playerB: '',
  playerB2: '',
};

export default function MatchScoring() {
  const { matchupId } = useParams<{ matchupId: string }>();
  const [matchup, setMatchup] = useState<Matchup | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [localScores, setLocalScores] = useState<LocalScores>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [wagerTarget, setWagerTarget] = useState<WagerTarget | null>(null);
  const [wagerType, setWagerType] = useState<WagerType | null>(null);
  const [wagerAmount, setWagerAmount] = useState('');
  const [manualTeamAScore, setManualTeamAScore] = useState('');
  const [manualTeamBScore, setManualTeamBScore] = useState('');
  const [manualPlayerTotals, setManualPlayerTotals] = useState<ManualTotalState>(EMPTY_MANUAL_TOTALS);
  const [manualPoints, setManualPoints] = useState<'A' | 'B' | 'half'>('half');
  const saveTimer = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const lastReportedHoleRef = useRef(-1);
  const initializedRef = useRef(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Sync remote scores into local state for holes not yet edited
  useEffect(() => {
    if (!matchup) return;
    setLocalScores((prev) => {
      const next = { ...prev };
      for (let h = 1; h <= 18; h++) {
        if (next[h] !== undefined) continue;
        const s = matchup.scores[h];
        next[h] = {
          a: s?.playerA != null ? String(s.playerA) : '',
          a2: s?.playerA2 != null ? String(s.playerA2) : '',
          b: s?.playerB != null ? String(s.playerB) : '',
          b2: s?.playerB2 != null ? String(s.playerB2) : '',
        };
      }
      return next;
    });
  }, [matchup]);

  // Detect newly completed holes and fire a comment toast
  useEffect(() => {
    if (!matchup || players.length === 0 || rounds.length === 0 || !config) return;
    const pA = players.find((p) => p.id === matchup.playerAId);
    const pB = players.find((p) => p.id === matchup.playerBId);
    const pA2 = matchup.playerA2Id ? players.find((p) => p.id === matchup.playerA2Id) : undefined;
    const pB2 = matchup.playerB2Id ? players.find((p) => p.id === matchup.playerB2Id) : undefined;
    const round = rounds.find((r) => r.id === matchup.roundId);
    if (!pA || !pB || !round) return;

    const res = calcMatchResult(matchup, pA, pB, round.strokeIndexes, pA2, pB2);

    let lastComplete = 0;
    let lastWinner: 'A' | 'B' | null = null;

    for (let h = 1; h <= 18; h++) {
      const s = matchup.scores[h];
      const sh = res.strokeHoles[h];
      if (!sh) continue;

      if (matchup.format === 'singles') {
        if (s?.playerA == null || s?.playerB == null) continue;
        const aNet = s.playerA - sh.a1;
        const bNet = s.playerB - sh.b1;
        lastComplete = h;
        lastWinner = aNet < bNet ? 'A' : bNet < aNet ? 'B' : null;
      } else {
        const aNets = [
          s?.playerA != null ? s.playerA - sh.a1 : null,
          s?.playerA2 != null ? s.playerA2 - sh.a2 : null,
        ].filter((v): v is number => v != null);
        const bNets = [
          s?.playerB != null ? s.playerB - sh.b1 : null,
          s?.playerB2 != null ? s.playerB2 - sh.b2 : null,
        ].filter((v): v is number => v != null);
        if (aNets.length === 0 || bNets.length === 0) continue;
        const bestA = Math.min(...aNets);
        const bestB = Math.min(...bNets);
        lastComplete = h;
        lastWinner = bestA < bestB ? 'A' : bestB < bestA ? 'B' : null;
      }
    }

    if (!initializedRef.current) {
      lastReportedHoleRef.current = lastComplete;
      initializedRef.current = true;
      return;
    }

    if (lastComplete > lastReportedHoleRef.current) {
      lastReportedHoleRef.current = lastComplete;
      const nameA = matchup.format === 'singles' ? pA.name.split(' ')[0] : config.teamAName;
      const nameB = matchup.format === 'singles' ? pB.name.split(' ')[0] : config.teamBName;
      setToast(getHoleComment(lastWinner, nameA, nameB));
    }
  }, [matchup, players, rounds, config]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
    return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
  }, [toast]);

  useEffect(() => {
    if (!matchup?.manualResult) return;
    const totals = matchup.manualResult.playerTotals;
    setManualTeamAScore(matchup.manualResult.teamAScore != null ? String(matchup.manualResult.teamAScore) : '');
    setManualTeamBScore(matchup.manualResult.teamBScore != null ? String(matchup.manualResult.teamBScore) : '');
    setManualPlayerTotals({
      playerA: totals?.playerA != null ? String(totals.playerA) : '',
      playerA2: totals?.playerA2 != null ? String(totals.playerA2) : '',
      playerB: totals?.playerB != null ? String(totals.playerB) : '',
      playerB2: totals?.playerB2 != null ? String(totals.playerB2) : '',
    });
    if (matchup.manualResult.pointsA === 1) setManualPoints('A');
    else if (matchup.manualResult.pointsB === 1) setManualPoints('B');
    else setManualPoints('half');
  }, [matchup?.manualResult]);

  if (!matchupId || !matchup || !config || players.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>
      </Layout>
    );
  }

  const playerA = players.find((p) => p.id === matchup.playerAId);
  const playerB = players.find((p) => p.id === matchup.playerBId);
  const playerA2 = matchup.playerA2Id ? players.find((p) => p.id === matchup.playerA2Id) : undefined;
  const playerB2 = matchup.playerB2Id ? players.find((p) => p.id === matchup.playerB2Id) : undefined;
  const round = rounds.find((r) => r.id === matchup.roundId);

  if (!playerA || !playerB || !round) {
    return (
      <Layout>
        <div className="text-center py-20 text-slate-400">Match data not found.</div>
      </Layout>
    );
  }

  const isFourball = matchup.format === 'fourball';
  const result = calcMatchResult(matchup, playerA, playerB, round.strokeIndexes, playerA2, playerB2);
  const trip = trips.find((t) => t.id === round.tripId);
  const teamAName = trip?.teamAName || config.teamAName;
  const teamBName = trip?.teamBName || config.teamBName;

  const WAGER_LABELS: Record<WagerType, string> = {
    money: 'Money',
    drinks: 'Drinks',
    bragging_rights: 'Bragging Rights',
    custom: 'Custom',
  };

  function handleScoreChange(
    hole: number,
    key: 'a' | 'a2' | 'b' | 'b2',
    raw: string
  ) {
    const val = raw.replace(/[^0-9]/g, '').slice(0, 2);
    setLocalScores((prev) => ({
      ...prev,
      [hole]: { ...(prev[hole] ?? { a: '', a2: '', b: '', b2: '' }), [key]: val },
    }));

    const timerKey = `${hole}-${key}`;
    if (saveTimer.current[timerKey]) clearTimeout(saveTimer.current[timerKey]);
    saveTimer.current[timerKey] = setTimeout(async () => {
      const fieldMap: Record<'a' | 'a2' | 'b' | 'b2', ScoreField> = {
        a: 'playerA', a2: 'playerA2', b: 'playerB', b2: 'playerB2',
      };
      const num = val !== '' ? parseInt(val, 10) : null;
      setSaving(true);
      await updateHoleScore(matchupId!, hole, { [fieldMap[key]]: num });
      if (matchup!.status === 'pending') await setMatchupStatus(matchupId!, 'active');
      setSaving(false);
    }, 800);
  }

  async function handleFinalize() {
    if (!confirm('Mark this match as complete?')) return;
    await setMatchupStatus(matchupId!, 'complete');
  }

  async function handleReopen() {
    await setMatchupStatus(matchupId!, 'active');
  }

  async function handleSaveManualResult(e: React.FormEvent) {
    e.preventDefault();
    const pointsA = manualPoints === 'A' ? 1 : manualPoints === 'half' ? 0.5 : 0;
    const pointsB = manualPoints === 'B' ? 1 : manualPoints === 'half' ? 0.5 : 0;
    const playerTotals: ManualPlayerTotals = {};
    (Object.keys(manualPlayerTotals) as ManualTotalField[]).forEach((field) => {
      if (manualPlayerTotals[field] !== '') playerTotals[field] = Number(manualPlayerTotals[field]);
    });
    setSaving(true);
    await saveManualResult(matchupId!, {
      teamAScore: manualTeamAScore ? Number(manualTeamAScore) : undefined,
      teamBScore: manualTeamBScore ? Number(manualTeamBScore) : undefined,
      playerTotals: Object.keys(playerTotals).length > 0 ? playerTotals : undefined,
      pointsA,
      pointsB,
      createdAt: Date.now(),
    });
    setSaving(false);
  }

  function openWager(target: WagerTarget) {
    setWagerTarget(target);
    setWagerType(null);
    setWagerAmount('');
  }

  function closeWager() {
    setWagerTarget(null);
    setWagerType(null);
    setWagerAmount('');
  }

  async function handlePlaceWager() {
    if (!wagerTarget || !wagerType || !wagerAmount.trim()) return;
    const wager: Wager = { type: wagerType, amount: wagerAmount.trim(), createdAt: Date.now() };
    if (wagerTarget.scope === 'match') {
      await saveMatchWager(matchupId!, wager);
    } else {
      await saveHoleWager(matchupId!, wagerTarget.hole, wager);
    }
    closeWager();
  }

  function statusBadgeClass() {
    if (result.holesPlayed === 0) return 'bg-slate-700 text-slate-300';
    if (result.isComplete && result.winner === null) return 'bg-yellow-900 text-yellow-300';
    if (result.winner === 'A' || (!result.isComplete && result.teamAHolesUp > 0)) return 'bg-blue-900 text-blue-300';
    if (result.winner === 'B' || (!result.isComplete && result.teamAHolesUp < 0)) return 'bg-red-900 text-red-300';
    return 'bg-slate-700 text-slate-300';
  }

  function statusLabel() {
    if (result.holesPlayed === 0) return 'Not started';
    const lA = playerA!.name.split(' ')[0];
    const lB = playerB!.name.split(' ')[0];
    if (result.isComplete) {
      if (result.winner === 'A') return `${lA} wins ${result.status}`;
      if (result.winner === 'B') return `${lB} wins ${result.status}`;
      return 'Halved';
    }
    if (result.teamAHolesUp > 0) return `${lA} ${result.status}`;
    if (result.teamAHolesUp < 0) return `${lB} ${result.status}`;
    return 'All Square';
  }

  const short = (p: Player) => p.name.split(' ')[0];
  const cleanManualNumber = (raw: string) => raw.replace(/[^0-9]/g, '').slice(0, 3);
  const manualTotalEntries = [
    { field: 'playerA' as const, player: playerA, strokes: result.strokes.a1, color: 'text-blue-400' },
    { field: 'playerA2' as const, player: playerA2, strokes: result.strokes.a2, color: 'text-blue-300' },
    { field: 'playerB' as const, player: playerB, strokes: result.strokes.b1, color: 'text-red-400' },
    { field: 'playerB2' as const, player: playerB2, strokes: result.strokes.b2, color: 'text-red-300' },
  ].filter((entry) => entry.player);

  function handleManualPlayerTotal(field: ManualTotalField, raw: string) {
    setManualPlayerTotals((prev) => ({ ...prev, [field]: cleanManualNumber(raw) }));
  }

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${
              isFourball ? 'bg-purple-900 text-purple-300' : 'bg-slate-700 text-slate-300'
            }`}>
              {isFourball ? 'Fourball' : 'Singles'}
            </span>
            <span className="text-slate-400 text-xs">Round {round.number} · {round.courseName}</span>
          </div>

          <div className="flex items-start gap-3 mb-3">
            <div className="flex-1">
              <div className="text-blue-400 font-bold">
                {playerA.name}{playerA2 ? ` & ${playerA2.name}` : ''}
              </div>
              <div className="text-slate-400 text-xs">
                {teamAName} · HCP {playerA.handicap}{playerA2 ? `/${playerA2.handicap}` : ''}
              </div>
            </div>
            <div className="text-slate-500 font-bold py-1">vs</div>
            <div className="flex-1 text-right">
              <div className="text-red-400 font-bold">
                {playerB.name}{playerB2 ? ` & ${playerB2.name}` : ''}
              </div>
              <div className="text-slate-400 text-xs">
                {teamBName} · HCP {playerB.handicap}{playerB2 ? `/${playerB2.handicap}` : ''}
              </div>
            </div>
          </div>

          {/* Stroke allocation */}
          {isFourball ? (
            <div className="grid grid-cols-2 gap-1 text-xs text-center mb-3">
              {[
                { p: playerA, s: result.strokes.a1, color: 'text-blue-400' },
                { p: playerA2, s: result.strokes.a2, color: 'text-blue-300' },
                { p: playerB, s: result.strokes.b1, color: 'text-red-400' },
                { p: playerB2, s: result.strokes.b2, color: 'text-red-300' },
              ].filter(r => r.p).map((r, i) => (
                <div key={i} className={r.color}>
                  {r.p!.name.split(' ')[0]}:{' '}
                  {r.s > 0 ? `+${r.s} strokes` : 'scratch anchor'}
                </div>
              ))}
            </div>
          ) : (result.strokes.a1 > 0 || result.strokes.b1 > 0) && (
            <div className="text-center text-xs text-slate-400 mb-3">
              {result.strokes.a1 > 0
                ? `${short(playerA)} receives ${result.strokes.a1} stroke${result.strokes.a1 > 1 ? 's' : ''}`
                : `${short(playerB)} receives ${result.strokes.b1} stroke${result.strokes.b1 > 1 ? 's' : ''}`}
            </div>
          )}

          {/* Live status */}
          <div className={`rounded-lg px-4 py-3 text-center font-bold ${statusBadgeClass()}`}>
            {statusLabel()}
            {!result.isComplete && result.holesPlayed > 0 && (
              <span className="font-normal text-sm ml-2 opacity-70">thru {result.holesPlayed}</span>
            )}
            {saving && <span className="ml-2 text-xs font-normal opacity-60">saving…</span>}
          </div>

          {matchup.manualResult && (
            <div className="mt-2 rounded-lg border border-yellow-800 bg-yellow-950/60 px-3 py-2 text-sm text-yellow-200">
              Manual result is active
              {(matchup.manualResult.teamAScore || matchup.manualResult.teamBScore) && (
                <span>
                  : {matchup.manualResult.teamAScore ?? '-'} - {matchup.manualResult.teamBScore ?? '-'}
                </span>
              )}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-widest text-slate-500">Match Wager</div>
              <div className="text-sm text-yellow-300 truncate">
                {matchup.matchWager ? wagerLabel(matchup.matchWager) : 'No overall wager yet'}
              </div>
            </div>
            <button className="btn-secondary text-sm shrink-0" onClick={() => openWager({ scope: 'match' })}>
              {matchup.matchWager ? 'Edit' : 'Add'}
            </button>
          </div>
        </div>

        {/* Scoring grid */}
        <div className="card overflow-x-auto">
          {isFourball ? (
            <FourballGrid
              matchup={matchup}
              playerA={playerA} playerA2={playerA2}
              playerB={playerB} playerB2={playerB2}
              result={result}
              localScores={localScores}
              onChange={handleScoreChange}
              onWagerClick={(hole) => openWager({ scope: 'hole', hole })}
            />
          ) : (
            <SinglesGrid
              matchup={matchup}
              playerA={playerA} playerB={playerB}
              result={result}
              localScores={localScores}
              onChange={handleScoreChange}
              onWagerClick={(hole) => openWager({ scope: 'hole', hole })}
            />
          )}
        </div>

        {/* Manual result fallback */}
        <div className="card">
          <h3 className="font-semibold mb-2">Manual Result</h3>
          <p className="text-slate-500 text-xs mb-3">
            Use this when the match was not tracked hole by hole. This overrides the hole-by-hole result for standings and records gross totals for the individual net champion.
          </p>
          <form onSubmit={handleSaveManualResult} className="space-y-4">
            <div>
              <div className="label">Individual Gross Totals</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {manualTotalEntries.map(({ field, player, strokes, color }) => {
                  const gross = manualPlayerTotals[field] === '' ? null : Number(manualPlayerTotals[field]);
                  const net = gross == null ? null : gross - strokes;
                  return (
                    <div key={field} className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
                      <label className={`block text-sm font-semibold mb-2 ${color}`}>
                        {player!.name}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          className="input flex-1"
                          type="number"
                          min="0"
                          inputMode="numeric"
                          placeholder="gross"
                          value={manualPlayerTotals[field]}
                          onChange={(e) => handleManualPlayerTotal(field, e.target.value)}
                        />
                        <div className="w-24 text-right text-xs text-slate-400">
                          <div>{strokes > 0 ? `${strokes} strokes` : '0 strokes'}</div>
                          <div className="font-semibold text-slate-200">
                            Net {net == null ? '-' : net}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-blue-400">{teamAName} Total</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="optional"
                  value={manualTeamAScore}
                  onChange={(e) => setManualTeamAScore(cleanManualNumber(e.target.value))}
                />
              </div>
              <div>
                <label className="label text-red-400">{teamBName} Total</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="optional"
                  value={manualTeamBScore}
                  onChange={(e) => setManualTeamBScore(cleanManualNumber(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label className="label">Match Points</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'A' as const, label: `${teamAName} 1` },
                  { id: 'half' as const, label: 'Half .5 / .5' },
                  { id: 'B' as const, label: `${teamBName} 1` },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`rounded-lg border px-2 py-2 text-sm font-semibold ${
                      manualPoints === option.id
                        ? 'border-emerald-500 bg-emerald-700 text-white'
                        : 'border-slate-600 bg-slate-700 text-slate-300'
                    }`}
                    onClick={() => setManualPoints(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn-primary w-full" disabled={saving}>
              Save Manual Result
            </button>
          </form>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          {matchup.status !== 'complete' ? (
            <button
              className="btn-primary flex-1"
              onClick={handleFinalize}
              disabled={result.holesPlayed === 0}
            >
              Finalize Match
            </button>
          ) : (
            <button className="btn-secondary flex-1" onClick={handleReopen}>
              Reopen Match
            </button>
          )}
          <Link to="/scores" className="btn-secondary px-6">Back</Link>
        </div>
      </div>

      {/* Wager modal */}
      {wagerTarget !== null && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-end justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-5 space-y-4">
            <div className="text-center">
              <div className="text-2xl mb-1">🎲</div>
              <h3 className="font-bold text-white text-lg">
                {wagerTarget.scope === 'match' ? 'Match Wager' : `Hole ${wagerTarget.hole} Wager`}
              </h3>
              <p className="text-slate-400 text-sm">What are we betting?</p>
            </div>

            {!wagerType ? (
              <div className="grid grid-cols-2 gap-2">
                {([
                  { type: 'money' as WagerType, label: 'Money', cls: 'border-emerald-700 hover:bg-emerald-900' },
                  { type: 'drinks' as WagerType, label: 'Drinks', cls: 'border-amber-700 hover:bg-amber-900' },
                  { type: 'bragging_rights' as WagerType, label: 'Bragging Rights', cls: 'border-blue-700 hover:bg-blue-900' },
                  { type: 'custom' as WagerType, label: 'Custom', cls: 'border-purple-700 hover:bg-purple-900' },
                ] as const).map(({ type, label, cls }) => (
                  <button
                    key={type}
                    className={`border-2 rounded-xl py-3 px-2 text-white text-sm font-medium transition-colors ${cls}`}
                    onClick={() => { setWagerType(type); setWagerAmount(''); }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-center text-sm text-slate-400">
                  Betting: <span className="text-white font-medium">{WAGER_LABELS[wagerType]}</span>
                  <button className="ml-2 text-xs text-slate-500 underline" onClick={() => setWagerType(null)}>change</button>
                </div>
                {wagerType === 'money' ? (
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-lg">$</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      className="input flex-1 text-center text-lg font-bold"
                      placeholder="0"
                      min="1"
                      step="1"
                      value={wagerAmount}
                      onChange={(e) => setWagerAmount(e.target.value.replace(/[^0-9]/g, ''))}
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    className="input w-full"
                    placeholder={`What's at stake?`}
                    value={wagerAmount}
                    onChange={(e) => setWagerAmount(e.target.value)}
                    autoFocus
                  />
                )}
                <button
                  className="btn-primary w-full"
                  disabled={!wagerAmount.trim()}
                  onClick={handlePlaceWager}
                >
                  Lock It In 🔒
                </button>
              </div>
            )}

            <button
              className="w-full text-slate-500 text-sm py-1"
              onClick={closeWager}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Hole result commentary toast */}
      {toast && (
        <div
          className="fixed bottom-4 left-3 right-3 z-50 cursor-pointer"
          onClick={() => setToast(null)}
        >
          <div className="bg-slate-900 border-2 border-orange-500 rounded-xl p-4 shadow-2xl">
            <div className="text-center text-orange-400 text-xs font-bold uppercase tracking-widest mb-2">
              📢 Hole Report
            </div>
            <p className="text-center text-white text-sm leading-snug">{toast}</p>
            <p className="text-center text-slate-500 text-xs mt-2">tap to dismiss</p>
          </div>
        </div>
      )}
    </Layout>
  );
}

// ── Wager chip ───────────────────────────────────────────────────────────────

const WAGER_LABEL_SHORT: Record<WagerType, string> = {
  money: '$',
  drinks: 'Drinks',
  bragging_rights: 'Pride',
  custom: 'Bet',
};

function wagerLabel(wager: Wager): string {
  return `${WAGER_LABEL_SHORT[wager.type]} ${wager.amount}`;
}

function WagerChip({ wager, onClick }: { wager?: HoleWager; onClick: () => void }) {
  if (wager) {
    return (
      <span className="text-xs text-yellow-300 font-medium">
        {wagerLabel(wager)}
      </span>
    );
  }
  return (
    <button
      className="text-xs text-slate-600 hover:text-yellow-400 transition-colors px-1"
      onClick={onClick}
      title="Place wager on this hole"
    >
      🎲
    </button>
  );
}

// ── Singles grid ─────────────────────────────────────────────────────────────

interface SinglesGridProps {
  matchup: Matchup;
  playerA: Player;
  playerB: Player;
  result: ReturnType<typeof calcMatchResult>;
  localScores: LocalScores;
  onChange: (hole: number, key: 'a' | 'b', val: string) => void;
  onWagerClick: (hole: number) => void;
}

function SinglesGrid({ matchup, playerA, playerB, result, localScores, onChange, onWagerClick }: SinglesGridProps) {
  const locked = matchup.status === 'complete';
  const wagers = matchup.wagers ?? {};
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-slate-400 text-xs">
          <th className="text-left py-1 pr-1 w-8">#</th>
          <th className="text-center py-1 w-8">SI</th>
          <th className="text-center py-1 text-blue-400">{playerA.name.split(' ')[0]}</th>
          <th className="text-center py-1 text-red-400">{playerB.name.split(' ')[0]}</th>
          <th className="text-center py-1 w-8"></th>
          <th className="text-center py-1 w-10"></th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 18 }, (_, i) => i + 1).map((hole) => {
          const si = result.strokeHoles[hole];
          const aScore = matchup.scores[hole]?.playerA;
          const bScore = matchup.scores[hole]?.playerB;
          const aNet = aScore != null ? aScore - si.a1 : null;
          const bNet = bScore != null ? bScore - si.b1 : null;

          let bg = '';
          if (aNet != null && bNet != null) {
            bg = aNet < bNet ? 'bg-blue-950' : bNet < aNet ? 'bg-red-950' : 'bg-slate-700';
          }

          return (
            <tr key={hole} className={`border-t border-slate-700 ${bg}`}>
              <td className="py-1.5 pr-1 font-mono text-slate-400 text-xs">{hole}</td>
              <td className="text-center text-xs text-slate-500">
                {si.a1 > 0
                  ? <><span>{hole}</span><span className="text-blue-400">{'·'.repeat(si.a1)}</span></>
                  : si.b1 > 0
                  ? <><span>{hole}</span><span className="text-red-400">{'·'.repeat(si.b1)}</span></>
                  : hole}
              </td>
              <td className="text-center py-1">
                <input type="number" inputMode="numeric" className="score-input"
                  value={localScores[hole]?.a ?? ''}
                  onChange={(e) => onChange(hole, 'a', e.target.value)}
                  min={1} max={15} placeholder="—" disabled={locked} />
              </td>
              <td className="text-center py-1">
                <input type="number" inputMode="numeric" className="score-input"
                  value={localScores[hole]?.b ?? ''}
                  onChange={(e) => onChange(hole, 'b', e.target.value)}
                  min={1} max={15} placeholder="—" disabled={locked} />
              </td>
              <td className="text-center text-xs font-bold">
                {aNet != null && bNet != null ? (
                  aNet < bNet ? <span className="text-blue-400">A</span>
                  : bNet < aNet ? <span className="text-red-400">B</span>
                  : <span className="text-slate-400">½</span>
                ) : null}
              </td>
              <td className="text-center py-1">
                <WagerChip wager={wagers[hole]} onClick={() => onWagerClick(hole)} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Fourball grid ─────────────────────────────────────────────────────────────

interface FourballGridProps {
  matchup: Matchup;
  playerA: Player;
  playerA2?: Player;
  playerB: Player;
  playerB2?: Player;
  result: ReturnType<typeof calcMatchResult>;
  localScores: LocalScores;
  onChange: (hole: number, key: 'a' | 'a2' | 'b' | 'b2', val: string) => void;
  onWagerClick: (hole: number) => void;
}

function FourballGrid({ matchup, playerA, playerA2, playerB, playerB2, result, localScores, onChange, onWagerClick }: FourballGridProps) {
  const locked = matchup.status === 'complete';
  const short = (p?: Player) => p?.name.split(' ')[0] ?? '—';
  const wagers = matchup.wagers ?? {};

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-slate-400">
          <th className="text-left py-1 pr-1 w-6">#</th>
          <th className="text-center py-1 w-6">SI</th>
          <th className="text-center py-1 text-blue-400">{short(playerA)}</th>
          <th className="text-center py-1 text-blue-300">{short(playerA2)}</th>
          <th className="text-center py-1 text-red-400">{short(playerB)}</th>
          <th className="text-center py-1 text-red-300">{short(playerB2)}</th>
          <th className="text-center py-1 w-6"></th>
          <th className="text-center py-1 w-8"></th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 18 }, (_, i) => i + 1).map((hole) => {
          const sh = result.strokeHoles[hole];
          const s = matchup.scores[hole];
          const aNet = s?.playerA != null ? s.playerA - sh.a1 : null;
          const a2Net = s?.playerA2 != null ? s.playerA2 - sh.a2 : null;
          const bNet = s?.playerB != null ? s.playerB - sh.b1 : null;
          const b2Net = s?.playerB2 != null ? s.playerB2 - sh.b2 : null;

          const teamANet = [aNet, a2Net].filter((v): v is number => v != null);
          const teamBNet = [bNet, b2Net].filter((v): v is number => v != null);
          const bestA = teamANet.length ? Math.min(...teamANet) : null;
          const bestB = teamBNet.length ? Math.min(...teamBNet) : null;

          let bg = '';
          if (bestA != null && bestB != null) {
            bg = bestA < bestB ? 'bg-blue-950' : bestB < bestA ? 'bg-red-950' : 'bg-slate-700';
          }

          function netClass(net: number | null, best: number | null) {
            if (net == null || best == null) return '';
            return net === best ? 'font-bold' : 'opacity-40';
          }

          return (
            <tr key={hole} className={`border-t border-slate-700 ${bg}`}>
              <td className="py-1 pr-1 font-mono text-slate-500">{hole}</td>
              <td className="text-center text-slate-500">
                {hole}
                {sh.a1 > 0 && <span className="text-blue-400">·</span>}
                {sh.a2 > 0 && <span className="text-blue-300">·</span>}
                {sh.b1 > 0 && <span className="text-red-400">·</span>}
                {sh.b2 > 0 && <span className="text-red-300">·</span>}
              </td>
              {/* A1 */}
              <td className={`text-center py-1 ${netClass(aNet, bestA)}`}>
                <input type="number" inputMode="numeric"
                  className="w-10 h-10 text-center text-sm font-bold bg-slate-700 border-2 border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  value={localScores[hole]?.a ?? ''}
                  onChange={(e) => onChange(hole, 'a', e.target.value)}
                  min={1} max={15} placeholder="—" disabled={locked} />
              </td>
              {/* A2 */}
              <td className={`text-center py-1 ${netClass(a2Net, bestA)}`}>
                <input type="number" inputMode="numeric"
                  className="w-10 h-10 text-center text-sm font-bold bg-slate-700 border-2 border-slate-600 rounded-lg focus:outline-none focus:border-blue-400 text-white"
                  value={localScores[hole]?.a2 ?? ''}
                  onChange={(e) => onChange(hole, 'a2', e.target.value)}
                  min={1} max={15} placeholder="—" disabled={locked} />
              </td>
              {/* B1 */}
              <td className={`text-center py-1 ${netClass(bNet, bestB)}`}>
                <input type="number" inputMode="numeric"
                  className="w-10 h-10 text-center text-sm font-bold bg-slate-700 border-2 border-slate-600 rounded-lg focus:outline-none focus:border-red-500 text-white"
                  value={localScores[hole]?.b ?? ''}
                  onChange={(e) => onChange(hole, 'b', e.target.value)}
                  min={1} max={15} placeholder="—" disabled={locked} />
              </td>
              {/* B2 */}
              <td className={`text-center py-1 ${netClass(b2Net, bestB)}`}>
                <input type="number" inputMode="numeric"
                  className="w-10 h-10 text-center text-sm font-bold bg-slate-700 border-2 border-slate-600 rounded-lg focus:outline-none focus:border-red-400 text-white"
                  value={localScores[hole]?.b2 ?? ''}
                  onChange={(e) => onChange(hole, 'b2', e.target.value)}
                  min={1} max={15} placeholder="—" disabled={locked} />
              </td>
              <td className="text-center font-bold">
                {bestA != null && bestB != null ? (
                  bestA < bestB ? <span className="text-blue-400">A</span>
                  : bestB < bestA ? <span className="text-red-400">B</span>
                  : <span className="text-slate-400">½</span>
                ) : null}
              </td>
              <td className="text-center py-1">
                <WagerChip wager={wagers[hole]} onClick={() => onWagerClick(hole)} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
