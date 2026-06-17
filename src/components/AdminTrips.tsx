import { useState } from 'react';
import type { AppConfig, Player, Trip } from '../types';
import { addTrip, deleteTrip, saveConfig, updateTrip } from '../lib/db';
import { defaultBackgroundForTrip } from '../lib/tripAssets';

interface Props {
  trips: Trip[];
  players: Player[];
  config: AppConfig;
}

export default function AdminTrips({ trips, players, config }: Props) {
  const [name, setName] = useState('Mayday');
  const [year, setYear] = useState(new Date().getFullYear());
  const [teamAName, setTeamAName] = useState(config.teamAName);
  const [teamBName, setTeamBName] = useState(config.teamBName);
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [editBackgroundUrl, setEditBackgroundUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const id = await addTrip({
        name: name.trim(),
        year: Number(year),
        teamAName: teamAName.trim() || config.teamAName,
        teamBName: teamBName.trim() || config.teamBName,
        backgroundUrl: backgroundUrl.trim() || defaultBackgroundForTrip(Number(year), name.trim()),
        createdAt: Date.now(),
      });
      await saveConfig({ ...config, activeTripId: config.activeTripId ?? id });
      setName('Mayday');
      setTeamAName(config.teamAName);
      setTeamBName(config.teamBName);
      setBackgroundUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save trip');
    } finally {
      setSaving(false);
    }
  }

  async function setActiveTrip(tripId: string) {
    setSaving(true);
    setError(null);
    try {
      await saveConfig({ ...config, activeTripId: tripId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update active trip');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(trip: Trip) {
    if (!confirm(`Delete ${trip.year} ${trip.name}? Rounds and matchups will not be deleted.`)) return;
    setSaving(true);
    setError(null);
    try {
      await deleteTrip(trip.id);
      if (config.activeTripId === trip.id) {
        const nextTrip = trips.find((t) => t.id !== trip.id);
        await saveConfig({ ...config, activeTripId: nextTrip?.id ?? '' });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete trip');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateBackground(trip: Trip) {
    setSaving(true);
    setError(null);
    try {
      await updateTrip(trip.id, { backgroundUrl: editBackgroundUrl.trim() });
      setEditingTripId(null);
      setEditBackgroundUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update background');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateTripSettings(trip: Trip, patch: Partial<Trip>) {
    setSaving(true);
    setError(null);
    try {
      await updateTrip(trip.id, patch);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update trip');
    } finally {
      setSaving(false);
    }
  }

  const playersA = players.filter((p) => p.teamId === 'A');
  const playersB = players.filter((p) => p.teamId === 'B');

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="font-semibold mb-3">Add Trip</h3>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="flex gap-3">
            <div className="w-28">
              <label className="label">Year</label>
              <input
                type="number"
                className="input"
                min="2000"
                max="2100"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              />
            </div>
            <div className="flex-1">
              <label className="label">Trip Name</label>
              <input
                className="input"
                placeholder="Mayday"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-blue-400">Team A Name</label>
              <input
                className="input border-blue-800"
                value={teamAName}
                onChange={(e) => setTeamAName(e.target.value)}
              />
            </div>
            <div>
              <label className="label text-red-400">Team B Name</label>
              <input
                className="input border-red-800"
                value={teamBName}
                onChange={(e) => setTeamBName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Transparent Background URL</label>
            <input
              className="input"
              placeholder="/trips/example-trip-background.jpg"
              value={backgroundUrl}
              onChange={(e) => setBackgroundUrl(e.target.value)}
            />
            <p className="text-slate-500 text-xs mt-1">
              Leave blank to use the standard Mayday background.
            </p>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={saving || !name.trim()}>
            Add Trip
          </button>
          {error && (
            <div className="rounded-lg border border-red-800 bg-red-950 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
        </form>
      </div>

      <div className="space-y-2">
        {trips.length === 0 && (
          <p className="text-slate-500 text-sm">No trips yet. Add this year's trip first.</p>
        )}
        {trips.map((trip) => {
          const active = config.activeTripId === trip.id;
          return (
            <div key={trip.id} className="card flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold">{trip.year} {trip.name}</div>
                <div className="text-xs mt-1">
                  <span className="text-blue-400">{trip.teamAName ?? config.teamAName}</span>
                  <span className="text-slate-500"> vs </span>
                  <span className="text-red-400">{trip.teamBName ?? config.teamBName}</span>
                </div>
                <div className={`text-xs mt-0.5 ${active ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {active ? 'Current trip' : 'Available in trip dropdowns'}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <select
                    className="input text-sm py-1 border-blue-900"
                    value={trip.captainAId ?? ''}
                    disabled={saving}
                    onChange={(e) => handleUpdateTripSettings(trip, { captainAId: e.target.value })}
                  >
                    <option value="">Team A captain</option>
                    {playersA.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <select
                    className="input text-sm py-1 border-red-900"
                    value={trip.captainBId ?? ''}
                    disabled={saving}
                    onChange={(e) => handleUpdateTripSettings(trip, { captainBId: e.target.value })}
                  >
                    <option value="">Team B captain</option>
                    {playersB.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                {editingTripId === trip.id ? (
                  <div className="mt-3 flex gap-2">
                    <input
                      className="input text-sm"
                      value={editBackgroundUrl}
                      placeholder="/trips/example-trip-background.jpg"
                      onChange={(e) => setEditBackgroundUrl(e.target.value)}
                    />
                    <button className="btn-primary text-sm" disabled={saving} onClick={() => handleUpdateBackground(trip)}>
                      Save
                    </button>
                  </div>
                ) : (trip.backgroundUrl || defaultBackgroundForTrip(trip.year, trip.name)) && (
                  <div className="text-slate-500 text-xs mt-1">
                    Background: {trip.backgroundUrl || defaultBackgroundForTrip(trip.year, trip.name)}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {editingTripId !== trip.id && (
                  <button
                    className="btn-secondary text-sm"
                    disabled={saving}
                    onClick={() => {
                      setEditingTripId(trip.id);
                      setEditBackgroundUrl(trip.backgroundUrl || defaultBackgroundForTrip(trip.year, trip.name));
                    }}
                  >
                    Background
                  </button>
                )}
                {!active && (
                  <button className="btn-secondary text-sm" disabled={saving} onClick={() => setActiveTrip(trip.id)}>
                    Set Current
                  </button>
                )}
                <button
                  className="text-red-400 hover:text-red-300 text-sm px-2 py-1"
                  disabled={saving}
                  onClick={() => handleDelete(trip)}
                >
                  x
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
