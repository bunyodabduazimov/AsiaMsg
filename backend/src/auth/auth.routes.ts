import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { changePassword, googleLogin, login, logout, me, refresh, register } from './auth.controller';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/google', googleLogin);
authRouter.post('/change-password', authenticate, changePassword);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', logout);
authRouter.get('/me', authenticate, me);
