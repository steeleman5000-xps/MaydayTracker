import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import type { AppConfig, Round, Trip } from '../types';
import { subscribeConfig, subscribeRounds, subscribeTrips } from '../lib/db';
import { tripBackgroundUrl } from '../lib/tripAssets';
import { useTripSelection } from '../lib/tripSelection';

const GAMES = [
  {
    title: 'Nassau Press Watch',
    tag: 'Match Bet',
    body: 'Track front, back, and overall bets. If a side is getting worked, allow one press and make the panic official.',
  },
  {
    title: 'Skins Carryover',
    tag: 'Side Pot',
    body: 'Each hole is worth a skin. Ties carry forward until someone finally stops choking with witnesses present.',
  },
  {
    title: 'Quote Board',
    tag: 'Dinner Award',
    body: 'Capture the worst tee-box logic, cart-path lies, and post-round excuses. Read the winner at dinner.',
  },
  {
    title: 'Shame Trophy',
    tag: 'Annual Hardware',
    body: 'Award it for the most catastrophic combination of confidence and execution. No appeals. No mercy.',
  },
];

const AWARDS = [
  'Most expensive swing with the cheapest result',
  'Best use of “I never do that” after doing exactly that',
  'Cart path philosopher of the day',
  'Most fraudulent warm-up session',
  'Best putt made after already giving up emotionally',
];

export default function Games() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsubs = [
      subscribeConfig(setConfig),
      subscribeTrips(setTrips),
      subscribeRounds(setRounds),
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
  const award = AWARDS[Math.floor(Date.now() / 86_400_000) % AWARDS.length];

  return (
    <Layout
      backgroundUrl={tripBackgroundUrl(selectedTrip)}
      trips={trips}
      selectedTripId={selectedTripId}
      hasUnassignedRounds={hasUnassignedRounds}
      onTripChange={selectTrip}
    >
      <div className="space-y-6">
        <section className="card">
          <div className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-300">Games & Awards</div>
          <h1 className="mt-2 text-3xl font-black">Keep the trip loud after the score is settled.</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Side games, dinner awards, and daily prompts give every group something to talk about even when the official match is over by the 13th hole.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          {GAMES.map((game) => (
            <article key={game.title} className="card">
              <span className="rounded bg-slate-700 px-2 py-0.5 text-xs font-bold text-slate-200">{game.tag}</span>
              <h2 className="mt-3 text-xl font-black">{game.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{game.body}</p>
            </article>
          ))}
        </section>

        <section className="rounded-xl border border-yellow-700 bg-yellow-950/70 p-5">
          <div className="text-xs font-bold uppercase tracking-widest text-yellow-300">Tonight's Award</div>
          <div className="mt-2 text-2xl font-black text-white">{award}</div>
          <p className="mt-2 text-sm text-yellow-100/80">Nominate loudly, vote unfairly, and make the winner hold it for a photo.</p>
        </section>
      </div>
    </Layout>
  );
}
