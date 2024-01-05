const { existsSync } = require('fs-extra');
const { join } = require('path');
const config = require('@blocklet/sdk/lib/config');
const { getResources } = require('@blocklet/sdk/lib/component');

const ImgResourceType = 'imgpack';
const ImageBinDid = 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9';

// can change by initStaticResourceMiddleware resourceTypes
let resourceTypes = [
  {
    type: ImgResourceType,
    did: ImageBinDid,
    folder: '', // default is root, can be set to 'public' or 'assets' or any other folder
  },
];

const logger = console;

let canUseResources = [] as any;

export const mappingResource = async (skipRunningCheck?: boolean) => {
  try {
    const resources = [] as any[];

    // get resources by resourceTypes loop
    resourceTypes.forEach((item: any) => {
      const tempResources = getResources({
        did: item.did,
        types: [].concat(item.type),
        skipRunningCheck,
      });

      if (tempResources?.length > 0) resources.push(...tempResources);
    });

    canUseResources = resources
      .map((resource: { path: string }) => {
        // check dir is exists and not in resourceKeys
        const originDir = resource.path;
        const resourceType = resourceTypes.find(({ type }) => originDir.endsWith(type));
        if (!existsSync(originDir) || !resourceType) {
          return false;
        }

        const { folder = '' } = resourceType;
        return { originDir, dir: join(originDir, folder || ''), blockletInfo: resource };
      })
      .filter(Boolean);

    logger.info('Mapping can use resources count: ', canUseResources.length, canUseResources);

    return canUseResources;
  } catch (error) {
    console.error(error);
  }

  return false;
};

// events listen
const { events, Events } = config;
events.on(Events.componentAdded, () => mappingResource());
events.on(Events.componentRemoved, () => mappingResource());
events.on(Events.componentStarted, () => mappingResource());
events.on(Events.componentStopped, () => mappingResource());
events.on(Events.componentUpdated, () => mappingResource());

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
          did: ImageBinDid, // not set did, default is ImageBinDid
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
    } else {
      res.status(404).end();
      next?.();
    }
  };
};

export const getCanUseResources = () => canUseResources;
