import { createDecipheriv, createHash } from 'node:crypto';
import { parseCredentialInput, type CredentialInput } from '../schemas';

const OPENSSL_HEADER = Buffer.from('Salted__');

const deriveOpenSslKeyAndIv = (
  password: Buffer,
  salt: Buffer,
): { key: Buffer; iv: Buffer } => {
  const blocks: Buffer[] = [];
  let previous = Buffer.alloc(0);
  while (Buffer.concat(blocks).length < 48) {
    previous = createHash('md5').update(Buffer.concat([previous, password, salt])).digest();
    blocks.push(previous);
  }
  const material = Buffer.concat(blocks);
  return { key: material.subarray(0, 32), iv: material.subarray(32, 48) };
};

export const decryptLegacyCredential = (
  encrypted: string,
  siteUrl: string,
): CredentialInput => {
  const payload = Buffer.from(encrypted, 'base64');
  if (payload.length <= 16 || !payload.subarray(0, 8).equals(OPENSSL_HEADER)) {
    throw new Error('Invalid legacy credential envelope');
  }
  const origin = new URL(siteUrl).origin;
  const password = Buffer.from(`aws-widget-macro ${origin}`, 'utf8');
  const salt = payload.subarray(8, 16);
  const { key, iv } = deriveOpenSslKeyAndIv(password, salt);
  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  const plaintext = Buffer.concat([
    decipher.update(payload.subarray(16)),
    decipher.final(),
  ]).toString('utf8');
  const value: unknown = JSON.parse(plaintext);
  if (typeof value !== 'object' || value === null) {
    throw new Error('Invalid legacy credential value');
  }
  return parseCredentialInput({
    accessKeyId: Reflect.get(value, 'accessKey'),
    secretAccessKey: Reflect.get(value, 'secretKey'),
  });
};
