import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { login, logout, me, refresh, register } from './auth.controller';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', logout);
authRouter.get('/me', authenticate, me);
