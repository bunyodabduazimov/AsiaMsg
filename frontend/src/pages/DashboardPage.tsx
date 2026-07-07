import { Card } from '@/components/ui/Card';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';

const stats = [
  { label: 'Instances', value: '0', hint: 'Ready for onboarding' },
  { label: 'Connected', value: '0', hint: 'Waiting for QR' },
  { label: 'Messages today', value: '0', hint: 'No traffic yet' },
  { label: 'Webhooks', value: '0', hint: 'Not configured' }
];

export const DashboardPage = () => {
  return (
    <DashboardLayout>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(item => (
          <Card key={item.label}>
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className="mt-3 text-4xl font-semibold tracking-tight">{item.value}</p>
            <p className="mt-2 text-sm text-slate-500">{item.hint}</p>
          </Card>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Control plane</h3>
              <p className="mt-1 text-sm text-slate-400">
                This shell is ready for instances, sessions, message history, and webhook events.
              </p>
            </div>
            <div className="rounded-full bg-mint-400/10 px-3 py-1 text-xs font-semibold text-mint-400">
              Architecture ready
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/instances"
              className="inline-flex items-center justify-center rounded-xl bg-mint-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-glow transition hover:bg-mint-400"
            >
              Open instances
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              'Create instances',
              'Fetch QR code',
              'Track status changes',
              'Monitor reconnects',
              'Send messages',
              'Audit logs'
            ].map(item => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-4 text-sm text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold">Instance status legend</h3>
          <div className="mt-5 space-y-3 text-sm">
            {[
              ['Waiting QR', 'QR code has not been scanned yet'],
              ['Connecting', 'Baileys is initializing'],
              ['Connected', 'Session is live'],
              ['Disconnected', 'Manual disconnect or dropped session'],
              ['Reconnecting', 'Automatic recovery in progress']
            ].map(([label, description]) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <span className="font-medium text-slate-100">{label}</span>
                <span className="max-w-[220px] text-right text-slate-400">{description}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </DashboardLayout>
  );
};
