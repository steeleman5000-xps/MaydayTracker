import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import PinGate from '../components/PinGate';
import AdminPlayers from '../components/AdminPlayers';
import AdminRounds from '../components/AdminRounds';
import AdminMatchups from '../components/AdminMatchups';
import type { Player, Round, Matchup, AppConfig } from '../types';
import { subscribeConfig, subscribePlayers, subscribeRounds, subscribeMatchups, saveConfig } from '../lib/db';

type Tab = 'setup' | 'players' | 'rounds' | 'matchups';

export default function Admin() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [tab, setTab] = useState<Tab>('setup');
  const [configForm, setConfigForm] = useState<AppConfig>({
    teamAName: 'USA',
    teamBName: 'Europe',
    adminPin: import.meta.env.VITE_ADMIN_PIN ?? 'mayday2025',
  });
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    const unsubs = [
      subscribeConfig((cfg) => {
        setConfig(cfg);
        if (cfg) setConfigForm(cfg);
      }),
      subscribePlayers(setPlayers),
      subscribeRounds(setRounds),
      subscribeMatchups(setMatchups),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    setSavingConfig(true);
    await saveConfig(configForm);
    setSavingConfig(false);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'setup', label: 'Setup' },
    { id: 'players', label: `Players (${players.length})` },
    { id: 'rounds', label: `Rounds (${rounds.length})` },
    { id: 'matchups', label: `Matchups (${matchups.length})` },
  ];

  return (
    <PinGate>
      <Layout>
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
                  {config ? 'Update Settings' : 'Save Settings'}
                </button>
              </form>
            </div>

            <div className="card text-sm text-slate-400 space-y-2">
              <p className="font-semibold text-white">Quick Stats</p>
              <p>Players: <span className="text-white">{players.length}</span> ({players.filter(p => p.teamId === 'A').length} vs {players.filter(p => p.teamId === 'B').length})</p>
              <p>Rounds: <span className="text-white">{rounds.length}</span></p>
              <p>Matchups: <span className="text-white">{matchups.length}</span></p>
            </div>

            <div className="card text-sm text-slate-400 space-y-2">
              <p className="font-semibold text-white">Workflow</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Set team names above</li>
                <li>Add all 20 players under <strong className="text-white">Players</strong></li>
                <li>Add 3 rounds with course names + stroke indexes under <strong className="text-white">Rounds</strong></li>
                <li>Create matchups (Team A vs Team B pairs) under <strong className="text-white">Matchups</strong></li>
                <li>Share the app URL — anyone can tap a match to enter scores live</li>
              </ol>
            </div>
          </div>
        )}

        {tab === 'players' && config && (
          <AdminPlayers players={players} config={config} />
        )}
        {tab === 'players' && !config && (
          <p className="text-slate-400">Save settings first.</p>
        )}

        {tab === 'rounds' && <AdminRounds rounds={rounds} />}

        {tab === 'matchups' && config && (
          <AdminMatchups rounds={rounds} players={players} matchups={matchups} config={config} />
        )}
        {tab === 'matchups' && !config && (
          <p className="text-slate-400">Save settings first.</p>
        )}
      </Layout>
    </PinGate>
  );
}
