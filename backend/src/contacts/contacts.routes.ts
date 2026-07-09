import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  blockContact,
  checkContact,
  getBlockedContacts,
  getContact,
  getContactImage,
  getInvalidContacts,
  listContactIds,
  listContacts,
  unblockContact
} from './contacts.controller';

export const contactsRouter = Router();

contactsRouter.use(authenticate);
contactsRouter.get('/', listContacts);
contactsRouter.get('/ids', listContactIds);
contactsRouter.get('/blocked', getBlockedContacts);
contactsRouter.get('/invalid', getInvalidContacts);
contactsRouter.get('/check', checkContact);
contactsRouter.get('/image', getContactImage);
contactsRouter.get('/:contactId', getContact);
contactsRouter.post('/:contactId/block', blockContact);
contactsRouter.post('/:contactId/unblock', unblockContact);
