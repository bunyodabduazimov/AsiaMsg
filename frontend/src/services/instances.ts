import { http } from './http';
import type { CreateInstanceInput, Instance, UpdatePhoneNumberInput } from '@/types/instance';

export const instancesApi = {
  async list() {
    const { data } = await http.get<Instance[]>('/instances');
    return data;
  },
  async create(input: CreateInstanceInput) {
    const { data } = await http.post<Instance>('/instances', input);
    return data;
  },
  async get(instanceId: string) {
    const { data } = await http.get<Instance>(`/instances/${instanceId}`);
    return data;
  },
  async connect(instanceId: string) {
    const { data } = await http.post<Instance>(`/instances/${instanceId}/connect`);
    return data;
  },
  async disconnect(instanceId: string) {
    const { data } = await http.post<Instance>(`/instances/${instanceId}/disconnect`);
    return data;
  },
  async updatePhoneNumber(instanceId: string, input: UpdatePhoneNumberInput) {
    const { data } = await http.patch<Instance>(`/instances/${instanceId}/phone-number`, input);
    return data;
  }
};
