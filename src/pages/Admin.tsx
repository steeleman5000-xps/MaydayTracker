import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import PinGate from '../components/PinGate';
import AdminPlayers from '../components/AdminPlayers';
import AdminRounds from '../components/AdminRounds';
import AdminMatchups from '../components/AdminMatchups';
import AdminTrips from '../components/AdminTrips';
import AdminItinerary from '../components/AdminItinerary';
import type { Player, Round, Matchup, AppConfig, Trip, TripEvent } from '../types';
import {
  subscribeConfig,
  subscribePlayers,
  subscribeRounds,
  subscribeMatchups,
  subscribeTrips,
  subscribeTripEvents,
  saveConfig,
} from '../lib/db';
import { tripBackgroundUrl } from '../lib/tripAssets';
import { useTripSelection } from '../lib/tripSelection';

type Tab = 'setup' | 'trips' | 'players' | 'rounds' | 'matchups' | 'itinerary';

export default function Admin() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [events, setEvents] = useState<TripEvent[]>([]);
  const [tab, setTab] = useState<Tab>('setup');
  const [configForm, setConfigForm] = useState<AppConfig>({
    teamAName: 'USA',
    teamBName: 'Europe',
    adminPin: import.meta.env.VITE_ADMIN_PIN ?? 'mayday2025',
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    const unsubs = [
      subscribeConfig((cfg) => {
        setConfig(cfg);
        if (cfg) setConfigForm(cfg);
      }),
      subscribeTrips(setTrips),
      subscribePlayers(setPlayers),
      subscribeRounds(setRounds),
      subscribeMatchups(setMatchups),
      subscribeTripEvents(setEvents),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    setSavingConfig(true);
    setConfigError(null);
    try {
      await saveConfig(configForm);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown Firebase error';
      setConfigError(`Settings could not be saved: ${message}`);
    } finally {
      setSavingConfig(false);
    }
  }

  const activeConfig = config ?? configForm;
  const { selectedTripId, selectedTrip, selectedRounds, hasUnassignedRounds, selectTrip } = useTripSelection({
    trips,
    rounds,
    config: activeConfig,
  });
  const activeTrip = selectedTrip ?? trips.find((trip) => trip.id === activeConfig.activeTripId);
  const selectedRoundIds = new Set(selectedRounds.map((round) => round.id));
  const selectedMatchups = matchups.filter((matchup) => selectedRoundIds.has(matchup.roundId));
  const selectedEvents = events.filter((event) => event.tripId === selectedTripId);
  const tripConfig = {
    ...activeConfig,
    teamAName: activeTrip?.teamAName || activeConfig.teamAName,
    teamBName: activeTrip?.teamBName || activeConfig.teamBName,
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'setup', label: 'Setup' },
    { id: 'trips', label: `Trips (${trips.length})` },
    { id: 'players', label: `Players (${players.length})` },
    { id: 'rounds', label: `Rounds (${selectedRounds.length})` },
    { id: 'matchups', label: `Matchups (${selectedMatchups.length})` },
    { id: 'itinerary', label: `Itinerary (${selectedEvents.length})` },
  ];

  return (
    <PinGate>
      <Layout
        backgroundUrl={tripBackgroundUrl(selectedTrip)}
        trips={trips}
        selectedTripId={selectedTripId}
        hasUnassignedRounds={hasUnassignedRounds}
        onTripChange={selectTrip}
      >
        <h1 className="text-2xl font-black mb-4">Admin</h1>

        <div className="flex gap-1 mb-6 bg-slate-800 rounded-xl p-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 px-2 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'bg-emerald-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'setup' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="font-semibold mb-3">Tournament Settings</h3>
              <form onSubmit={handleSaveConfig} className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="label text-blue-400">Team A Name</label>
                    <input
                      className="input border-blue-800"
                      value={configForm.teamAName}
                      onChange={(e) => setConfigForm({ ...configForm, teamAName: e.target.value })}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="label text-red-400">Team B Name</label>
                    <input
                      className="input border-red-800"
                      value={configForm.teamBName}
                      onChange={(e) => setConfigForm({ ...configForm, teamBName: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Current Trip</label>
                  <select
                    className="input"
                    value={configForm.activeTripId ?? ''}
                    onChange={(e) => setConfigForm({ ...configForm, activeTripId: e.target.value })}
                  >
                    <option value="">No trip selected</option>
                    {trips.map((trip) => (
                      <option key={trip.id} value={trip.id}>{trip.year} {trip.name}</option>
                    ))}
                  </select>
                  <p className="text-slate-500 text-xs mt-1">
                    Add trips in the Trips tab, then select the current one here.
                  </p>
                </div>
                <div>
                  <label className="label">Admin PIN</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="PIN for admin access"
                    value={configForm.adminPin}
                    onChange={(e) => setConfigForm({ ...configForm, adminPin: e.target.value })}
                  />
                  <p className="text-slate-500 text-xs mt-1">
                    Note: PIN change only affects the env var. Set VITE_ADMIN_PIN at build time.
                  </p>
                </div>
                <button type="submit" className="btn-primary w-full" disabled={savingConfig}>
                  {savingConfig ? 'Saving...' : config ? 'Update Settings' : 'Save Settings'}
                </button>
                {configError && (
                  <div className="rounded-lg border border-red-800 bg-red-950 px-3 py-2 text-sm text-red-200">
                    {configError}
                  </div>
                )}
              </form>
            </div>

            <div className="card text-sm text-slate-400 space-y-2">
              <p className="font-semibold text-white">Quick Stats</p>
              <p>Players: <span className="text-white">{players.length}</span> ({players.filter(p => p.teamId === 'A').length} vs {players.filter(p => p.teamId === 'B').length})</p>
              <p>Selected trip: <span className="text-white">{activeTrip ? `${activeTrip.year} ${activeTrip.name}` : 'None selected'}</span></p>
              {activeTrip && (
                <p>Trip teams: <span className="text-blue-400">{tripConfig.teamAName}</span> vs <span className="text-red-400">{tripConfig.teamBName}</span></p>
              )}
              <p>Trips: <span className="text-white">{trips.length}</span></p>
              <p>Rounds: <span className="text-white">{rounds.length}</span></p>
              <p>Matchups: <span className="text-white">{matchups.length}</span></p>
              <p>Itinerary items: <span className="text-white">{selectedEvents.length}</span></p>
            </div>

            <div className="card text-sm text-slate-400 space-y-2">
              <p className="font-semibold text-white">Workflow</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Add this year in <strong className="text-white">Trips</strong> and mark it current</li>
                <li>Set team names above</li>
                <li>Add all 20 players under <strong className="text-white">Players</strong></li>
                <li>Add 3 rounds with course names + stroke indexes under <strong className="text-white">Rounds</strong></li>
                <li>Create matchups (Team A vs Team B pairs) under <strong className="text-white">Matchups</strong></li>
                <li>Add lodging, meals, notes, and tee logistics under <strong className="text-white">Itinerary</strong></li>
                <li>Share the app URL — anyone can tap a match to enter scores live</li>
              </ol>
            </div>
          </div>
        )}

        {tab === 'trips' && (
          <AdminTrips trips={trips} players={players} config={activeConfig} />
        )}

        {tab === 'players' && (
          <AdminPlayers players={players} config={tripConfig} />
        )}

        {tab === 'rounds' && (
          <AdminRounds rounds={rounds} trips={trips} selectedTripId={selectedTripId} />
        )}

        {tab === 'matchups' && (
          <AdminMatchups rounds={selectedRounds} players={players} matchups={selectedMatchups} config={tripConfig} />
        )}

        {tab === 'itinerary' && (
          <AdminItinerary tripId={selectedTripId} events={selectedEvents} />
        )}
      </Layout>
    </PinGate>
  );
}
