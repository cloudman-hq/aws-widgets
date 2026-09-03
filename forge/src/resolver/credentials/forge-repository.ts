import { kvs } from '@forge/kvs';
import { createKvsCredentialRepository } from './repository';

export const forgeCredentialRepository = createKvsCredentialRepository(kvs);
