import type { Instance, InstanceSetting, InstanceSession, InstanceStatus } from '@prisma/client';
import type { updateInstanceSettingsSchema } from './instance.schemas';
import type { z } from 'zod';

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

export type UpdateInstanceSettingsInput = z.infer<typeof updateInstanceSettingsSchema>;

export type InstanceRuntimeSnapshot = {
  instanceId: string;
  status: InstanceStatus;
  qrCode: string | null;
};
