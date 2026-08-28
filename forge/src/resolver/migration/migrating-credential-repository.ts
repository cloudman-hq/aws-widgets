import type {
  CredentialRepository,
  StoredCredentialV1,
} from '../credentials/repository';
import type { CredentialInput } from '../schemas';
import { decryptLegacyCredential } from './legacy-credentials';

type LegacyAppProperty = {
  value: { encrypted: string };
  self: string;
};

type MigrationDependencies = {
  repository: CredentialRepository;
  migrationState?: {
    read(): Promise<'migrated' | 'manual' | 'disabled' | undefined>;
    write(value: 'migrated' | 'manual' | 'disabled'): Promise<void>;
  };
  readLegacyAppProperty: () => Promise<unknown | undefined>;
  validateWithAws: (credential: CredentialInput) => Promise<void>;
  now: () => Date;
};

const parseLegacyAppProperty = (value: unknown): LegacyAppProperty | undefined => {
  if (typeof value !== 'object' || value === null) return undefined;
  const storedValue = Reflect.get(value, 'value');
  const self = Reflect.get(value, 'self');
  if (typeof storedValue !== 'object' || storedValue === null || typeof self !== 'string') {
    return undefined;
  }
  const encrypted = Reflect.get(storedValue, 'encrypted');
  return typeof encrypted === 'string' && encrypted.length > 0
    ? { value: { encrypted }, self }
    : undefined;
};

export const createMigratingCredentialRepository = ({
  repository,
  migrationState,
  readLegacyAppProperty,
  validateWithAws,
  now,
}: MigrationDependencies): CredentialRepository => ({
  read: async () => {
    const state = await migrationState?.read();
    if (state === 'disabled') return undefined;
    const current = await repository.read();
    if (current) return current;
    if (state !== undefined) return undefined;
    const property = parseLegacyAppProperty(await readLegacyAppProperty());
    if (!property) return undefined;
    const credential = decryptLegacyCredential(property.value.encrypted, property.self);
    await validateWithAws(credential);
    const migrated: StoredCredentialV1 = {
      schemaVersion: 1,
      ...credential,
      updatedAt: now().toISOString(),
    };
    await repository.write(migrated);
    await migrationState?.write('migrated');
    return migrated;
  },
  write: async (credential) => {
    await migrationState?.write('manual');
    await repository.write(credential);
  },
  delete: async () => {
    await migrationState?.write('disabled');
    await repository.delete();
  },
});
