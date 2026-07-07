import type { PropsWithChildren } from 'react';

export const AuthLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="auth-shell min-h-screen overflow-hidden">
      <div className="auth-bg" aria-hidden="true">
        <span className="auth-wave auth-wave--top" />
        <span className="auth-wave auth-wave--middle" />
        <span className="auth-wave auth-wave--bottom" />
        <span className="auth-glow auth-glow--left" />
        <span className="auth-glow auth-glow--right" />
      </div>

      <div className="relative grid min-h-screen place-items-center px-4 py-10">
        <div className="w-full max-w-[460px] animate-fade">
          <div className="mb-5 text-center">
          <div className="mx-auto mb-4 inline-flex h-11 items-center rounded-full border border-white/10 bg-white/6 px-4 text-[11px] font-medium uppercase tracking-[0.34em] text-slate-300 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-xl">
              AsiaMsg SaaS
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">AsiaMsg</h1>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};
