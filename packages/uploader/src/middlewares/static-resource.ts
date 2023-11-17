const { existsSync } = require('fs-extra');
const { join, extname } = require('path');
const joinURL = require('url-join');
const { flattenDeep, keyBy } = require('lodash');
const config = require('@blocklet/sdk/lib/config');
const { BlockletStatus } = require('@blocklet/constant');

const ImgResourceType = 'imgpack';

// can change by initStaticResourceMiddleware resourceTypes
let resourceTypes = [
  {
    type: ImgResourceType,
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

const RunningStatus = BlockletStatus.running;

let canUseResources = [] as any;

const mappingResource = async (skipRunningCheck: boolean) => {
  try {
    const { components } = config;
    const filteredComponents = components.filter((item: any) => skipRunningCheck || item.status === RunningStatus);
    const resourcesMap = keyBy(filteredComponents, 'resources');

    const resourceTypesMap = keyBy(resourceTypes, 'type');

    canUseResources = flattenDeep(filteredComponents.map((item: any) => item.resources))
      .map((originDir: any) => {
        // check dir is exists and not in resourceKeys
        const resourceType = resourceTypes.find(({ type }) => extname(originDir).endsWith(type));
        if (!existsSync(originDir) || !resourceType) {
          return false;
        }
        const { folder = '' } = resourceType;
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
    console.error(error);
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
  resourceTypes?: string[] | Object[];
  express: any;
  skipRunningCheck: boolean;
};

export const initStaticResourceMiddleware = (
  {
    options,
    resourceTypes: _resourceTypes = resourceTypes,
    express,
    skipRunningCheck,
  } = {} as initStaticResourceMiddlewareOptions
) => {
  if (_resourceTypes.length > 0) {
    resourceTypes = _resourceTypes.map((item: any) => {
      if (typeof item === 'string') {
        return {
          type: item,
          folder: '', // not set folder, default is root
        };
      }
      return item;
    });
  }

  // init mapping resource
  mappingResource(skipRunningCheck);

  return (req: any, res: any, next: Function) => {
    const urlPath = new URL(`http://localhost${req.url}`).pathname;
    const matchCanUseResourceItem = canUseResources.find((item: any) => existsSync(join(item.dir, urlPath)));
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
