import { useState } from 'react';
import type { Round } from '../types';
import { saveRound, updateRound, deleteRound } from '../lib/db';

interface Props {
  rounds: Round[];
}

const DEFAULT_SI = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18];
const BLANK_ROUND = { number: 1, courseName: '', strokeIndexes: [...DEFAULT_SI] };

export default function AdminRounds({ rounds }: Props) {
  const [form, setForm] = useState(BLANK_ROUND);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editState, setEditState] = useState<{ courseName: string; strokeIndexes: number[] } | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.courseName.trim()) return;
    setSaving(true);
    await saveRound({ ...form, courseName: form.courseName.trim(), createdAt: Date.now() });
    setForm(BLANK_ROUND);
    setSaving(false);
  }

  function setSI(idx: number, val: string) {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) return;
    setForm((f) => {
      const si = [...f.strokeIndexes];
      si[idx] = parsed;
      return { ...f, strokeIndexes: si };
    });
  }

  function setEditSI(idx: number, val: string) {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) return;
    setEditState((s) => {
      if (!s) return s;
      const si = [...s.strokeIndexes];
      si[idx] = parsed;
      return { ...s, strokeIndexes: si };
    });
  }

  async function handleUpdate(id: string) {
    if (!editState) return;
    setSaving(true);
    await updateRound(id, editState);
    setExpanded(null);
    setEditState(null);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this round? All matchups for this round will still exist.')) return;
    await deleteRound(id);
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="font-semibold mb-3">Add Round</h3>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="flex gap-3">
            <div className="w-24">
              <label className="label">Round #</label>
              <input
                type="number"
                className="input"
                min="1"
                max="3"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: Number(e.target.value) })}
              />
            </div>
            <div className="flex-1">
              <label className="label">Course Name</label>
              <input
                className="input"
                placeholder="e.g. Pebble Beach"
                value={form.courseName}
                onChange={(e) => setForm({ ...form, courseName: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Hole Stroke Indexes (from scorecard)</label>
            <p className="text-slate-500 text-xs mb-2">
              Enter the stroke index for each hole 1–18. Hole with SI=1 is hardest (first to receive a stroke).
            </p>
            <div className="grid grid-cols-9 gap-1">
              {form.strokeIndexes.map((si, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <span className="text-slate-500 text-xs">{idx + 1}</span>
                  <input
                    type="number"
                    className="w-full text-center bg-slate-700 border border-slate-600 rounded p-1 text-white text-sm focus:outline-none focus:border-emerald-500"
                    min="1"
                    max="18"
                    value={si}
                    onChange={(e) => setSI(idx, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={saving || !form.courseName.trim()}>
            Add Round
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {rounds.length === 0 && <p className="text-slate-500 text-sm">No rounds yet.</p>}
        {rounds.map((r) => (
          <div key={r.id} className="card">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold">Round {r.number}</span>
                <span className="text-slate-300 ml-2">{r.courseName}</span>
              </div>
              <div className="flex gap-2">
                <button
                  className="text-slate-400 hover:text-white text-sm px-2 py-1"
                  onClick={() => {
                    if (expanded === r.id) { setExpanded(null); setEditState(null); return; }
                    setExpanded(r.id);
                    setEditState({ courseName: r.courseName, strokeIndexes: [...r.strokeIndexes] });
                  }}
                >
                  {expanded === r.id ? 'Close' : 'Edit'}
                </button>
                <button
                  className="text-red-400 hover:text-red-300 text-sm px-2 py-1"
                  onClick={() => handleDelete(r.id)}
                >
                  ✕
                </button>
              </div>
            </div>

            {expanded === r.id && editState && (
              <div className="mt-3 pt-3 border-t border-slate-700 space-y-3">
                <div>
                  <label className="label">Course Name</label>
                  <input
                    className="input"
                    value={editState.courseName}
                    onChange={(e) => setEditState({ ...editState, courseName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Stroke Indexes</label>
                  <div className="grid grid-cols-9 gap-1">
                    {editState.strokeIndexes.map((si, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <span className="text-slate-500 text-xs">{idx + 1}</span>
                        <input
                          type="number"
                          className="w-full text-center bg-slate-700 border border-slate-600 rounded p-1 text-white text-sm focus:outline-none focus:border-emerald-500"
                          min="1"
                          max="18"
                          value={si}
                          onChange={(e) => setEditSI(idx, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary flex-1" disabled={saving} onClick={() => handleUpdate(r.id)}>Save</button>
                  <button className="btn-secondary" onClick={() => { setExpanded(null); setEditState(null); }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
