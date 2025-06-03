const middleware = require('@blocklet/sdk/lib/middlewares');
const { verify, getVerifyData } = require('@blocklet/sdk/lib/util/verify-sign');
const logger = require('./logger');

const auth = (req, res, next) => {
  try {
    if (req.get('x-component-sig')) {
      const { data, sig } = getVerifyData(req);
      const verified = verify(data, sig);
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

const user = middleware.session({ accessKey: true });
const ensureAdmin = middleware.auth({ roles: ['admin', 'owner'] });

module.exports = {
  auth,
  user,
  ensureAdmin,
};
