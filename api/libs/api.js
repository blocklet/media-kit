const { default: axios } = require('axios');

const api = axios.create();

module.exports = {
  api,
};
