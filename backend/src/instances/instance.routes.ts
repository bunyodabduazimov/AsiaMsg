import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  clearInstanceData,
  connectInstance,
  createInstance,
  deleteInstance,
  disconnectInstance,
  getInstance,
  getInstanceMe,
  getInstanceApiKeyInfo,
  getInstanceQr,
  getInstanceQrCode,
  getInstanceSettings,
  getInstanceStatus,
  listInstances,
  logoutInstance,
  restartInstance,
  saveInstanceSettings,
  sendInstanceWebhookTest,
  regenerateInstanceApiKey,
  revokeInstanceApiKey,
  updateInstance,
  updateInstanceSettings,
  updateInstanceStatus,
  updateInstancePhoneNumber
} from './instance.controller';

export const instanceRouter = Router();

instanceRouter.use(authenticate);
instanceRouter.get('/', listInstances);
instanceRouter.post('/', createInstance);
instanceRouter.get('/:instanceId', getInstance);
instanceRouter.patch('/:instanceId', updateInstance);
instanceRouter.patch('/:instanceId/phone-number', updateInstancePhoneNumber);
instanceRouter.patch('/:instanceId/settings', updateInstanceSettings);
instanceRouter.patch('/:instanceId/status', updateInstanceStatus);
instanceRouter.post('/:instanceId/connect', connectInstance);
instanceRouter.post('/:instanceId/disconnect', disconnectInstance);
instanceRouter.post('/:instanceId/webhook-test', sendInstanceWebhookTest);
instanceRouter.delete('/:instanceId', deleteInstance);
// --- docs endpoints ---
instanceRouter.get('/:instanceId/qr', getInstanceQr);
instanceRouter.get('/:instanceId/status', getInstanceStatus);
instanceRouter.get('/:instanceId/qrcode', getInstanceQrCode);
instanceRouter.get('/:instanceId/me', getInstanceMe);
instanceRouter.get('/:instanceId/settings', getInstanceSettings);
instanceRouter.post('/:instanceId/logout', logoutInstance);
instanceRouter.post('/:instanceId/restart', restartInstance);
instanceRouter.post('/:instanceId/settings', saveInstanceSettings);
instanceRouter.post('/:instanceId/clear', clearInstanceData);
instanceRouter.get('/:instanceId/api-key', getInstanceApiKeyInfo);
instanceRouter.post('/:instanceId/api-key/regenerate', regenerateInstanceApiKey);
instanceRouter.delete('/:instanceId/api-key', revokeInstanceApiKey);
