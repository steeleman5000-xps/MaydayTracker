import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import type { AppConfig, Round, Trip, TripEvent, TripEventCategory } from '../types';
import { subscribeConfig, subscribeRounds, subscribeTripEvents, subscribeTrips } from '../lib/db';
import { tripBackgroundUrl } from '../lib/tripAssets';
import { useTripSelection } from '../lib/tripSelection';

const CATEGORY_STYLE: Record<TripEventCategory, string> = {
  golf: 'bg-emerald-950 text-emerald-300 border-emerald-800',
  meal: 'bg-yellow-950 text-yellow-300 border-yellow-800',
  travel: 'bg-blue-950 text-blue-300 border-blue-800',
  lodging: 'bg-purple-950 text-purple-300 border-purple-800',
  meeting: 'bg-slate-700 text-slate-200 border-slate-600',
  other: 'bg-red-950 text-red-300 border-red-800',
};

export default function Itinerary() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [events, setEvents] = useState<TripEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsubs = [
      subscribeConfig(setConfig),
      subscribeTrips(setTrips),
      subscribeRounds(setRounds),
      subscribeTripEvents(setEvents),
    ];
    setLoaded(true);
    return () => unsubs.forEach((u) => u());
  }, []);

  const { selectedTripId, selectedTrip, hasUnassignedRounds, selectTrip } = useTripSelection({
    trips,
    rounds,
    config,
    ready: loaded,
  });
  const tripEvents = useMemo(
    () => events.filter((event) => event.tripId === selectedTripId).sort((a, b) => `${a.date} ${a.time ?? ''}`.localeCompare(`${b.date} ${b.time ?? ''}`)),
    [events, selectedTripId]
  );
  const groupedEvents = groupEventsByDate(tripEvents);

  return (
    <Layout
      backgroundUrl={tripBackgroundUrl(selectedTrip)}
      trips={trips}
      selectedTripId={selectedTripId}
      hasUnassignedRounds={hasUnassignedRounds}
      onTripChange={selectTrip}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black">Itinerary</h1>
          <p className="mt-1 text-sm text-slate-400">Daily plan, logistics, and reminders for the selected trip.</p>
        </div>

        {groupedEvents.length === 0 ? (
          <div className="card py-10 text-center text-slate-400">
            <div className="text-4xl mb-3">📍</div>
            <p className="font-semibold text-white">No plans posted yet.</p>
            <p className="mt-1 text-sm">The trip planner can add calendar items in Admin.</p>
          </div>
        ) : (
          groupedEvents.map(([date, dayEvents]) => (
            <section key={date} className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-bold">{formatEventDate(date)}</h2>
                <span className="text-xs text-slate-500">{dayEvents.length} item{dayEvents.length === 1 ? '' : 's'}</span>
              </div>
              <div className="space-y-3">
                {dayEvents.map((event) => (
                  <article key={event.id} className="card border-l-4" style={{ borderLeftColor: categoryColor(event.category) }}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded border px-2 py-0.5 text-xs font-bold ${CATEGORY_STYLE[event.category]}`}>
                        {event.category}
                      </span>
                      {event.time && <span className="text-sm font-bold text-white">{formatTime(event.time)}</span>}
                    </div>
                    <h3 className="mt-2 text-xl font-black">{event.title}</h3>
                    {event.location && <p className="mt-1 text-sm font-semibold text-emerald-300">{event.location}</p>}
                    {event.notes && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{event.notes}</p>}
                  </article>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </Layout>
  );
}

function groupEventsByDate(events: TripEvent[]): Array<[string, TripEvent[]]> {
  const groups = new Map<string, TripEvent[]>();
  for (const event of events) {
    groups.set(event.date, [...(groups.get(event.date) ?? []), event]);
  }
  return Array.from(groups.entries());
}

function categoryColor(category: TripEventCategory) {
  const colors: Record<TripEventCategory, string> = {
    golf: '#10b981',
    meal: '#facc15',
    travel: '#60a5fa',
    lodging: '#c084fc',
    meeting: '#94a3b8',
    other: '#f87171',
  };
  return colors[category];
}

function formatEventDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(time: string) {
  const [hoursRaw, minutes] = time.split(':').map(Number);
  if (!Number.isFinite(hoursRaw) || !Number.isFinite(minutes)) return time;
  const suffix = hoursRaw >= 12 ? 'PM' : 'AM';
  const hours = hoursRaw % 12 || 12;
  return `${hours}:${String(minutes).padStart(2, '0')} ${suffix}`;
}
