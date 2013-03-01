if(process.env.POMELO_RPC_COV) {
  module.exports.client = require('./lib-cov/rpc-client/client');
  module.exports.server = require('./lib-cov/rpc-server/server');
} else {
  module.exports.client = require('./lib/rpc-client/client');
  module.exports.server = require('./lib/rpc-server/server');
}