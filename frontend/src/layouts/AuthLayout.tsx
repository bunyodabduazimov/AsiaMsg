import type { PropsWithChildren } from 'react';

export const AuthLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="min-h-screen bg-hero-grid">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center px-4 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="mb-10 max-w-2xl lg:mb-0">
          <div className="mb-6 inline-flex rounded-full border border-mint-400/25 bg-mint-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-mint-400">
            AsiaMsg SaaS
          </div>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
            Control WhatsApp instances with a calm, scalable command center.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 md:text-lg">
            A modern platform for multi-instance WhatsApp automation, message tracking,
            webhooks, and resilient session recovery.
          </p>
        </div>

        <div className="animate-fade">{children}</div>
      </div>
    </div>
  );
};
