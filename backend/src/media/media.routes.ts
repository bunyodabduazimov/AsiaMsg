import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { deleteMedia, deleteMediaByDate, uploadMedia } from './media.controller';

export const mediaRouter = Router();

mediaRouter.use(authenticate);
mediaRouter.post('/upload', uploadMedia);
mediaRouter.post('/delete', deleteMedia);
mediaRouter.post('/delete-by-date', deleteMediaByDate);
