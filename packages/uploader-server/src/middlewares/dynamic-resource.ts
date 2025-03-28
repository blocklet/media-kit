import { join, basename } from 'path';
import { watch, existsSync, statSync } from 'fs';
import config from '@blocklet/sdk/lib/config';
import {
  logger,
  ResourceFile,
  calculateCacheControl,
  serveResource,
  scanDirectory,
  getFileNameFromReq,
} from '../utils';
import { globSync } from 'glob';

// 动态资源路径配置
export type DynamicResourcePath = {
  path: string; // 资源路径，支持通配符
  blacklist?: string[]; // 黑名单
  whitelist?: string[]; // 白名单
};

// 动态资源中间件配置
export type DynamicResourceOptions = {
  // 组件检查
  componentDid?: string; // 组件DID

  // 资源路径
  resourcePaths: DynamicResourcePath[];

  // 监控配置
  watchOptions?: {
    ignorePatterns?: string[]; // 忽略的文件模式
    persistent?: boolean; // 持久监控
    usePolling?: boolean; // 使用轮询
    depth?: number; // 监控深度
  };

  // 缓存配置
  cacheOptions?: {
    maxAge?: string | number; // 缓存时间
    immutable?: boolean; // 是否不可变
    etag?: boolean; // 是否使用ETag
    lastModified?: boolean; // 是否使用Last-Modified
  };

  // 钩子函数
  onFileChange?: (filePath: string, event: string) => void;
  onReady?: (resourceCount: number) => void;

  // 自定义响应头设置
  setHeaders?: (res: any, filePath: string, stat: any) => void;

  // 冲突解决策略
  conflictResolution?: 'first-match' | 'last-match' | 'error';
};

/**
 * 创建动态资源中间件
 */
export function initDynamicResourceMiddleware(options: DynamicResourceOptions) {
  // 验证配置
  if (!options.resourcePaths || !options.resourcePaths.length) {
    throw new Error('resourcePaths is required');
  }

  // 资源映射表 - 用文件名作为key
  const dynamicResourceMap = new Map<string, ResourceFile>();

  // 目录到配置的映射，用于快速查找匹配的路径配置
  const directoryPathConfigMap = new Map<string, DynamicResourcePath>();

  // 监控器列表
  let watchers: { [key: string]: any } = {};

  // 防抖处理，避免短时间内多次扫描
  const debounceMap = new Map<string, NodeJS.Timeout>();

  // 防抖时间 (ms)
  const DEBOUNCE_TIME = 300;

  // 缓存选项
  const cacheOptions = {
    maxAge: '365d',
    immutable: true,
    ...options.cacheOptions,
  };

  // 缓存控制值
  const { cacheControl, cacheControlImmutable } = calculateCacheControl(cacheOptions.maxAge, cacheOptions.immutable);

  // 检查文件是否通过黑白名单过滤
  function shouldIncludeFile(filename: string, pathConfig: DynamicResourcePath): boolean {
    if (pathConfig.whitelist?.length && !pathConfig.whitelist.some((ext) => filename.endsWith(ext))) {
      return false;
    }
    if (pathConfig.blacklist?.length && pathConfig.blacklist.some((ext) => filename.endsWith(ext))) {
      return false;
    }
    return true;
  }

  // 监控文件变化 - 优化版本
  function watchDirectory(directory: string, pathConfig: DynamicResourcePath, isParent = false) {
    // 检查目录是否已经被监控
    if (watchers[directory]) {
      return watchers[directory];
    }

    try {
      const watchOptions = {
        persistent: options.watchOptions?.persistent !== false,
        recursive: options.watchOptions?.depth !== undefined ? false : true,
      };

      // 存储目录与配置的映射关系
      directoryPathConfigMap.set(directory, pathConfig);

      const watcher = watch(directory, watchOptions, (eventType, filename) => {
        if (!filename) return;

        // 检查忽略模式
        if (
          options.watchOptions?.ignorePatterns?.some(
            (pattern) => filename.startsWith(pattern) || new RegExp(pattern).test(filename)
          )
        ) {
          return;
        }

        const fullPath = join(directory, filename);

        // 如果是目录监控，检查是否需要监控新创建的目录
        if (isParent && eventType === 'rename' && existsSync(fullPath)) {
          try {
            const stat = statSync(fullPath);
            if (stat.isDirectory()) {
              // 只对匹配通配符的目录进行监控
              const dirPattern = pathConfig.path.substring(pathConfig.path.indexOf('*'));
              const regex = new RegExp(dirPattern.replace(/\*/g, '.*'));

              if (regex.test(fullPath)) {
                // 为新目录添加监控
                watchDirectory(fullPath, pathConfig);

                // 防抖处理扫描
                if (debounceMap.has('scan')) {
                  clearTimeout(debounceMap.get('scan')!);
                }
                debounceMap.set(
                  'scan',
                  setTimeout(() => {
                    scanDirectories();
                    debounceMap.delete('scan');
                  }, DEBOUNCE_TIME)
                );
              }
            }
          } catch (err) {
            // 忽略错误
          }
          return;
        }

        // 处理文件变化 - 使用防抖处理以减少IO操作
        if (eventType === 'change' || eventType === 'rename') {
          // 获取文件名（不包含路径）
          const baseName = basename(filename);

          // 为每个文件设置单独的防抖，提高响应速度
          const debounceKey = `${directory}:${baseName}`;

          if (debounceMap.has(debounceKey)) {
            clearTimeout(debounceMap.get(debounceKey)!);
          }

          debounceMap.set(
            debounceKey,
            setTimeout(() => {
              processFileChange(directory, baseName, fullPath, eventType, pathConfig);
              debounceMap.delete(debounceKey);
            }, DEBOUNCE_TIME)
          );
        }
      });

      watchers[directory] = watcher;
      return watcher;
    } catch (err) {
      logger.error(`Error watching directory ${directory}:`, err);
      return null;
    }
  }

  // 单个文件变更处理
  function processFileChange(
    directory: string,
    baseName: string,
    fullPath: string,
    eventType: string,
    pathConfig: DynamicResourcePath
  ) {
    // 已存在的文件
    if (existsSync(fullPath)) {
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) return;

        // 检查黑白名单
        if (!shouldIncludeFile(baseName, pathConfig)) {
          return;
        }

        // 扫描单个文件而非整个目录，提高性能
        try {
          // 获取文件资源
          const resourceFile = scanDirectory(directory, {
            whitelist: pathConfig.whitelist,
            blacklist: pathConfig.blacklist,
            originDir: directory,
          }).get(baseName);

          if (resourceFile) {
            // 处理冲突
            let shouldAdd = true;
            if (dynamicResourceMap.has(baseName) && options.conflictResolution) {
              switch (options.conflictResolution) {
                case 'last-match':
                  // 最后匹配的覆盖之前的
                  break;
                case 'error':
                  logger.error(`Resource conflict: ${baseName} exists in multiple directories`);
                  break;
                case 'first-match':
                default:
                  // 保留第一个匹配，不添加
                  shouldAdd = false;
                  break;
              }
            }

            if (shouldAdd) {
              dynamicResourceMap.set(baseName, resourceFile);

              // 调用文件变化钩子
              if (options.onFileChange) {
                options.onFileChange(fullPath, eventType);
              }

              logger.debug(`Updated resource: ${baseName}`);
            }
          }
        } catch (err) {
          logger.debug(`Error updating resource for ${fullPath}:`, err);
        }
      } catch (err) {
        logger.debug(`Error handling file change for ${fullPath}:`, err);
      }
    } else {
      // 文件被删除，从映射表移除
      if (dynamicResourceMap.has(baseName)) {
        dynamicResourceMap.delete(baseName);

        // 调用文件变化钩子
        if (options.onFileChange) {
          options.onFileChange(fullPath, 'delete');
        }

        logger.debug(`Removed resource: ${baseName}`);
      }
    }
  }

  // 扫描目录和父级目录 - 使用延迟加载和批处理
  async function scanDirectories() {
    // 追踪初始资源数量
    const initialSize = dynamicResourceMap.size;

    // 处理每个资源路径
    for (const pathConfig of options.resourcePaths) {
      try {
        // 获取所有匹配的目录
        let directories: string[] = [];

        if (pathConfig.path.includes('*')) {
          // 使用 glob 库查找匹配的目录
          try {
            const pattern = pathConfig.path;
            const parentDir = pathConfig.path.substring(0, pathConfig.path.indexOf('*')).replace(/\/+$/, '');

            // 使用 globSync 直接查找匹配的目录
            // 注意：大型项目可考虑使用异步版本
            directories = globSync(pattern).filter((dir) => {
              try {
                return existsSync(dir) && statSync(dir).isDirectory();
              } catch (err) {
                return false;
              }
            });

            // 监控父目录以检测新创建的目录
            try {
              watchDirectory(parentDir, pathConfig, true);
            } catch (err) {
              logger.debug(`Error watching parent directory ${parentDir}:`, err);
            }
          } catch (err) {
            logger.error(`Error finding directories for pattern ${pathConfig.path}:`, err);
            // 如果通配符匹配失败，尝试直接使用路径
            const plainPath = pathConfig.path.replace(/\*/g, '');
            if (existsSync(plainPath)) {
              directories.push(plainPath);
            }
          }
        } else {
          // 没有通配符，直接使用路径
          if (existsSync(pathConfig.path)) {
            directories.push(pathConfig.path);
          }
        }

        // 批量处理每个目录中的资源
        let totalResources = 0;

        // 扫描每个目录并监控变化
        for (const directory of directories) {
          // 添加目录监控
          watchDirectory(directory, pathConfig);

          // 扫描目录并添加到资源映射
          const dirMap = scanDirectory(directory, {
            whitelist: pathConfig.whitelist,
            blacklist: pathConfig.blacklist,
            originDir: directory,
          });

          // 合并资源并处理冲突
          if (dirMap.size > 0) {
            // 处理资源冲突
            Array.from(dirMap.entries()).forEach(([key, value]) => {
              if (dynamicResourceMap.has(key)) {
                // 处理冲突
                switch (options.conflictResolution) {
                  case 'last-match':
                    dynamicResourceMap.set(key, value);
                    break;
                  case 'error':
                    logger.error(`Resource conflict: ${key} exists in multiple directories`);
                    break;
                  case 'first-match':
                  default:
                    // 保留第一个匹配，不做任何操作
                    break;
                }
              } else {
                dynamicResourceMap.set(key, value);
                totalResources++;
              }
            });
          }
        }

        // 只在有新增资源时记录日志，减少日志噪音
        if (totalResources > 0) {
          logger.info(`Added ${totalResources} resources from ${pathConfig.path} pattern`);
        }
      } catch (err) {
        logger.error(`Error scanning directories for path ${pathConfig.path}:`, err);
      }
    }

    // 调用就绪钩子 - 只在有变化或初始化时触发
    if ((dynamicResourceMap.size !== initialSize || initialSize === 0) && options.onReady) {
      options.onReady(dynamicResourceMap.size);
    }

    return dynamicResourceMap;
  }

  // 清理资源和监控器 - 优化版
  function cleanup() {
    // 清理所有防抖定时器
    debounceMap.forEach((timer) => clearTimeout(timer));
    debounceMap.clear();

    // 清理所有监控器
    for (const key in watchers) {
      try {
        watchers[key].close();
      } catch (err) {
        // 忽略错误
      }
    }

    // 清理映射表
    watchers = {};
    dynamicResourceMap.clear();
    directoryPathConfigMap.clear();

    logger.debug('Dynamic resource middleware cleaned up');
  }

  // 组件DID检查
  if (options.componentDid && config.env.componentDid !== options.componentDid) {
    // 返回空中间件
    const emptyMiddleware = (req: any, res: any, next: Function) => next();
    return Object.assign(emptyMiddleware, { cleanup });
  }

  // 初始化扫描
  scanDirectories();

  // 创建中间件函数
  const middleware = (req: any, res: any, next: Function) => {
    // 获取文件名
    const fileName = getFileNameFromReq(req);

    try {
      // 从资源映射表查找资源
      const resource = dynamicResourceMap.get(fileName);

      if (resource) {
        // 服务资源
        serveResource(req, res, next, resource, {
          ...cacheOptions,
          setHeaders: options.setHeaders,
          cacheControl,
          cacheControlImmutable,
        });
      } else {
        next();
      }
    } catch (error) {
      logger.error('Error serving dynamic resource:', error);
      next();
    }
  };

  // 添加清理方法
  return Object.assign(middleware, { cleanup });
}
