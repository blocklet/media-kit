const middleware = require('@blocklet/sdk/lib/middlewares');
const { verify } = require('@blocklet/sdk/lib/util/verify-sign');
const logger = require('./logger');

const auth = (req, res, next) => {
  try {
    const sig = req.get('x-component-sig');
    if (sig) {
      const verified = verify(req.body ?? {}, sig);
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
