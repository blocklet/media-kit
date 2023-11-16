const { existsSync } = require('fs-extra');
const { join } = require('path');
const joinURL = require('url-join');
const { flattenDeep, keyBy } = require('lodash');
const config = require('@blocklet/sdk/lib/config');

const IMAGE_BIN_RESOURCE_KEY = 'export.imgpack';

// can change by initStaticResourceMiddleware resourceKeys
let resourceKeys = [
  {
    key: IMAGE_BIN_RESOURCE_KEY,
    folder: '', // default is root, can be set to 'public' or 'assets' or any other folder
  },
];

const logger = console;

// const getComponentInfo = () => {
//   const { env, components } = config;
//   const component = components.find((item: any) => item.did === env.componentDid);
//   return {
//     ...component,
//     ...env,
//     currentBlockletUrl: joinURL(env.appUrl, component.mountPoint),
//   };
// };

let canUseResources = [] as any;

const mappingResource = async () => {
  try {
    const { components } = config;
    const runningComponents = components.filter((item: any) => item.status === 6);
    const resourcesMap = keyBy(runningComponents, 'resources');

    const resourceKeysMap = keyBy(resourceKeys, 'key');

    canUseResources = flattenDeep(runningComponents.map((item: any) => item.resources))
      .map((originDir: any) => {
        // check dir is exists and not in resourceKeys
        if (!existsSync(originDir) || !resourceKeys.some(({ key }) => originDir.endsWith(key))) {
          return false;
        }
        const { folder = '' } = resourceKeysMap[originDir.split('/').pop()];
        return { originDir, dir: join(originDir, folder || '') };
      })
      .filter(Boolean);

    logger.info('Mapping can use resources count: ', canUseResources.length, canUseResources);

    canUseResources.forEach(async (resourceItem: any) => {
      const { dir } = resourceItem;
      const resourceInfo = resourcesMap[dir];
    });

    return canUseResources;
  } catch (error) {
    // do nothing
  }

  return false;
};

// events listen
const { events, Events } = config;
events.on(Events.componentAdded, mappingResource);
events.on(Events.componentRemoved, mappingResource);
events.on(Events.componentStarted, mappingResource);
events.on(Events.componentStopped, mappingResource);
events.on(Events.componentUpdated, mappingResource);

type initStaticResourceMiddlewareOptions = {
  options?: any;
  resourceKeys?: string[] | Object[];
  express: any;
};

export const initStaticResourceMiddleware = (
  { options, resourceKeys: _resourceKeys = resourceKeys, express } = {} as initStaticResourceMiddlewareOptions
) => {
  if (_resourceKeys.length > 0) {
    resourceKeys = _resourceKeys.map((item: any) => {
      if (typeof item === 'string') {
        return {
          key: item,
          folder: '', // not set folder, default is root
        };
      }
      return item;
    });
  }
  // init mapping resource
  mappingResource();

  return (req: any, res: any, next: Function) => {
    const matchCanUseResourceItem = canUseResources.find((item: any) => existsSync(join(item.dir, req.url)));
    // dynamic get can use resources assets
    if (matchCanUseResourceItem) {
      express.static(matchCanUseResourceItem.dir, {
        maxAge: '365d',
        immutable: true,
        index: false,
        // fallthrough: false,
        ...options,
      })(req, res, next);
    }
  };
};
