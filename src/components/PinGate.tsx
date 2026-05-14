import { useState } from 'react';

interface Props {
  children: React.ReactNode;
}

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN ?? 'mayday2025';
const SESSION_KEY = 'mayday_admin_authed';

export default function PinGate({ children }: Props) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (authed) return <>{children}</>;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setAuthed(true);
    } else {
      setError(true);
      setPin('');
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="card w-full max-w-xs">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">⛳</div>
          <h1 className="text-xl font-bold">Admin Access</h1>
          <p className="text-slate-400 text-sm mt-1">Enter the admin PIN</p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            type="password"
            className="input text-center text-xl tracking-widest"
            placeholder="••••••"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false); }}
            autoFocus
          />
          {error && <p className="text-red-400 text-sm text-center">Incorrect PIN</p>}
          <button type="submit" className="btn-primary">Enter</button>
        </form>
      </div>
    </div>
  );
}
