const { readConfig } = require('./config.cjs');

process.env.GATEWAY_PORT = readConfig().PUBLIC_PORT;
require('../../lab2/scripts/smoke-messaging.cjs');
