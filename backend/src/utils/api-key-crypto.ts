import crypto from 'node:crypto';
import { env } from '../config/env';

const algorithm = 'aes-256-gcm';
const key = crypto.createHash('sha256').update(env.INSTANCE_API_KEY_SECRET).digest();
const formatVersion = 'v1';

const encode = (input: Buffer) => input.toString('base64url');
const decode = (input: string) => Buffer.from(input, 'base64url');

export const encryptApiKey = (apiKey: string) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(apiKey, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    formatVersion,
    encode(iv),
    encode(authTag),
    encode(encrypted)
  ].join('.');
};

export const decryptApiKey = (payload: string | null | undefined) => {
  if (!payload) return null;

  const [version, ivPart, tagPart, dataPart] = payload.split('.');
  if (version !== formatVersion || !ivPart || !tagPart || !dataPart) {
    return null;
  }

  try {
    const decipher = crypto.createDecipheriv(algorithm, key, decode(ivPart));
    decipher.setAuthTag(decode(tagPart));
    const decrypted = Buffer.concat([decipher.update(decode(dataPart)), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return null;
  }
};
