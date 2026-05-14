import { Link, useLocation } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <header className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">⛳</span>
          <span className="text-xl font-bold text-white tracking-wide">MAYDAY</span>
        </Link>
        <div className="flex gap-3 text-sm">
          <Link
            to="/"
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              pathname === '/'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Scores
          </Link>
          <Link
            to="/admin"
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              pathname === '/admin'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Admin
          </Link>
        </div>
      </header>
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">{children}</main>
    </div>
  );
}
