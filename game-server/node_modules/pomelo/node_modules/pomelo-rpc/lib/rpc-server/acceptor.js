var acceptor = require('./acceptors/ws-acceptor');

module.exports.create = function(opts, cb) {
  return acceptor.create(opts, cb);
};