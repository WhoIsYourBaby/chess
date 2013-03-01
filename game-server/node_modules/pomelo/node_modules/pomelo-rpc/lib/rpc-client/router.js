var utils = require('../util/utils');
var crc = require('crc');

/**
 * Calculate route info and return an appropriate server id.
 *
 * @param session {Object} session object for current rpc request
 * @param msg {Object} rpc message. {serverType, service, method, args, opts}
 * @param servers {Object} server info list {type: [{id, host, port, ...}]}
 * @param cb(err, serverId)
 */
module.exports.route = function(session, msg, servers, cb) {
  if(!servers) {
    utils.invokeCallback(cb, new Error('empty server configs.'));
    return;
  }

  var list = servers[msg.serverType];
  if(!list) {
    utils.invokeCallback(cb, new Error('can not find server info for server type:' + msg.serverType));
    return;
  }

  var uid = session ? (session.uid || '') : '';
  process.nextTick(function() {
    utils.invokeCallback(cb, null, list[Math.abs(crc.crc32(uid)) % list.length].id);
  });
};
