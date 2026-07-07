export type InstanceStatus =
  | 'WAITING_QR'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'RECONNECTING';

export type InstanceSession = {
  id: string;
  instanceId: string;
  authState: unknown;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type InstanceSetting = {
  id: string;
  instanceId: string;
  webhookUrl: string | null;
  webhookSecret: string | null;
  autoReconnect: boolean;
  storeIncomingMessages: boolean;
  storeOutgoingMessages: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Instance = {
  id: string;
  userId: string;
  name: string;
  phoneNumber: string | null;
  status: InstanceStatus;
  qrCode: string | null;
  createdAt: string;
  updatedAt: string;
  session: InstanceSession | null;
  settings: InstanceSetting | null;
};

export type CreateInstanceInput = {
  name: string;
  phoneNumber?: string;
};

export type UpdatePhoneNumberInput = {
  phoneNumber: string | null;
};
