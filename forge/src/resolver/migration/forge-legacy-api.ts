import api, { route } from '@forge/api';
import { createLegacyMacroConfigReader } from './legacy-macro-config';

const CONNECT_APP_KEY = 'com.aws.widget.confluence-addon';
const LEGACY_CREDENTIAL_PROPERTY_KEY = 'aws-credentials';

const readContentProperty = async (
  contentId: string,
  propertyKey: string,
): Promise<unknown | undefined> => {
  const response = await api.asApp().requestConfluence(
    route`/wiki/rest/api/content/${contentId}/property/${propertyKey}`,
    { headers: { Accept: 'application/json' } },
  );
  if (response.status === 404) return undefined;
  if (!response.ok) throw new Error(`Legacy content property lookup failed: ${response.status}`);
  return response.json();
};

export const resolveLegacyMacroConfig = createLegacyMacroConfigReader(readContentProperty);

export const readLegacyAppProperty = async (): Promise<unknown | undefined> => {
  const response = await api.asApp().requestConfluence(
    route`/wiki/rest/atlassian-connect/1/addons/${CONNECT_APP_KEY}/properties/${LEGACY_CREDENTIAL_PROPERTY_KEY}`,
    { headers: { Accept: 'application/json' } },
  );
  if (response.status === 404) return undefined;
  if (!response.ok) throw new Error(`Legacy app property lookup failed: ${response.status}`);
  return response.json();
};
