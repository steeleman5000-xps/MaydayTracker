import { useState } from 'react';
import type { Player, AppConfig, TeamId } from '../types';
import { addPlayer, updatePlayer, deletePlayer } from '../lib/db';

interface Props {
  players: Player[];
  config: AppConfig;
}

const BLANK = { name: '', teamId: 'A' as TeamId, handicap: 0, teebox: 'White' };

export default function AdminPlayers({ players, config }: Props) {
  const [form, setForm] = useState(BLANK);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await addPlayer({ ...form, name: form.name.trim(), handicap: Number(form.handicap), teebox: form.teebox, createdAt: Date.now() });
    setForm(BLANK);
    setSaving(false);
  }

  async function handleUpdate(id: string) {
    setSaving(true);
    await updatePlayer(id, { ...editForm, handicap: Number(editForm.handicap), teebox: editForm.teebox });
    setEditing(null);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this player?')) return;
    await deletePlayer(id);
  }

  const teamA = players.filter((p) => p.teamId === 'A');
  const teamB = players.filter((p) => p.teamId === 'B');

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="font-semibold mb-3">Add Player</h3>
        <form onSubmit={handleAdd} className="flex flex-col gap-3">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="label">Team</label>
              <select
                className="input"
                value={form.teamId}
                onChange={(e) => setForm({ ...form, teamId: e.target.value as TeamId })}
              >
                <option value="A">{config.teamAName}</option>
                <option value="B">{config.teamBName}</option>
              </select>
            </div>
            <div className="w-28">
              <label className="label">Handicap</label>
              <input
                type="number"
                className="input"
                min="0"
                max="54"
                step="0.1"
                value={form.handicap}
                onChange={(e) => setForm({ ...form, handicap: Number(e.target.value) })}
              />
            </div>
            <div className="w-24">
              <label className="label">Tees</label>
              <select
                className="input"
                value={form.teebox}
                onChange={(e) => setForm({ ...form, teebox: e.target.value })}
              >
                <option>White</option>
                <option>Blue</option>
                <option>Black</option>
                <option>Gold</option>
                <option>Red</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={saving || !form.name.trim()}>
            Add Player
          </button>
        </form>
      </div>

      {[
        { team: 'A' as TeamId, name: config.teamAName, color: 'text-blue-400', list: teamA },
        { team: 'B' as TeamId, name: config.teamBName, color: 'text-red-400', list: teamB },
      ].map(({ team, name, color, list }) => (
        <div key={team}>
          <h3 className={`font-bold text-lg mb-2 ${color}`}>
            {name} <span className="text-slate-400 font-normal text-sm">({list.length} players)</span>
          </h3>
          <div className="space-y-2">
            {list.length === 0 && (
              <p className="text-slate-500 text-sm">No players yet.</p>
            )}
            {list.map((p) =>
              editing === p.id ? (
                <div key={p.id} className="card">
                  <div className="flex flex-col gap-2">
                    <input
                      className="input"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <select
                        className="input flex-1"
                        value={editForm.teamId}
                        onChange={(e) => setEditForm({ ...editForm, teamId: e.target.value as TeamId })}
                      >
                        <option value="A">{config.teamAName}</option>
                        <option value="B">{config.teamBName}</option>
                      </select>
                      <input
                        type="number"
                        className="input w-28"
                        min="0"
                        max="54"
                        step="0.1"
                        value={editForm.handicap}
                        onChange={(e) => setEditForm({ ...editForm, handicap: Number(e.target.value) })}
                      />
                      <select
                        className="input w-24"
                        value={editForm.teebox ?? 'White'}
                        onChange={(e) => setEditForm({ ...editForm, teebox: e.target.value })}
                      >
                        <option>White</option>
                        <option>Blue</option>
                        <option>Black</option>
                        <option>Gold</option>
                        <option>Red</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-primary flex-1" disabled={saving} onClick={() => handleUpdate(p.id)}>Save</button>
                      <button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={p.id} className="card flex items-center justify-between">
                  <div>
                    <span className="font-medium">{p.name}</span>
                    <span className="text-slate-400 text-sm ml-2">HCP {p.handicap}</span>
                    {p.teebox && p.teebox !== 'White' && (
                      <span className="text-amber-400 text-xs ml-2 font-medium">{p.teebox} tees</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="text-slate-400 hover:text-white text-sm px-2 py-1"
                      onClick={() => { setEditing(p.id); setEditForm({ name: p.name, teamId: p.teamId, handicap: p.handicap, teebox: p.teebox ?? 'White' }); }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-400 hover:text-red-300 text-sm px-2 py-1"
                      onClick={() => handleDelete(p.id)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
