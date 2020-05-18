import { getUrlParam, AP, propertyKey, debug } from '../App/shared';

const saveMacro = (ap: any) => {
  return (md: any, mbp: any) => {
    const params = Object.assign({}, md, { updated_at: new Date() });
    const body = JSON.stringify(mbp.value);
    ap.confluence.saveMacro(params, body);

    mbp.version.number = mbp.version.number + 1;
    ap.confluence.setContentProperty(mbp);
  };
};

// This is not used currently as there's a bug
// which can't get latest version of macro body in preview mode
// https://jira.atlassian.com/browse/CONFCLOUD-69962
const getMacroBody = () => new Promise<any>((resolv, reject) => {
  try {
    AP.confluence.getMacroBody((body: string) => {
      debug(`loaded macro body: ${body}`);
      try {
        resolv(body && JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
  } catch (e) {
    reject(e);
  }
});

const getContentProperty = (key: string) => new Promise<any>((resolv, reject) => {
  try {
    AP.confluence.getContentProperty(key, (property: any) => {
      debug(`loaded content property: ${JSON.stringify(property)}`);
      resolv(property && property.value);
    });
  } catch (e) {
    reject(e);
  }
});

const loadMacro = () => new Promise<any>(async (resolv, reject) => {
  try {
    const uuid = getUrlParam('uuid') || '';
    debug('URL param uuid:', uuid);

    let body = '';
    if (uuid) {
      const key = propertyKey(uuid);
      body = await getContentProperty(key);
    }

    resolv(body);
  } catch (e) {
    reject(e);
  }
});

export { saveMacro, loadMacro };
