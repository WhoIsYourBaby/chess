/**
 * RPC Client
 */

/**
 * Module dependencies
 */
var Loader = require('pomelo-loader');
var Proxy = require('../util/proxy');
var Station = require('./mailstation');
var utils = require('../util/utils');
var router = require('./router');
var logger = require('pomelo-logger').getLogger(__filename);

/**
 * Client states
 */
var STATE_INITED  = 1;  // client has inited
var STATE_STARTED  = 2;  // client has started
var STATE_CLOSED  = 3;  // client has closed

/**
 * RPC Client Class
 */
var Client = function(opts) {
  opts = opts || {};
  this._context = opts.context;
  this._routeContext = opts.routeContext;
  this.router = opts.router || router;

  this._station = createStation(opts);
  this.proxies = {};
  this.state = STATE_INITED;
};

var pro = Client.prototype;

/**
 * Start the rpc client which would try to connect the remote servers and
 * report the result by cb.
 *
 * @param cb {Function} cb(err)
 */
pro.start = function(cb) {
  if(this.state > STATE_INITED) {
    utils.invokeCallback(cb, new Error('rpc client has started.'));
    return;
  }

  var self = this;
  this._station.start(function(err) {
    if(err) {
      logger.error('[pomelo-rpc] client start fail for ' + err.stack);
      utils.invokeCallback(cb, err);
      return;
    }
    self.state = STATE_STARTED;
    utils.invokeCallback(cb);
  });
};

/**
 * Stop the rpc client.
 *
 * @param  {Boolean} force
 * @return {Void}
 */
pro.stop = function(force) {
  if(this.state !== STATE_STARTED) {
    logger.warn('[pomelo-rpc] client is not running now.');
    return;
  }
  this.state = STATE_CLOSED;
  this._station.stop(force);
};

/**
 * Add a new proxy to the rpc client which would overrid the proxy under the
 * same key.
 *
 * @param {Object} record proxy description record, format:
 *                        {namespace, serverType, path}
 */
pro.addProxy = function(record) {
  if(!record) {
    return;
  }

  var proxy = generateProxy(this, record, this._context);
  if(!proxy) {
    return;
  }

  insertProxy(this.proxies, record.namespace, record.serverType, proxy);
};

/**
 * Batch version for addProxy.
 *
 * @param {Array} records list of proxy description record
 */
pro.addProxies = function(records) {
  if(!records || !records.length) {
    return;
  }
  for(var i=0, l=records.length; i<l; i++) {
    this.addProxy(records[i]);
  }
};

/**
 * Add new remote server to the rpc client.
 *
 * @param {Object} server new server information
 */
pro.addServer = function(server) {
  this._station.addServer(server);
};

/**
 * Batch version for add new remote server.
 *
 * @param {Array} servers server info list
 */
pro.addServers = function(servers) {
  this._station.addServers(servers);
};

/**
 * Remove remote server from the rpc client.
 *
 * @param  {String|Number} id server id
 */
pro.removeServer = function(id) {
  this._station.removeServer(id);
};

/**
 * Batch version for remove remote server.
 *
 * @param  {Array} ids remote server id list
 */
pro.removeServers = function(ids) {
  this._station.removeServers(ids);
};

/**
 * Do the rpc invoke directly.
 *
 * @param serverId {String} remote server id
 * @param msg {Object} rpc message. Message format:
 *    {serverType: serverType, service: serviceName, method: methodName, args: arguments}
 * @param cb {Function} cb(err, ...)
 */
pro.rpcInvoke = function(serverId, msg, cb) {
  if(this.state !== STATE_STARTED) {
    cb(new Error('[pomelo-rpc] fail to do rpc invoke for client is not running'));
    return;
  }
  this._station.dispatch(serverId, msg, null, cb);
};

pro.before = function(filter) {
  this._station.before(filter);
};

pro.after = function(filter) {
  this._station.after(filter);
};

pro.filter = function(filter) {
  this._station.filter(filter);
};

/**
 * Create mail station.
 *
 * @param opts {Object} construct parameters.
 *
 * @api private
 */
var createStation = function(opts) {
  return Station.create(opts);
};

/**
 * Generate proxies for remote servers.
 *
 * @param client {Object} current client instance.
 * @param record {Object} proxy reocrd info. {namespace, serverType, path}
 * @param context {Object} mailbox init context parameter
 *
 * @api private
 */
var generateProxy = function(client, record, context) {
  if(!record) {
    return;
  }

  var res, name;

  var modules = Loader.load(record.path, context);
  if(modules) {
    res = {};
    for(name in modules) {
      res[name] = Proxy.create({
        service: name,
        origin: modules[name],
        attach: record,
        proxyCB: proxyCB.bind(null, client)
      });
    }
  }

  return res;
};

var proxyCB = function(client, serviceName, methodName, args, attach, invoke) {
  if(client.state !== STATE_STARTED) {
    throw new Error('[pomelo-rpc] fail to invoke rpc proxy for client is not running');
  }

  if(args.length < 2) {
    logger.error('[pomelo-rpc] invalid rpc invoke, arguments length less than 2, namespace: %j, serverType, %j, serviceName: %j, methodName: %j',
      attach.namespace, attach.serverType, serviceName, methodName);
    return;
  }

  var routeParam = args.shift();
  var cb = args.pop();
  var msg = {namespace: attach.namespace, serverType: attach.serverType,
    service: serviceName, method: methodName, args: args};
  // do rpc message route caculate
  var route, target;
  if(typeof client.router === 'function') {
    route = client.router;
    target = null;
  } else if(typeof client.router.route === 'function') {
    route = client.router.route;
    target = client.router;
  } else {
    logger.error('[pomelo-rpc] invalid route function.');
    return;
  }

  route.call(target, routeParam, msg, client._routeContext, function(err, serverId) {
    if(err) {
      utils.invokeCallback(cb, err);
      return;
    }

    client.rpcInvoke(serverId, msg, cb);
  });
};

var insertProxy = function(proxies, namespace, serverType, proxy) {
  proxies[namespace] = proxies[namespace] || {};
  proxies[namespace][serverType] = proxy;
};

/**
 * RPC client factory method.
 *
 * @param  {Object} opts client init parameter.
 *                       opts.context: mail box init parameter,
 *                       opts.router: (optional) rpc message route function, route(routeParam, msg, cb),
 *                       opts.mailBoxFactory: (optional) mail box factory instance.
 * @return {Object}      client instance.
 */
module.exports.create = function(opts) {
  return new Client(opts);
};

module.exports.WSMailbox = require('./mailboxes/ws-mailbox');
