import type { PropsWithChildren } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';

export const DashboardLayout = ({ children }: PropsWithChildren) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(40,211,154,0.08),_transparent_28%),linear-gradient(180deg,#09101d,#111c31_60%,#09101d)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-4 lg:px-8">
        <aside className="hidden w-72 shrink-0 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl lg:block">
          <Link to="/" className="text-lg font-semibold tracking-tight">
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
          <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-400">Signed in as</p>
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
