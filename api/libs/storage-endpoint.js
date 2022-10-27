const urlJoin = require('url-join');

/**
 *
 * @param {string} endpoint
 * @param {string} objectKey
 */
function getPublicUrl(endpoint, objectKey) {
  return urlJoin(endpoint.replace('object/', ''), 'public', objectKey);
}

module.exports = {
  getPublicUrl,
};
