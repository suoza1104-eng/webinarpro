require('dotenv').config();
const app = require('./app');
const logger = require('./logger');
const sino = require('./services/sino');
const sinoChannel = require('./services/sino-channel');
const alerts = require('./services/alerts');

const port = process.env.PORT || 3000;

app.listen(port, () => {
  logger.info(`WebnarPRO API rodando na porta ${port}`);
  sino.startOutboxWorker();
  sinoChannel.startWorker();
  require('./services/presence-buffer').start();
  alerts.start();
});
