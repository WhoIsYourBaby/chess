var EventEmitter = require('events').EventEmitter;
var util = require('util');
var utils = require('../util/utils');
var defaultMailboxFactory = require('./mailbox');
var blackhole = require('./mailboxes/blackhole');
var logger = require('pomelo-logger').getLogger(__filename);

var GRACE_TIMEOUT = 3000;

/**
 * Station states
 */
var STATE_INITED  = 1;    // station has inited
var STATE_STARTED  = 2;   // station has started
var STATE_CLOSED  = 3;    // station has closed

var DEFAULT_PENDING_SIZE = 1000;    // default pending message limit

var app;
/**
 * Mail station constructor.
 *
 * @param {Object} opts construct parameters
 */
var MailStation = function(opts) {
  EventEmitter.call(this);
  app = opts.context;

  this.servers = {};    // remote server info map, key: server id, value: info
  this.mailboxFactory = opts.mailboxFactory || defaultMailboxFactory;

  // filters
  this.befores = [];
  this.afters = [];

  // pending request queues
  this.pendings = {};
  this.pendingSize = opts.pendingSize || DEFAULT_PENDING_SIZE;

  // connecting remote server mailbox map
  this.connecting = {};

  // working mailbox map
  this.mailboxes = {};

  this.state = STATE_INITED;
};
util.inherits(MailStation, EventEmitter);

var pro = MailStation.prototype;

/**
 * Init and start station. Connect all mailbox to remote servers.
 *
 * @param  {Function} cb(err) callback function
 * @return {Void}
 */
pro.start = function(cb) {
  if(this.state > STATE_INITED) {
    utils.invokeCallback(cb, new Error('station has started.'));
    return;
  }

  var self = this;
  process.nextTick(function() {
    self.state = STATE_STARTED;
    utils.invokeCallback(cb);
  });
};

/**
 * Stop station and all its mailboxes
 *
 * @param  {Boolean} force whether stop station forcely
 * @return {Void}
 */
pro.stop = function(force) {
  if(this.state !== STATE_STARTED) {
    logger.warn('[pomelo-rpc] client is not running now.');
    return;
  }
  this.state = STATE_CLOSED;

  var self = this;
  function closeAll() {
    for(var id in self.mailboxes) {
      self.mailboxes[id].close();
    }
  }
  if(force) {
    closeAll();
  } else {
    setTimeout(closeAll, GRACE_TIMEOUT);
  }
};

/**
 * Add a new server info into the mail station and clear
 * the blackhole associated with the server id if any before.
 *
 * @param {Object} serverInfo server info such as {id, host, port}
 */
pro.addServer = function(serverInfo) {
  if(!serverInfo || !serverInfo.id) {
    return;
  }

  var id = serverInfo.id;
  this.servers[id] = serverInfo;
  if(this.mailboxes[id] === blackhole) {
    // clear blackhole for new server if exists before
    delete this.mailboxes[id];
  }
};

/**
 * Batch version for add new server info.
 *
 * @param {Array} serverInfos server info list
 */
pro.addServers = function(serverInfos) {
  if(!serverInfos || !serverInfos.length) {
    return;
  }

  for(var i=0, l=serverInfos.length; i<l; i++) {
    this.addServer(serverInfos[i]);
  }
};

/**
 * Remove a server info from the mail station and remove
 * the mailbox instance associated with the server id.
 *
 * @param  {String|Number} id server id
 */
pro.removeServer = function(id) {
  delete this.servers[id];
  var mailbox = this.mailboxes[id];
  if(mailbox) {
    mailbox.close();
    delete mailbox[id];
  }
};

/**
 * Batch version for remove remote servers.
 *
 * @param  {Array} ids server id list
 */
pro.removeServers = function(ids) {
  if(!ids || !ids.length) {
    return;
  }

  for(var i=0, l=ids.length; i<l; i++) {
    this.removeServer(ids[i]);
  }
};

/**
 * Dispatch rpc message to the mailbox
 *
 * @param  {String}   serverId remote server id
 * @param  {Object}   msg      rpc invoke message
 * @param  {Object}   opts     rpc invoke option args
 * @param  {Function} cb       callback function
 * @return {Void}
 */
pro.dispatch = function(serverId, msg, opts, cb) {
  if(this.state !== STATE_STARTED) {
    utils.invokeCallback(cb, new Error('[pomelo-rpc] client is not running now.'));
    return;
  }

  var self = this;
  var mailbox = this.mailboxes[serverId];
  if(!mailbox) {
    // try to connect remote server if mailbox instance not exist yet
    if(!lazyConnect(this, serverId, this.mailboxFactory)) {
      utils.invokeCallback(cb, new Error('fail to connect to remote server:' + serverId));
      console.error('miss server info: %j', app.getCurServer().id);
      for(var sid in self.servers) {
        console.error('server: %j, %j', sid, self.servers[sid]);
      }
      return;
    }
    // push request to the pending queue
    addToPending(this, serverId, Array.prototype.slice.call(arguments, 0));
    return;
  }

  if(this.connecting[serverId]) {
    // if the mailbox is connecting to remote server
    addToPending(this, serverId, Array.prototype.slice.call(arguments, 0));
    return;
  }

  var send = function(serverId, msg, opts) {
    var mailbox = self.mailboxes[serverId];
    if(!mailbox) {
      var args = [new Error('can not find mailbox with id:' + serverId)];
      doFilter(serverId, msg, opts, self.afters, 0, 'after', function() {
        utils.applyCallback(cb, args);
      });
      return;
    }

    mailbox.send(msg, opts, function() {
      var args = Array.prototype.slice.call(arguments, 0);
      doFilter(serverId, msg, opts, self.afters, 0, 'after', function() {
        utils.applyCallback(cb, args);
      });
    });
  };  // end of send

  doFilter(serverId, msg, opts, this.befores, 0, 'before', send);
};

/**
 * Add a before filter
 *
 * @param  {[type]} filter [description]
 * @return {[type]}        [description]
 */
pro.before = function(filter) {
  this.befores.push(filter);
};

/**
 * Add after filter
 *
 * @param  {[type]} filter [description]
 * @return {[type]}        [description]
 */
pro.after = function(filter) {
  this.afters.push(filter);
};

pro.filter = function(filter) {
  this.befores.push(filter);
  this.afters.push(filter);
};

/**
 * Do before or after filter
 */
var doFilter = function(serverId, msg, opts, filters, index, operate, cb) {
  if(index  >= filters.length) {
    utils.invokeCallback(cb, serverId, msg, opts);
    return;
  }

  var filter = filters[index];

  if(typeof filter === 'function') {
    filter(serverId, msg, opts, function(serverId, msg, opts) {
      index++;
      doFilter(serverId, msg, opts, filters, index, operate, cb);
    });
    return;
  } if(typeof filter[operate] === 'function') {
    filter[operate](serverId, msg, opts, function(serverId, msg, opts) {
      index++;
      doFilter(serverId, msg, opts, filters, index, operate, cb);
    });
    return;
  }

  index++;
  doFilter(serverId, msg, opts, filters, index, operate, cb);
};

var lazyConnect = function(station, serverId, factory) {
  var server = station.servers[serverId];
  if(!server) {
    logger.warn('[pomelo-rpc] unkonw server: %j', serverId);
    return false;
  }

  var mailbox = factory.create(server, station.opts);
  station.connecting[serverId] = true;
  station.mailboxes[serverId] = mailbox;
  mailbox.connect(function(err) {
    if(err) {
      station.emit('error', new Error('fail to connect to remote server: ' + serverId));
      // forward the msg to blackhole if fail to connect to remote server
      station.mailboxes[serverId] = blackhole;
    }
    mailbox.on('close', function(id) {
      station.emit('close', id);
    });
    delete station.connecting[serverId];
    flushPending(station, serverId);
  });
  return true;
};

var addToPending = function(station, serverId, args) {
  var pending = station.pendings[serverId];
  if(!pending) {
    pending = station.pendings[serverId] = [];
  }
  if(pending.length > station.pendingSize) {
    logger.warn('[pomelo-rpc] station pending too much for: %j',  serverId);
    return;
  }
  pending.push(args);
};

var flushPending = function(station, serverId) {
  var pending = station.pendings[serverId];
  var mailbox = station.mailboxes[serverId];
  if(!pending.length) {
    return;
  }
  if(!mailbox) {
    logger.error('[pomelo-rpc] fail to flush pending messages for empty mailbox: %j', serverId);
    return;
  }
  for(var i=0, l=pending.length; i<l; i++) {
    station.dispatch.apply(station, pending[i]);
  }
  delete station.pendings[serverId];
};

/**
 * Mail station factory function.
 *
 * @param  {Object} opts construct paramters
 *           opts.servers {Object} global server info map. {serverType: [{id, host, port, ...}, ...]}
 *           opts.mailboxFactory {Function} mailbox factory function
 * @return {Object}      mail station instance
 */
module.exports.create = function(opts) {
  return new MailStation(opts || {});
};