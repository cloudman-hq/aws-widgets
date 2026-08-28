import Resolver from '@forge/resolver';
import { randomUUID } from 'node:crypto';
import { validateCredentialWithAws } from './aws/credential-validator';
import { createAwsResourceAdapter } from './aws/factory';
import { forgeCredentialRepository } from './credentials/forge-repository';
import { createResolverHandlers } from './handlers';
import type { SafeLogEvent } from './safety';
import { resolveLegacyMacroConfig } from './migration/forge-legacy-api';
import { readLegacyAppProperty } from './migration/forge-legacy-api';
import { createMigratingCredentialRepository } from './migration/migrating-credential-repository';
import { kvs } from '@forge/kvs';

const resolver = new Resolver();

const MIGRATION_STATE_KEY = 'aws.credentials.connect-migration.v1';
const migratingCredentialRepository = createMigratingCredentialRepository({
  repository: forgeCredentialRepository,
  migrationState: {
    read: async () => {
      const state = await kvs.get(MIGRATION_STATE_KEY);
      return state === 'migrated' || state === 'manual' || state === 'disabled'
        ? state
        : undefined;
    },
    write: (state) => kvs.set(MIGRATION_STATE_KEY, state),
  },
  readLegacyAppProperty,
  validateWithAws: validateCredentialWithAws,
  now: () => new Date(),
});

const handlers = createResolverHandlers({
  repository: migratingCredentialRepository,
  validateWithAws: validateCredentialWithAws,
  now: () => new Date(),
  createRequestId: randomUUID,
  log: (event: SafeLogEvent) => console.info(JSON.stringify(event)),
  createResourceAdapter: createAwsResourceAdapter,
  resolveLegacyMacroConfig,
});

for (const [operation, handler] of Object.entries(handlers)) {
  resolver.define(operation, handler);
}

export const handler = resolver.getDefinitions();
