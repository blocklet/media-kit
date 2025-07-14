const express = require('express');
// eslint-disable-next-line import/no-unresolved
const { generateBlockletEmbed } = require('@blocklet/embed/embed');

const router = express.Router();

router.get('', (req, res) => {
  const embedData = generateBlockletEmbed();

  // No available embed

  res.jsonp(embedData);
});

module.exports = router;
