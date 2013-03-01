var Loader = require('pomelo-loader');
var Gateway = require('./gateway');

var loadRemoteServices = function(paths, context) {
  var res = {}, item, m;
  for(var i=0, l=paths.length; i<l; i++) {
    item = paths[i];
    m = Loader.load(item.path, context);

    if(m) {
      createNamespace(item.namespace, res);
      for(var s in m) {
        res[item.namespace][s] = m[s];
      }
    }
  }

  return res;
};

var createNamespace = function(namespace, proxies) {
  proxies[namespace] = proxies[namespace] || {};
};

/**
 * Create rpc server.
 *
 * @param opts {Object} init parameters
 *    opts.port {Number|String}: rpc server listen port
 *    opts.paths {Array}: remote service code paths, [{namespace, path}, ...]
 *    opts.acceptorFactory {Object}: acceptorFactory.create(opts, cb)
 */
/**
 * Create rpc server.
 *
 * @param  {Object} opts construct parameters
 *                       opts.port {Number|String} rpc server listen port
 *                       opts.paths {Array} remote service code paths, [{namespace, path}, ...]
 *                       opts.context {Object} context for remote service
 *                       opts.acceptorFactory {Object} (optionals)acceptorFactory.create(opts, cb)
 * @return {Object}      rpc server instance
 */
module.exports.create = function(opts) {
  if(!opts || !opts.port || opts.port < 0 || !opts.paths) {
    throw new Error('opts.port or opts.paths invalid.');
  }

  var services = loadRemoteServices(opts.paths, opts.context);
  opts.services = services;
  var gateway = Gateway.create(opts);
  return gateway;
};

module.exports.WSAcceptor = require('./acceptors/ws-acceptor');
module.exports.TcpAcceptor = require('./acceptors/tcp-acceptor');