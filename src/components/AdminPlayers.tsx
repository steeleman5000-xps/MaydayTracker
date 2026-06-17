import { useState } from 'react';
import type { Player, AppConfig, TeamId } from '../types';
import { addPlayer, updatePlayer, deletePlayer } from '../lib/db';

interface Props {
  players: Player[];
  config: AppConfig;
}

const BLANK = { name: '', email: '', teamId: 'A' as TeamId, handicap: 0, teebox: 'White' };

export default function AdminPlayers({ players, config }: Props) {
  const [form, setForm] = useState(BLANK);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await addPlayer({
      ...form,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      handicap: Number(form.handicap),
      teebox: form.teebox,
      createdAt: Date.now(),
    });
    setForm(BLANK);
    setSaving(false);
  }

  async function handleUpdate(id: string) {
    setSaving(true);
    await updatePlayer(id, {
      ...editForm,
      email: editForm.email.trim().toLowerCase(),
      handicap: Number(editForm.handicap),
      teebox: editForm.teebox,
    });
    setEditing(null);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this player?')) return;
    await deletePlayer(id);
  }

  async function handleImportFile(file?: File) {
    if (!file) return;
    setSaving(true);
    setImportMessage(null);
    setImportError(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) throw new Error('No rows found in the file.');

      const existingByEmail = new Map(
        players
          .filter((p) => p.email)
          .map((p) => [p.email!.trim().toLowerCase(), p])
      );
      const existingByName = new Map(players.map((p) => [p.name.trim().toLowerCase(), p]));
      const importedByName = new Map<string, { id: string; teamId: TeamId }>(
        players.map((p) => [p.name.trim().toLowerCase(), { id: p.id, teamId: p.teamId }])
      );
      let added = 0;
      let updated = 0;
      let skipped = 0;
      let rivalsAssigned = 0;
      const pendingRivals: Array<{ playerName: string; rivalName: string }> = [];

      for (const row of rows) {
        const name = valueFor(row, ['name', 'player', 'full name']);
        if (!name) { skipped++; continue; }
        const email = valueFor(row, ['email', 'email address']).toLowerCase();
        const teamId = parseTeam(valueFor(row, ['team', 'teamid', 'team id']), config);
        const handicap = parseHandicap(valueFor(row, ['handicap', 'hcp', 'index']));
        const teebox = valueFor(row, ['teebox', 'tee box', 'tees', 'tee']) || 'White';
        const rivalName = valueFor(row, ['rival', 'rival name']);
        const existing = email ? existingByEmail.get(email) : existingByName.get(name.toLowerCase());

        const payload = {
          name,
          email,
          teamId,
          handicap,
          teebox,
        };

        if (existing) {
          await updatePlayer(existing.id, payload);
          importedByName.set(name.toLowerCase(), { id: existing.id, teamId });
          updated++;
        } else {
          const id = await addPlayer({ ...payload, createdAt: Date.now() + added });
          importedByName.set(name.toLowerCase(), { id, teamId });
          added++;
        }

        if (rivalName) pendingRivals.push({ playerName: name, rivalName });
      }

      for (const pending of pendingRivals) {
        const player = importedByName.get(pending.playerName.toLowerCase());
        const rival = importedByName.get(pending.rivalName.toLowerCase());
        if (!player || !rival || player.teamId !== 'A' || rival.teamId !== 'B') continue;
        await updatePlayer(player.id, { rivalId: rival.id });
        rivalsAssigned++;
      }

      setImportMessage(`Import complete: ${added} added, ${updated} updated, ${skipped} skipped, ${rivalsAssigned} rivals assigned.`);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Could not import players.');
    } finally {
      setSaving(false);
    }
  }

  const teamA = players.filter((p) => p.teamId === 'A');
  const teamB = players.filter((p) => p.teamId === 'B');

  async function handleRivalChange(player: Player, rivalId: string) {
    setSaving(true);
    await updatePlayer(player.id, { rivalId });
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="font-semibold mb-3">Import Players</h3>
        <label className="label">CSV File</label>
        <input
          className="input"
          type="file"
          accept=".csv,text/csv"
          disabled={saving}
          onChange={(e) => {
            void handleImportFile(e.target.files?.[0]);
            e.currentTarget.value = '';
          }}
        />
        <p className="text-slate-500 text-xs mt-2">
          Headers accepted: name, email, team, handicap, teebox, rival. Existing players are matched by email first, then name.
        </p>
        {importMessage && (
          <div className="rounded-lg border border-emerald-800 bg-emerald-950 px-3 py-2 text-sm text-emerald-200 mt-3">
            {importMessage}
          </div>
        )}
        {importError && (
          <div className="rounded-lg border border-red-800 bg-red-950 px-3 py-2 text-sm text-red-200 mt-3">
            {importError}
          </div>
        )}
      </div>

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
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="player@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <p className="text-slate-500 text-xs mt-1">
              Players use this email to sign in and update their own handicap/tees.
            </p>
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
                    <input
                      className="input"
                      type="email"
                      placeholder="player@example.com"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
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
                    {p.email && (
                      <div className="text-slate-500 text-xs mt-0.5">{p.email}</div>
                    )}
                    {p.teamId === 'A' && (
                      <div className="mt-2 max-w-xs">
                        <label className="text-slate-500 text-xs block mb-1">Rival</label>
                        <select
                          className="input text-sm py-1"
                          value={p.rivalId ?? ''}
                          disabled={saving}
                          onChange={(e) => handleRivalChange(p, e.target.value)}
                        >
                          <option value="">No rival assigned</option>
                          {teamB.map((rival) => (
                            <option key={rival.id} value={rival.id}>
                              {rival.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {p.teamId === 'B' && (
                      <div className="text-slate-500 text-xs mt-1">
                        Rival: {teamA.find((a) => a.rivalId === p.id)?.name ?? 'Unassigned'}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="text-slate-400 hover:text-white text-sm px-2 py-1"
                      onClick={() => { setEditing(p.id); setEditForm({ name: p.name, email: p.email ?? '', teamId: p.teamId, handicap: p.handicap, teebox: p.teebox ?? 'White' }); }}
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

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field.trim());
      field = '';
    } else if (char === '\n') {
      row.push(field.trim());
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (field || row.length > 0) {
    row.push(field.trim());
    rows.push(row);
  }

  const [headerRow, ...dataRows] = rows.filter((r) => r.some(Boolean));
  if (!headerRow) return [];
  const headers = headerRow.map(normalizeHeader);
  return dataRows.map((cells) => Object.fromEntries(headers.map((header, i) => [header, cells[i]?.trim() ?? ''])));
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

function valueFor(row: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const val = row[normalizeHeader(key)];
    if (val) return val.trim();
  }
  return '';
}

function parseTeam(raw: string, config: AppConfig): TeamId {
  const normalized = raw.trim().toLowerCase();
  if (normalized === 'b' || normalized === config.teamBName.toLowerCase()) return 'B';
  return 'A';
}

function parseHandicap(raw: string): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}
