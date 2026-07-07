import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { instancesApi } from '@/services/instances';
import { getSocket } from '@/services/socket';
import type { Instance } from '@/types/instance';

const statusTone: Record<Instance['status'], 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  WAITING_QR: 'warning',
  CONNECTING: 'info',
  CONNECTED: 'success',
  DISCONNECTED: 'danger',
  RECONNECTING: 'warning'
};

const statusLabel: Record<Instance['status'], string> = {
  WAITING_QR: 'Waiting QR',
  CONNECTING: 'Connecting',
  CONNECTED: 'Connected',
  DISCONNECTED: 'Disconnected',
  RECONNECTING: 'Reconnecting'
};

export const InstancesPage = () => {
  const [items, setItems] = useState<Instance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await instancesApi.list();
      setItems(data);
      setIsLoading(false);
    };

    void load();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const onStatus = (payload: { instanceId: string; status: Instance['status'] }) => {
      setItems(current =>
        current.map(item => (item.id === payload.instanceId ? { ...item, status: payload.status } : item))
      );
    };

    const onQr = (payload: { instanceId: string; qrCode: string }) => {
      setItems(current =>
        current.map(item =>
          item.id === payload.instanceId ? { ...item, status: 'WAITING_QR', qrCode: payload.qrCode } : item
        )
      );
    };

    socket.on('instance:status', onStatus);
    socket.on('instance:qr', onQr);

    return () => {
      socket.off('instance:status', onStatus);
      socket.off('instance:qr', onQr);
    };
  }, []);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreating(true);

    try {
      const created = await instancesApi.create({
        name,
        phoneNumber: phoneNumber || undefined
      });
      setItems(current => [created, ...current]);
      setName('');
      setPhoneNumber('');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))]">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Workspace</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">WhatsApp Instances</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                Create a separate instance for each WhatsApp number, then connect it with a QR scan.
              </p>
            </div>
            <Badge tone="info">{items.length} total</Badge>
          </div>

          <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end" onSubmit={handleCreate}>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Instance name</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Sales Bot" />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Phone number</label>
              <Input
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="+998901234567"
              />
            </div>
            <Button type="submit" disabled={isCreating || !name.trim()}>
              {isCreating ? 'Creating...' : 'Create instance'}
            </Button>
          </form>

          <div className="mt-8 space-y-3">
            {isLoading ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-slate-400">
                Loading instances...
              </div>
            ) : items.length ? (
              items.map(item => (
                <Link
                  key={item.id}
                  to={`/instances/${item.id}`}
                  className="block rounded-2xl border border-white/10 bg-slate-950/30 px-5 py-4 transition hover:border-mint-400/30 hover:bg-white/10"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-semibold">{item.name}</h3>
                        <Badge tone={statusTone[item.status]}>{statusLabel[item.status]}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">
                        {item.phoneNumber ?? 'No phone number set'}
                      </p>
                    </div>
                    <div className="text-sm text-slate-400">
                      Created {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-10 text-center text-sm text-slate-400">
                No instances yet. Create your first WhatsApp instance to begin.
              </div>
            )}
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="border-white/10 bg-white/5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Flow</p>
            <h2 className="mt-2 text-xl font-semibold">How QR connection works</h2>
            <div className="mt-5 space-y-4 text-sm text-slate-300">
              {[
                'Create an instance for one WhatsApp number.',
                'Open the detail screen and press Connect.',
                'Scan the QR code from the WhatsApp mobile app.',
                'The instance moves to Connected and stays persistent after restart.'
              ].map(step => (
                <div key={step} className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-4">
                  {step}
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-mint-400/20 bg-mint-400/10">
            <p className="text-xs uppercase tracking-[0.3em] text-mint-400">Realtime</p>
            <h2 className="mt-2 text-xl font-semibold">Status updates stream live</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              QR and status updates are pushed over Socket.IO, so the UI updates immediately when the instance changes.
            </p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};
