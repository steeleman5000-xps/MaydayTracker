import { useState } from 'react';
import type { Player, Round, Matchup, AppConfig, MatchFormat } from '../types';
import { addMatchup, deleteMatchup } from '../lib/db';
import { calcMatchResult } from '../lib/scoring';

interface Props {
  rounds: Round[];
  players: Player[];
  matchups: Matchup[];
  config: AppConfig;
}

const FORMAT_LABELS: Record<MatchFormat, string> = {
  singles: 'Singles (1v1)',
  fourball: 'Fourball (2v2 best ball)',
};

export default function AdminMatchups({ rounds, players, matchups, config }: Props) {
  const [selectedRoundId, setSelectedRoundId] = useState('');
  const [format, setFormat] = useState<MatchFormat>('singles');
  const [playerAId, setPlayerAId] = useState('');
  const [playerA2Id, setPlayerA2Id] = useState('');
  const [playerBId, setPlayerBId] = useState('');
  const [playerB2Id, setPlayerB2Id] = useState('');
  const [saving, setSaving] = useState(false);

  const playersA = players.filter((p) => p.teamId === 'A');
  const playersB = players.filter((p) => p.teamId === 'B');
  const roundMatchups = matchups.filter((m) => m.roundId === selectedRoundId);

  const usedPlayerIds = new Set([
    ...roundMatchups.map((m) => m.playerAId),
    ...roundMatchups.map((m) => m.playerBId),
    ...roundMatchups.flatMap((m) => [m.playerA2Id, m.playerB2Id].filter(Boolean) as string[]),
  ]);

  const availableA = playersA.filter((p) => !usedPlayerIds.has(p.id));
  const availableB = playersB.filter((p) => !usedPlayerIds.has(p.id));

  // For the second player dropdowns, also exclude the first selection
  const availableA2 = availableA.filter((p) => p.id !== playerAId);
  const availableB2 = availableB.filter((p) => p.id !== playerBId);

  function resetForm() {
    setPlayerAId('');
    setPlayerA2Id('');
    setPlayerBId('');
    setPlayerB2Id('');
  }

  const canAdd =
    selectedRoundId &&
    playerAId &&
    playerBId &&
    (format === 'singles' || (playerA2Id && playerB2Id));

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!canAdd) return;
    setSaving(true);
    await addMatchup({
      roundId: selectedRoundId,
      format,
      playerAId,
      playerBId,
      ...(format === 'fourball' ? { playerA2Id, playerB2Id } : {}),
      scores: {},
      wagers: {},
      status: 'pending',
      createdAt: Date.now(),
    });
    resetForm();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this matchup? Scores will be lost.')) return;
    await deleteMatchup(id);
  }

  function getPlayer(id?: string) {
    return id ? players.find((p) => p.id === id) : undefined;
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="font-semibold mb-3">Add Matchup</h3>

        <div className="mb-3">
          <label className="label">Round</label>
          <select
            className="input"
            value={selectedRoundId}
            onChange={(e) => { setSelectedRoundId(e.target.value); resetForm(); }}
          >
            <option value="">— select round —</option>
            {rounds.map((r) => (
              <option key={r.id} value={r.id}>Round {r.number} – {r.courseName}</option>
            ))}
          </select>
        </div>

        {selectedRoundId && (
          <form onSubmit={handleAdd} className="space-y-4">
            {/* Format selector */}
            <div>
              <label className="label">Format</label>
              <div className="flex gap-2">
                {(['singles', 'fourball'] as MatchFormat[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => { setFormat(f); resetForm(); }}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                      format === f
                        ? 'bg-emerald-700 border-emerald-600 text-white'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:text-white'
                    }`}
                  >
                    {FORMAT_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>

            {/* Player selection */}
            <div className="grid grid-cols-2 gap-3">
              {/* Team A */}
              <div className="space-y-2">
                <label className="label text-blue-400">{config.teamAName}</label>
                <select
                  className="input border-blue-900"
                  value={playerAId}
                  onChange={(e) => setPlayerAId(e.target.value)}
                >
                  <option value="">— player 1 —</option>
                  {availableA.filter(p => p.id !== playerA2Id).map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.handicap})</option>
                  ))}
                </select>
                {format === 'fourball' && (
                  <select
                    className="input border-blue-900"
                    value={playerA2Id}
                    onChange={(e) => setPlayerA2Id(e.target.value)}
                  >
                    <option value="">— player 2 —</option>
                    {availableA2.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.handicap})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Team B */}
              <div className="space-y-2">
                <label className="label text-red-400">{config.teamBName}</label>
                <select
                  className="input border-red-900"
                  value={playerBId}
                  onChange={(e) => setPlayerBId(e.target.value)}
                >
                  <option value="">— player 1 —</option>
                  {availableB.filter(p => p.id !== playerB2Id).map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.handicap})</option>
                  ))}
                </select>
                {format === 'fourball' && (
                  <select
                    className="input border-red-900"
                    value={playerB2Id}
                    onChange={(e) => setPlayerB2Id(e.target.value)}
                  >
                    <option value="">— player 2 —</option>
                    {availableB2.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.handicap})</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={saving || !canAdd}
            >
              Add {FORMAT_LABELS[format]} Matchup
            </button>
          </form>
        )}
      </div>

      {/* Existing matchups by round */}
      {rounds.map((round) => {
        const rMatchups = matchups.filter((m) => m.roundId === round.id);
        if (rMatchups.length === 0) return null;
        return (
          <div key={round.id}>
            <h3 className="font-bold mb-2">
              Round {round.number} –{' '}
              <span className="text-slate-300 font-normal">{round.courseName}</span>
            </h3>
            <div className="space-y-2">
              {rMatchups.map((m) => {
                const pA = getPlayer(m.playerAId);
                const pB = getPlayer(m.playerBId);
                const pA2 = getPlayer(m.playerA2Id);
                const pB2 = getPlayer(m.playerB2Id);
                if (!pA || !pB) return null;
                const result = calcMatchResult(m, pA, pB, round.strokeIndexes, pA2, pB2);
                return (
                  <div key={m.id} className="card flex items-center justify-between gap-2">
                    <div className="text-sm min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          m.format === 'fourball'
                            ? 'bg-purple-900 text-purple-300'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {m.format === 'fourball' ? '2v2' : '1v1'}
                        </span>
                        <span className="text-blue-400 font-medium">
                          {pA.name}{pA2 ? ` & ${pA2.name}` : ''}
                        </span>
                        <span className="text-slate-400">vs</span>
                        <span className="text-red-400 font-medium">
                          {pB.name}{pB2 ? ` & ${pB2.name}` : ''}
                        </span>
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">
                        {result.holesPlayed === 0
                          ? 'Not started'
                          : `${result.status} (thru ${result.holesPlayed})`}
                      </div>
                    </div>
                    <button
                      className="text-red-400 hover:text-red-300 text-sm px-2 py-1 shrink-0"
                      onClick={() => handleDelete(m.id)}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
