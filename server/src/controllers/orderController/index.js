// server/src/controllers/orderController/index.js
module.exports = {
  ...require('./orderCreation'),
  ...require('./orderFetch'),
  ...require('./orderEdit'),
  ...require('./orderWorkflow'),
  ...require('./orderInvoice')
};