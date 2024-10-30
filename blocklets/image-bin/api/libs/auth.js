const { SIG_VERSION } = require('@blocklet/constant');
const middleware = require('@blocklet/sdk/lib/middlewares');
const { verify } = require('@blocklet/sdk/lib/util/verify-sign');
const semVer = require('semver');
const { parseURL } = require('ufo');
const logger = require('./logger');

const auth = (req, res, next) => {
  try {
    const sig = req.get('x-component-sig');
    if (sig) {
      const verified = verifySig(req);
      if (verified) {
        next();
      } else {
        res.status(401).json({ error: 'verify sig failed' });
      }
    } else {
      middleware.auth()(req, res, next);
    }
  } catch (error) {
    logger.error(error);
    res.status(403).json({ error: 'permission verify failed' });
  }
};

const user = middleware.user();
const ensureAdmin = middleware.auth({ roles: ['admin', 'owner'] });

module.exports = {
  auth,
  user,
  ensureAdmin,
};

const legacyFn = (req) => {
  const data = req?.body ?? {};
  const params = req?.query ?? {};
  return { data, params };
};

const latestFn = (req) => {
  const now = Math.floor(Date.now() / 1000);
  const iat = Number(req.get('x-component-sig-iat'));
  const exp = Number(req.get('x-component-sig-exp'));
  if (Number.isNaN(iat) || Number.isNaN(exp)) {
    throw new Error('invalid sig');
  }
  if (exp < now) {
    throw new Error('expired sig');
  }
  const data = {
    iat,
    exp,
    body: req.body ?? {},
    query: req.query ?? {},
    method: req.method.toLowerCase(),
    url: parseURL(req.originalUrl).pathname,
  };
  return data;
};

const verifySig = (req) => {
  const sig = req.get('x-component-sig');
  const sigVersion = req.get('x-component-sig-version');
  if (!sig) {
    throw new Error('verify sig failed');
  }
  const getData = semVer.gt(semVer.coerce(sigVersion), semVer.coerce(SIG_VERSION.V0)) ? latestFn : legacyFn;
  const data = getData(req);
  const verified = verify(data, sig);
  if (!verified) {
    throw new Error('verify sig failed');
  }
  return true;
};
