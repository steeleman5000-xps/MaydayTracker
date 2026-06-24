import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { User } from 'firebase/auth';
import Layout from '../components/Layout';
import type { AppConfig, Player } from '../types';
import { subscribeConfig, subscribePlayers, updatePlayer } from '../lib/db';
import { createAccount, signIn, signOutUser, subscribeAuth } from '../lib/auth';

type Mode = 'signin' | 'create';

export default function MyPlayer() {
  const [user, setUser] = useState<User | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loaded, setLoaded] = useState({ auth: false, config: false, players: false });
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handicap, setHandicap] = useState(0);
  const [teebox, setTeebox] = useState('White');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubs = [
      subscribeAuth((nextUser) => {
        setUser(nextUser);
        setEmail(nextUser?.email ?? '');
        setLoaded((prev) => ({ ...prev, auth: true }));
      }),
      subscribeConfig((cfg) => {
        setConfig(cfg);
        setLoaded((prev) => ({ ...prev, config: true }));
      }),
      subscribePlayers((nextPlayers) => {
        setPlayers(nextPlayers);
        setLoaded((prev) => ({ ...prev, players: true }));
      }),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  const player = useMemo(() => {
    if (!user) return null;
    const userEmail = user.email?.toLowerCase();
    return (
      players.find((p) => p.authUid === user.uid) ??
      players.find((p) => p.email?.toLowerCase() === userEmail) ??
      null
    );
  }, [players, user]);

  useEffect(() => {
    if (!player) return;
    setHandicap(player.handicap);
    setTeebox(player.teebox ?? 'White');
  }, [player]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await createAccount(email, password);
      }
    } catch (err) {
      setError(authMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!player || !user) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await updatePlayer(player.id, {
        handicap: Number(handicap),
        teebox,
        email: user.email?.toLowerCase() ?? player.email ?? '',
        authUid: user.uid,
      });
      setMessage('Profile updated. Admin can still override these values if needed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOutUser();
    setPassword('');
    setMessage(null);
    setError(null);
  }

  const loading = !loaded.auth || !loaded.config || !loaded.players;
  const teamName = player?.teamId === 'A' ? config?.teamAName ?? 'Team A' : config?.teamBName ?? 'Team B';

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black">My Player</h1>
          <p className="text-slate-400 text-sm mt-1">
            Sign in with the email your admin assigned to your player profile.
          </p>
        </div>

        {!user ? (
          <div className="card">
            <div className="flex gap-2 mb-4">
              {(['signin', 'create'] as Mode[]).map((nextMode) => (
                <button
                  key={nextMode}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
                    mode === nextMode ? 'bg-emerald-700 text-white' : 'bg-slate-700 text-slate-300'
                  }`}
                  onClick={() => { setMode(nextMode); setError(null); }}
                >
                  {nextMode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            <form onSubmit={handleAuth} className="space-y-3">
              <div>
                <label className="label">Email</label>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  minLength={6}
                  required
                />
              </div>
              <button className="btn-primary w-full" disabled={saving}>
                {saving ? 'Working...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
          </div>
        ) : player ? (
          <div className="card">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-bold">{player.name}</h2>
                <p className="text-slate-400 text-sm">{teamName} · {user.email}</p>
              </div>
              <button className="btn-secondary text-sm" onClick={handleSignOut}>Sign Out</button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="label">Handicap</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    max="54"
                    step="0.1"
                    value={handicap}
                    onChange={(e) => setHandicap(Number(e.target.value))}
                  />
                </div>
                <div className="flex-1">
                  <label className="label">Tees</label>
                  <select className="input" value={teebox} onChange={(e) => setTeebox(e.target.value)}>
                    <option>White</option>
                    <option>Blue</option>
                    <option>Black</option>
                    <option>Gold</option>
                    <option>Red</option>
                  </select>
                </div>
              </div>
              <button className="btn-primary w-full" disabled={saving}>
                {saving ? 'Saving...' : 'Save My Handicap & Tees'}
              </button>
            </form>
            <Link to="/solo" className="btn-secondary mt-3 block text-center">
              Open Solo Round Tracker
            </Link>
          </div>
        ) : (
          <div className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold">No Player Match</h2>
                <p className="text-slate-400 text-sm mt-1">
                  You are signed in as {user.email}, but no player has that email yet.
                </p>
                <p className="text-slate-500 text-xs mt-2">
                  Ask an admin to add that email to your player row in Admin - Players.
                </p>
              </div>
              <button className="btn-secondary text-sm" onClick={handleSignOut}>Sign Out</button>
            </div>
          </div>
        )}

        {message && (
          <div className="rounded-lg border border-emerald-800 bg-emerald-950 px-3 py-2 text-sm text-emerald-200">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-800 bg-red-950 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}
      </div>
    </Layout>
  );
}

function authMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : 'Authentication failed';
  if (message.includes('auth/invalid-credential')) return 'Email or password is incorrect.';
  if (message.includes('auth/email-already-in-use')) return 'That email already has an account. Use Sign In instead.';
  if (message.includes('auth/weak-password')) return 'Password must be at least 6 characters.';
  if (message.includes('auth/operation-not-allowed')) return 'Email/password sign-in is not enabled in Firebase yet.';
  return message;
}
