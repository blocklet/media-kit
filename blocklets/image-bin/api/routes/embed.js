const express = require('express');
const { generateBlockletEmbed } = require('@blocklet/embed');
const { Upload } = require('../models');

const router = express.Router();

router.get('', (req, res) => {
  const embedData = generateBlockletEmbed();
  embedData.embed.push({
    title: 'Recent Images',
    url: '/embed/recent',
    settingUrl: '/embed/recent?edit',
  });
  res.jsonp(embedData);
});

router.get('/recent', async (req, res) => {
  const page = 1;
  const pageSize = 9;

  const { rows: uploads } = await Upload.findAndCountAll({
    order: [['updatedAt', 'DESC']],
    offset: (page - 1) * pageSize,
    limit: pageSize,
  });
  res.jsonp(uploads);
});

module.exports = router;
