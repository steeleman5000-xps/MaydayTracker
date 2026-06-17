import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import type { AppConfig, Round, Trip } from '../types';
import { subscribeConfig, subscribeRounds, subscribeTrips } from '../lib/db';
import { DEFAULT_LOGO_URL, tripBackgroundUrl } from '../lib/tripAssets';
import { useTripSelection } from '../lib/tripSelection';

const PRODUCTS = [
  {
    name: 'Mayday Rope Hat',
    price: '$34',
    description: 'White rope hat, black logo, built for talking trash from a cart you did not pay enough attention to.',
    swatch: 'bg-white',
  },
  {
    name: 'Champion Dinner Polo',
    price: '$68',
    description: 'Clean tournament polo for the guy who wants to look expensive while laying sod over a wedge.',
    swatch: 'bg-emerald-700',
  },
  {
    name: 'Shame Towel',
    price: '$22',
    description: 'Clip it to the bag of whoever makes triple after saying the hole fits their eye.',
    swatch: 'bg-slate-950',
  },
  {
    name: 'Mayday Quarter Zip',
    price: '$84',
    description: 'For cold mornings, late-night standings audits, and pretending you have a warm-up routine.',
    swatch: 'bg-stone-200',
  },
];

export default function Merch() {
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

  return (
    <Layout
      backgroundUrl={tripBackgroundUrl(selectedTrip)}
      trips={trips}
      selectedTripId={selectedTripId}
      hasUnassignedRounds={hasUnassignedRounds}
      onTripChange={selectTrip}
    >
      <div className="space-y-6">
        <section className="overflow-hidden rounded-xl border border-slate-700 bg-white text-slate-950">
          <div className="grid gap-6 p-6 sm:grid-cols-[1fr_13rem] sm:p-8">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700">Mayday Pro Shop</div>
              <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Wear the bad decisions.</h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                A future merch hub for trip hats, polos, towels, and annual champion gear. For now, this is a polished product board you can use to decide what to order through Printful, Shopify, Custom Ink, or a local shop.
              </p>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-slate-100 p-5">
              <img src={DEFAULT_LOGO_URL} alt="Mayday Golf Classic" className="max-h-40 object-contain" />
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {PRODUCTS.map((product) => (
            <article key={product.name} className="card overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black">{product.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{product.description}</p>
                </div>
                <div className={`h-12 w-12 shrink-0 rounded-full border-4 border-slate-600 ${product.swatch}`} />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-700 pt-3">
                <span className="text-lg font-black text-emerald-300">{product.price}</span>
                <span className="rounded-lg border border-slate-600 px-3 py-1 text-xs font-bold text-slate-300">Concept</span>
              </div>
            </article>
          ))}
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Next Commerce Step</h2>
          <p className="mt-2 text-sm text-slate-400">
            Best path: upload the transparent Mayday logo to a print-on-demand provider, create product links, then replace these concept cards with real checkout URLs. The app can stay the trip hub while orders are handled by a dedicated merch platform.
          </p>
        </section>
      </div>
    </Layout>
  );
}
