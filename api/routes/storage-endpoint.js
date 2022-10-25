const express = require('express');
const fs = require('fs-extra');
const { isEmpty } = require('lodash');
const path = require('path');
const { dataDir } = require('../libs/env');

const storageEndpointRouter = express.Router();

const endpointFilePath = path.join(dataDir, 'endpoint.txt');

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

    await fs.outputFile(endpointFilePath, endpoint);

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
    if (!fs.existsSync(endpointFilePath)) {
      return '';
    }

    const buffer = await fs.readFile(endpointFilePath);

    return res.send(buffer.toString());
  }
);

module.exports = {
  storageEndpointRouter,
};
