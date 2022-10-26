const express = require('express');
const { isEmpty } = require('lodash');
const { storageEndpointRepository } = require('../states/storage-endpoint');

const storageEndpointRouter = express.Router();

storageEndpointRouter.put(
  '/',
  /**
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async (req, res) => {
    const { endpoint } = req.body;

    if (isEmpty(endpoint)) {
      return res.status(400).send('endpoint cannot be empty');
    }

    await storageEndpointRepository.write(endpoint);

    return res.send('ok');
  }
);

storageEndpointRouter.get(
  '/',
  /**
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async (req, res) => {
    if (!(await storageEndpointRepository.exists())) {
      return '';
    }

    const endpoint = await storageEndpointRepository.read();

    return res.send(endpoint);
  }
);

module.exports = {
  storageEndpointRouter,
};
