import { useEffect, useState } from 'react';
import type { Player, Round, Matchup, AppConfig, MatchFormat } from '../types';
import { addMatchup, deleteMatchup, updateMatchup } from '../lib/db';
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
  const [firstTeeTime, setFirstTeeTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (selectedRoundId && !rounds.some((round) => round.id === selectedRoundId)) {
      setSelectedRoundId('');
      resetForm();
      setMessage(null);
    }
  }, [rounds, selectedRoundId]);

  const playersA = players.filter((p) => p.teamId === 'A');
  const playersB = players.filter((p) => p.teamId === 'B');
  const roundMatchups = matchups
    .filter((m) => m.roundId === selectedRoundId)
    .sort((a, b) => a.createdAt - b.createdAt);

  const selectedIds = new Set([playerAId, playerA2Id, playerBId, playerB2Id].filter(Boolean));
  const usedPlayerIds = new Set([
    ...roundMatchups.map((m) => m.playerAId),
    ...roundMatchups.map((m) => m.playerBId),
    ...roundMatchups.flatMap((m) => [m.playerA2Id, m.playerB2Id].filter(Boolean) as string[]),
  ]);

  const availableA = playersA.filter((p) => !usedPlayerIds.has(p.id));
  const availableB = playersB.filter((p) => !usedPlayerIds.has(p.id));

  function resetForm() {
    setPlayerAId('');
    setPlayerA2Id('');
    setPlayerBId('');
    setPlayerB2Id('');
  }

  function choosePlayer(player: Player) {
    if (usedPlayerIds.has(player.id)) return;
    if (player.teamId === 'A') {
      if (playerAId === player.id) setPlayerAId('');
      else if (playerA2Id === player.id) setPlayerA2Id('');
      else if (!playerAId) setPlayerAId(player.id);
      else if (format === 'fourball' && !playerA2Id) setPlayerA2Id(player.id);
    } else {
      if (playerBId === player.id) setPlayerBId('');
      else if (playerB2Id === player.id) setPlayerB2Id('');
      else if (!playerBId) setPlayerBId(player.id);
      else if (format === 'fourball' && !playerB2Id) setPlayerB2Id(player.id);
    }
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
      teeTime: nextTeeTime(roundMatchups, firstTeeTime),
      scores: {},
      wagers: {},
      status: 'pending',
      createdAt: Date.now(),
    });
    resetForm();
    setSaving(false);
  }

  async function handleGenerateRivalSingles() {
    if (!selectedRoundId) return;
    setSaving(true);
    setMessage(null);
    let created = 0;
    let skipped = 0;
    for (const playerA of playersA) {
      if (!playerA.rivalId) { skipped++; continue; }
      const playerB = playersB.find((p) => p.id === playerA.rivalId);
      if (!playerB) { skipped++; continue; }
      if (usedPlayerIds.has(playerA.id) || usedPlayerIds.has(playerB.id)) { skipped++; continue; }
      await addMatchup({
        roundId: selectedRoundId,
        format: 'singles',
        playerAId: playerA.id,
        playerBId: playerB.id,
        teeTime: addMinutes(firstTeeTime, roundMatchups.length + created),
        scores: {},
        wagers: {},
        status: 'pending',
        createdAt: Date.now() + created,
      });
      created++;
    }
    setMessage(`Rival singles generated: ${created} created, ${skipped} skipped.`);
    setSaving(false);
  }

  async function handleApplyTeeTimes() {
    if (!firstTeeTime || roundMatchups.length === 0) return;
    setSaving(true);
    for (let i = 0; i < roundMatchups.length; i++) {
      await updateMatchup(roundMatchups[i].id, { teeTime: addMinutes(firstTeeTime, i) });
    }
    setMessage(`Tee times assigned from ${formatTime(firstTeeTime)} in 10-minute increments.`);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this matchup? Scores will be lost.')) return;
    await deleteMatchup(id);
  }

  function getPlayer(id?: string) {
    return id ? players.find((p) => p.id === id) : undefined;
  }

  const selectedRound = rounds.find((r) => r.id === selectedRoundId);

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="font-semibold mb-3">Add Matchup</h3>

        <div className="mb-3">
          <label className="label">Round</label>
          <select
            className="input"
            value={selectedRoundId}
            onChange={(e) => { setSelectedRoundId(e.target.value); resetForm(); setMessage(null); }}
          >
            <option value="">- select round -</option>
            {rounds.map((r) => (
              <option key={r.id} value={r.id}>Round {r.number} - {r.courseName}</option>
            ))}
          </select>
          {rounds.length === 0 && (
            <p className="text-slate-500 text-xs mt-2">No rounds have been added for the selected trip.</p>
          )}
        </div>

        {selectedRoundId && (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 space-y-3">
              <div>
                <label className="label">First Tee Time</label>
                <div className="flex gap-2">
                  <input
                    className="input"
                    type="time"
                    value={firstTeeTime}
                    onChange={(e) => setFirstTeeTime(e.target.value)}
                  />
                  <button className="btn-secondary text-sm" disabled={saving || !firstTeeTime} onClick={handleApplyTeeTimes}>
                    Apply
                  </button>
                </div>
                <p className="text-slate-500 text-xs mt-1">Existing and new matchups use 10-minute increments from the first time.</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-sm">Rival Singles</div>
                  <div className="text-slate-500 text-xs mt-0.5">Auto-create 1v1 matches from Team A rival assignments.</div>
                </div>
                <button type="button" className="btn-secondary text-sm shrink-0" disabled={saving} onClick={handleGenerateRivalSingles}>
                  Generate
                </button>
              </div>
              {message && <div className="text-emerald-400 text-xs">{message}</div>}
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
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

              <div className="grid grid-cols-2 gap-3">
                <TeamPicker
                  title={config.teamAName}
                  color="blue"
                  players={availableA}
                  selectedIds={selectedIds}
                  selectedPrimaryId={playerAId}
                  selectedSecondaryId={playerA2Id}
                  format={format}
                  onPick={choosePlayer}
                />
                <TeamPicker
                  title={config.teamBName}
                  color="red"
                  players={availableB}
                  selectedIds={selectedIds}
                  selectedPrimaryId={playerBId}
                  selectedSecondaryId={playerB2Id}
                  format={format}
                  onPick={choosePlayer}
                />
              </div>

              <div className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-300">
                <SelectedLine players={players} playerAId={playerAId} playerA2Id={playerA2Id} playerBId={playerBId} playerB2Id={playerB2Id} format={format} />
              </div>

              <button type="submit" className="btn-primary w-full" disabled={saving || !canAdd}>
                Add {FORMAT_LABELS[format]} Matchup
              </button>
            </form>
          </div>
        )}
      </div>

      {rounds.map((round) => {
        const rMatchups = matchups.filter((m) => m.roundId === round.id).sort((a, b) => a.createdAt - b.createdAt);
        if (rMatchups.length === 0) return null;
        return (
          <div key={round.id}>
            <h3 className="font-bold mb-2">
              Round {round.number} - <span className="text-slate-300 font-normal">{round.courseName}</span>
              {selectedRound?.id === round.id && firstTeeTime && <span className="text-slate-500 text-xs ml-2">from {formatTime(firstTeeTime)}</span>}
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
                        {m.teeTime && <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-medium">{formatTime(m.teeTime)}</span>}
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          m.format === 'fourball' ? 'bg-purple-900 text-purple-300' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {m.format === 'fourball' ? '2v2' : '1v1'}
                        </span>
                        <span className="text-blue-400 font-medium">{pA.name}{pA2 ? ` & ${pA2.name}` : ''}</span>
                        <span className="text-slate-400">vs</span>
                        <span className="text-red-400 font-medium">{pB.name}{pB2 ? ` & ${pB2.name}` : ''}</span>
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">
                        {result.holesPlayed === 0 ? 'Not started' : `${result.status} (thru ${result.holesPlayed})`}
                      </div>
                    </div>
                    <button className="text-red-400 hover:text-red-300 text-sm px-2 py-1 shrink-0" onClick={() => handleDelete(m.id)}>
                      x
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

function TeamPicker({
  title,
  color,
  players,
  selectedIds,
  selectedPrimaryId,
  selectedSecondaryId,
  format,
  onPick,
}: {
  title: string;
  color: 'blue' | 'red';
  players: Player[];
  selectedIds: Set<string>;
  selectedPrimaryId: string;
  selectedSecondaryId: string;
  format: MatchFormat;
  onPick: (player: Player) => void;
}) {
  const colorClass = color === 'blue' ? 'text-blue-400 border-blue-900' : 'text-red-400 border-red-900';
  return (
    <div className={`rounded-lg border ${colorClass} bg-slate-900 p-2`}>
      <div className={`font-semibold text-sm mb-2 ${color === 'blue' ? 'text-blue-400' : 'text-red-400'}`}>{title}</div>
      <div className="flex flex-wrap gap-2">
        {players.map((p) => {
          const selected = selectedIds.has(p.id);
          const slot = p.id === selectedPrimaryId ? '1' : p.id === selectedSecondaryId ? '2' : '';
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onPick(p)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                selected
                  ? color === 'blue' ? 'bg-blue-800 border-blue-500 text-white' : 'bg-red-800 border-red-500 text-white'
                  : 'bg-slate-800 border-slate-600 text-slate-300 hover:text-white'
              }`}
              title="Click to add/remove"
            >
              {slot && format === 'fourball' ? `${slot}. ` : ''}{p.name}
            </button>
          );
        })}
        {players.length === 0 && <span className="text-slate-500 text-xs">No available players</span>}
      </div>
    </div>
  );
}

function SelectedLine({ players, playerAId, playerA2Id, playerBId, playerB2Id, format }: {
  players: Player[];
  playerAId: string;
  playerA2Id: string;
  playerBId: string;
  playerB2Id: string;
  format: MatchFormat;
}) {
  const name = (id: string) => players.find((p) => p.id === id)?.name ?? '-';
  return (
    <>
      <span className="text-blue-400">{name(playerAId)}{format === 'fourball' ? ` / ${name(playerA2Id)}` : ''}</span>
      <span className="text-slate-500"> vs </span>
      <span className="text-red-400">{name(playerBId)}{format === 'fourball' ? ` / ${name(playerB2Id)}` : ''}</span>
    </>
  );
}

function nextTeeTime(existing: Matchup[], firstTeeTime: string): string {
  if (!firstTeeTime) return '';
  return addMinutes(firstTeeTime, existing.length);
}

function addMinutes(time: string, increments: number): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return '';
  const total = hours * 60 + minutes + increments * 10;
  const nextHours = Math.floor(total / 60) % 24;
  const nextMinutes = total % 60;
  return `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`;
}

function formatTime(time: string): string {
  if (!time) return '';
  const [hoursRaw, minutes] = time.split(':').map(Number);
  if (!Number.isFinite(hoursRaw) || !Number.isFinite(minutes)) return time;
  const suffix = hoursRaw >= 12 ? 'PM' : 'AM';
  const hours = hoursRaw % 12 || 12;
  return `${hours}:${String(minutes).padStart(2, '0')} ${suffix}`;
}
