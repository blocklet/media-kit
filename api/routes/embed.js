const express = require('express');
const { generateBlockletEmbed } = require('@blocklet/sdk/lib/embed');
const Upload = require('../states/upload');

const router = express.Router();

router.get('', async (req, res) => {
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

  const uploads = await Upload.paginate({ sort: { createdAt: -1 }, page, size: pageSize });
  res.jsonp(uploads);
});

module.exports = router;
