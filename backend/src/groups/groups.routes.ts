import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getGroup, listGroupIds, listGroups } from './groups.controller';

export const groupsRouter = Router();

groupsRouter.use(authenticate);
groupsRouter.get('/', listGroups);
groupsRouter.get('/ids', listGroupIds);
groupsRouter.get('/:groupId', getGroup);
