import { kvs } from '@forge/kvs';
import { createKvsCredentialRepository } from './repository.js';

export const forgeCredentialRepository = createKvsCredentialRepository(kvs);
