import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  connectInstance,
  createInstance,
  deleteInstance,
  disconnectInstance,
  getInstance,
  getInstanceQr,
  listInstances,
  sendInstanceWebhookTest,
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
instanceRouter.get('/:instanceId/qr', getInstanceQr);
instanceRouter.delete('/:instanceId', deleteInstance);
