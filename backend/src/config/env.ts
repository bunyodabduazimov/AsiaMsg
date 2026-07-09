import dotenv from 'dotenv';
import { z } from 'zod';
 
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().default('7d'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  FRONTEND_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1).optional()
});

export const env = envSchema.parse(process.env);
