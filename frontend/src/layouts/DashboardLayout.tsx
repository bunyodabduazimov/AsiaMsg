import type { PropsWithChildren } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';

export const DashboardLayout = ({ children }: PropsWithChildren) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(40,211,154,0.14),_transparent_28%),radial-gradient(circle_at_80%_10%,_rgba(255,181,109,0.10),_transparent_18%),linear-gradient(180deg,#09101d,#111c31_60%,#09101d)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-4 lg:px-8">
        <aside className="hidden w-72 shrink-0 rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl lg:block">
          <Link to="/" className="inline-flex items-center gap-3 text-lg font-semibold tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-mint-400/10 text-mint-400 ring-1 ring-mint-400/20">
              A
            </span>
            AsiaMsg
          </Link>
          <nav className="mt-8 space-y-2 text-sm">
            {[
              ['Dashboard', '/'],
              ['Instances', '/instances'],
              ['Tokens', '/tokens'],
              ['Webhooks', '/webhooks'],
              ['Logs', '/logs']
            ].map(([label, to]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    'block rounded-2xl px-4 py-3 transition',
                    isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5'
                  ].join(' ')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          <header className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Signed in as</p>
              <h2 className="text-lg font-semibold">{user?.name}</h2>
              <p className="text-sm text-slate-400">{user?.email}</p>
            </div>
            <Button variant="secondary" onClick={() => void logout()}>
              Sign out
            </Button>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
};
