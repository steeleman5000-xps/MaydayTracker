import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import type { AppConfig, Round, Trip } from '../types';
import { subscribeConfig, subscribeRounds, subscribeTrips } from '../lib/db';
import { tripBackgroundUrl } from '../lib/tripAssets';
import { useTripSelection } from '../lib/tripSelection';

const DAILY_ROASTS = [
  'Today is a great day to find out whose handicap is fiction and whose short game belongs in witness protection.',
  'Stretch the hamstrings, hydrate aggressively, and remember: the cart GPS cannot save you from being soft.',
  'May the drives be long, the putts be short, and the excuses be so pathetic they deserve their own tee time.',
  'Somebody is going to talk like a plus handicap and chip like a man trying to kill a snake with a shovel.',
  'The only thing more fragile than the greens today is the ego of the guy who packed three polos and no swing.',
  'Play fast, gamble responsibly, and never trust a man who says he found something on YouTube last night.',
  'Today’s forecast: scattered birdies, heavy beer pressure, and a 100% chance someone blames the rental clubs.',
];

const SIDE_QUESTS = [
  'Snake Watch: track every three-putt and make the final holder buy the first round.',
  'Press Alert: any match two down after nine gets one emergency chance to make bad decisions louder.',
  'Golden Quote: capture the dumbest sentence said on a tee box and crown it at dinner.',
  'Cart DJ Immunity: lowest net score controls the playlist for the next ride.',
];

export default function Landing() {
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
  const roast = DAILY_ROASTS[getDayIndex(DAILY_ROASTS.length)];
  const sideQuest = SIDE_QUESTS[getDayIndex(SIDE_QUESTS.length, 3)];
  const tripRounds = useMemo(
    () => selectedTripId ? rounds.filter((round) => round.tripId === selectedTripId) : rounds,
    [rounds, selectedTripId]
  );
  const backgroundUrl = tripBackgroundUrl(selectedTrip);

  return (
    <Layout
      backgroundUrl={backgroundUrl}
      trips={trips}
      selectedTripId={selectedTripId}
      hasUnassignedRounds={hasUnassignedRounds}
      onTripChange={selectTrip}
    >
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-xl border border-emerald-800 bg-slate-950 p-6 shadow-2xl sm:p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-yellow-300 to-red-500" />
          <div className="max-w-xl">
            <div className="text-xs font-bold uppercase tracking-[0.32em] text-emerald-300">
              {selectedTrip ? `${selectedTrip.year} ${selectedTrip.name}` : 'Mayday Classic'}
            </div>
            <h1 className="mt-3 text-4xl font-black leading-tight text-white sm:text-6xl">
              Mayday Golf Championship
            </h1>
            <p className="mt-4 text-lg font-semibold leading-snug text-yellow-100">
              {roast}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/scores" className="btn-primary">Live Scores</Link>
              <Link to="/scorecards" className="btn-secondary">Print Scorecards</Link>
              <Link to="/itinerary" className="btn-secondary">Trip Itinerary</Link>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <InfoCard label="Rounds" value={String(tripRounds.length)} detail="loaded for this trip" />
          <InfoCard label="Side Quest" value="Daily" detail={sideQuest} to="/games" />
          <InfoCard label="Store" value="Mayday Gear" detail="hats, polos, and bad decisions" to="/merch" />
        </section>

        <section className="card">
          <h2 className="mb-3 text-lg font-bold">Trip Command Center</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link to="/players" className="rounded-lg border border-slate-700 bg-slate-900 p-4 hover:border-emerald-600">
              <div className="text-sm font-bold text-emerald-300">Player Board</div>
              <p className="mt-1 text-sm text-slate-400">Records, net scoring, wagers, and trip-long bragging rights.</p>
            </Link>
            <Link to="/admin" className="rounded-lg border border-slate-700 bg-slate-900 p-4 hover:border-emerald-600">
              <div className="text-sm font-bold text-emerald-300">Planner Tools</div>
              <p className="mt-1 text-sm text-slate-400">Rounds, matchups, scorecards, itinerary, teams, and captains.</p>
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function getDayIndex(length: number, salt = 0) {
  const day = Math.floor(Date.now() / 86_400_000);
  return (day + salt) % length;
}

function InfoCard({ label, value, detail, to }: { label: string; value: string; detail: string; to?: string }) {
  const content = (
    <div className="card h-full">
      <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{detail}</div>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}
