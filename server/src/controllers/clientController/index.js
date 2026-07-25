// server/src/controllers/clientController/index.js
const profileController = require('./profileController');
const workflowController = require('./workflowController');
const suspensionController = require('./suspensionController');
const documentController = require('./documentController');
const activityController = require('./activityController');

module.exports = {
  ...profileController,
  ...workflowController,
  ...suspensionController,
  ...documentController,
  ...activityController
};