// server/src/controllers/admin/index.js
const profileController = require('./profileController');
const vaultController = require('./vaultController');
const documentController = require('./documentController');
const inviteController = require('./inviteController');

module.exports = {
  ...profileController,
  ...vaultController,
  ...documentController,
  ...inviteController
};