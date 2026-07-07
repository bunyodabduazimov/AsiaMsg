import type { Instance, InstanceSetting, InstanceSession, InstanceStatus } from '@prisma/client';

export type InstanceView = Instance & {
  session: InstanceSession | null;
  settings: InstanceSetting | null;
};

export type CreateInstanceInput = {
  name: string;
  phoneNumber?: string | null;
};

export type UpdateInstanceInput = {
  name?: string;
  phoneNumber?: string | null;
};

export type UpdatePhoneNumberInput = {
  phoneNumber: string | null;
};

export type UpdateInstanceStatusInput = {
  status: InstanceStatus;
  qrCode?: string | null;
};

export type InstanceRuntimeSnapshot = {
  instanceId: string;
  status: InstanceStatus;
  qrCode: string | null;
};
