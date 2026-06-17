import { useState } from 'react';
import type { TripEvent, TripEventCategory } from '../types';
import { addTripEvent, deleteTripEvent, updateTripEvent } from '../lib/db';

interface Props {
  tripId: string;
  events: TripEvent[];
}

const CATEGORY_LABELS: Record<TripEventCategory, string> = {
  golf: 'Golf',
  meal: 'Meal',
  travel: 'Travel',
  lodging: 'Lodging',
  meeting: 'Meeting',
  other: 'Other',
};

const EMPTY_FORM = {
  date: '',
  time: '',
  title: '',
  location: '',
  notes: '',
  category: 'golf' as TripEventCategory,
};

export default function AdminItinerary({ tripId, events }: Props) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tripId || !form.date || !form.title.trim()) return;
    setSaving(true);
    const payload = {
      tripId,
      date: form.date,
      time: form.time.trim() || undefined,
      title: form.title.trim(),
      location: form.location.trim() || undefined,
      notes: form.notes.trim() || undefined,
      category: form.category,
      createdAt: Date.now(),
    };
    if (editingId) {
      await updateTripEvent(editingId, payload);
    } else {
      await addTripEvent(payload);
    }
    setForm(EMPTY_FORM);
    setEditingId(null);
    setSaving(false);
  }

  function startEdit(event: TripEvent) {
    setEditingId(event.id);
    setForm({
      date: event.date,
      time: event.time ?? '',
      title: event.title,
      location: event.location ?? '',
      notes: event.notes ?? '',
      category: event.category,
    });
  }

  async function handleDelete(event: TripEvent) {
    if (!confirm(`Delete "${event.title}"?`)) return;
    await deleteTripEvent(event.id);
  }

  const sortedEvents = [...events].sort((a, b) => `${a.date} ${a.time ?? ''}`.localeCompare(`${b.date} ${b.time ?? ''}`));

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="font-semibold mb-3">{editingId ? 'Edit Itinerary Item' : 'Add Itinerary Item'}</h3>
        {!tripId && (
          <div className="mb-3 rounded-lg border border-yellow-800 bg-yellow-950 px-3 py-2 text-sm text-yellow-200">
            Select or create a trip before adding itinerary items.
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input
                className="input"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Time</label>
              <input
                className="input"
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Title</label>
            <input
              className="input"
              placeholder="Round 1 tee times, dinner, airport run"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_11rem] gap-3">
            <div>
              <label className="label">Location</label>
              <input
                className="input"
                placeholder="Course, restaurant, hotel"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as TripEventCategory })}
              >
                {(Object.keys(CATEGORY_LABELS) as TripEventCategory[]).map((category) => (
                  <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input min-h-24"
              placeholder="Pairing notes, dress code, reservation name, shuttle details"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <button className="btn-primary flex-1" disabled={saving || !tripId || !form.date || !form.title.trim()}>
              {editingId ? 'Save Item' : 'Add Item'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="space-y-3">
        {sortedEvents.length === 0 && <p className="text-sm text-slate-500">No itinerary items for this trip yet.</p>}
        {sortedEvents.map((event) => (
          <div key={event.id} className="card flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-emerald-950 px-2 py-0.5 text-xs font-bold text-emerald-300">
                  {CATEGORY_LABELS[event.category]}
                </span>
                <span className="text-sm font-semibold text-white">{formatEventDate(event.date)} {event.time ? `· ${formatTime(event.time)}` : ''}</span>
              </div>
              <div className="mt-1 font-bold">{event.title}</div>
              {event.location && <div className="text-sm text-slate-400">{event.location}</div>}
              {event.notes && <div className="mt-2 whitespace-pre-wrap text-sm text-slate-400">{event.notes}</div>}
            </div>
            <div className="flex shrink-0 gap-2">
              <button className="text-sm text-slate-400 hover:text-white" onClick={() => startEdit(event)}>Edit</button>
              <button className="text-sm text-red-400 hover:text-red-300" onClick={() => handleDelete(event)}>x</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatEventDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(time: string) {
  const [hoursRaw, minutes] = time.split(':').map(Number);
  if (!Number.isFinite(hoursRaw) || !Number.isFinite(minutes)) return time;
  const suffix = hoursRaw >= 12 ? 'PM' : 'AM';
  const hours = hoursRaw % 12 || 12;
  return `${hours}:${String(minutes).padStart(2, '0')} ${suffix}`;
}
