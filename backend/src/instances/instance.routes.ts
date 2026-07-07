import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  connectInstance,
  createInstance,
  disconnectInstance,
  getInstance,
  getInstanceQr,
  listInstances,
  updateInstance,
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
instanceRouter.patch('/:instanceId/status', updateInstanceStatus);
instanceRouter.post('/:instanceId/connect', connectInstance);
instanceRouter.post('/:instanceId/disconnect', disconnectInstance);
instanceRouter.get('/:instanceId/qr', getInstanceQr);
