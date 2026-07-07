import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

const statusText: Record<Instance['status'], string> = {
  WAITING_QR: 'Waiting QR',
  CONNECTING: 'Connecting',
  CONNECTED: 'Connected',
  DISCONNECTED: 'Disconnected',
  RECONNECTING: 'Reconnecting'
};

export const InstanceDetailPage = () => {
  const { instanceId } = useParams();
  const navigate = useNavigate();
  const [instance, setInstance] = useState<Instance | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (!instanceId) {
      return;
    }

    const load = async () => {
      const data = await instancesApi.get(instanceId);
      setInstance(data);
      setPhoneNumber(data.phoneNumber ?? '');
    };

    void load();
  }, [instanceId]);

  useEffect(() => {
    if (!instanceId) {
      return;
    }

    const socket = getSocket();
    const onStatus = (payload: { instanceId: string; status: Instance['status'] }) => {
      if (payload.instanceId === instanceId) {
        setInstance(current => (current ? { ...current, status: payload.status } : current));
      }
    };

    const onQr = (payload: { instanceId: string; qrCode: string }) => {
      if (payload.instanceId === instanceId) {
        setInstance(current => (current ? { ...current, status: 'WAITING_QR', qrCode: payload.qrCode } : current));
      }
    };

    socket.on('instance:status', onStatus);
    socket.on('instance:qr', onQr);

    return () => {
      socket.off('instance:status', onStatus);
      socket.off('instance:qr', onQr);
    };
  }, [instanceId]);

  if (!instanceId) {
    return null;
  }

  if (!instance) {
    return (
      <DashboardLayout>
        <Card className="border-white/10 bg-white/5 text-slate-400">Loading instance...</Card>
      </DashboardLayout>
    );
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const updated = await instancesApi.updatePhoneNumber(instance.id, {
        phoneNumber: phoneNumber.trim() ? phoneNumber.trim() : null
      });
      setInstance(updated);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const updated = await instancesApi.connect(instance.id);
      setInstance(updated);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsConnecting(true);
    try {
      const updated = await instancesApi.disconnect(instance.id);
      setInstance(updated);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.05))]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <Button
                type="button"
                variant="ghost"
                className="mb-4 px-0 text-slate-400 hover:bg-transparent"
                onClick={() => navigate('/instances')}
              >
                ← Back to instances
              </Button>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Instance</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">{instance.name}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Badge tone={statusTone[instance.status]}>{statusText[instance.status]}</Badge>
                <span className="text-sm text-slate-400">
                  Created {new Date(instance.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="secondary" onClick={() => void handleConnect()} disabled={isConnecting}>
                {isConnecting ? 'Connecting...' : 'Connect'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => void handleDisconnect()} disabled={isConnecting}>
                Disconnect
              </Button>
            </div>
          </div>

          <form className="mt-8 grid gap-4 md:grid-cols-[1fr_auto]" onSubmit={handleSave}>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Phone number</label>
              <Input
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="+998901234567"
              />
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save number'}
            </Button>
          </form>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ['Status', statusText[instance.status]],
              ['Phone', instance.phoneNumber ?? 'Not set'],
              ['Auto reconnect', instance.settings?.autoReconnect ? 'Enabled' : 'Disabled']
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</p>
                <p className="mt-2 text-base font-medium text-slate-100">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold">Connection timeline</h2>
            <div className="mt-4 space-y-3">
              {[
                'Create instance',
                'Press Connect',
                'Scan the QR code',
                'Instance switches to Connected',
                'Session restores automatically after restart'
              ].map(step => (
                <div key={step} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/25 px-4 py-3 text-sm text-slate-300">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-mint-400/10 text-xs font-semibold text-mint-400">
                    •
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">QR</p>
          <h2 className="mt-2 text-xl font-semibold">Scan to connect WhatsApp</h2>

          {instance.qrCode ? (
            <div className="mt-6 rounded-3xl bg-white p-4">
              <img
                src={instance.qrCode}
                alt="WhatsApp QR code"
                className="aspect-square w-full rounded-2xl object-contain"
              />
            </div>
          ) : (
            <div className="mt-6 grid aspect-square place-items-center rounded-3xl border border-dashed border-white/10 bg-slate-950/30 px-8 text-center text-sm text-slate-400">
              QR will appear here after pressing Connect.
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-mint-400/20 bg-mint-400/10 px-4 py-4 text-sm leading-6 text-slate-300">
            Keep this page open. When the QR is generated, it will also stream in live over Socket.IO.
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};
