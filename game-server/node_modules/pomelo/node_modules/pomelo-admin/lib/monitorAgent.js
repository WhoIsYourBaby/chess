var sclient = require('socket.io-client');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var utils = require('./util/utils');
var protocol = require('./util/protocol');
var logger = require('pomelo-logger').getLogger(__filename);

var ST_INITED = 1;
var ST_CONNECTED = 2;
var ST_REGISTERED = 3;
var ST_CLOSED = 4;
var STATUS_INTERVAL = 5 * 1000; // 60 seconds

/**
 * MonitorAgent Constructor
 *
 * @class MasterAgent
 * @constructor
 * @param {Object} opts construct parameter
 *                      opts.consoleService {Object} consoleService
 *                      opts.id {String} server id
 *                      opts.type {String} server type, 'master', 'connector', etc.
 *                      opts.info {Object} more server info for current server, {id, serverType, host, port}
 * @api public
 */
var MonitorAgent = function(opts) {
  EventEmitter.call(this);
  this.consoleService = opts.consoleService;
  this.id = opts.id;
  this.type = opts.type;
  this.info = opts.info;
  this.socket = null;
  this.reqId = 1;
  this.callbacks = {};
  this.state = ST_INITED;
};

util.inherits(MonitorAgent, EventEmitter);

module.exports = MonitorAgent;

/**
 * register and connect to master server
 *
 * @param {String} port
 * @param {String} host
 * @param {Function} cb callback function
 * @api public
 */
MonitorAgent.prototype.connect = function(port, host, cb) {
  if(this.state > ST_INITED) {
    logger.error('monitor client has connected or closed.');
    return;
  }

  this.socket = sclient.connect(host + ':' + port, {'force new connection': true, 'reconnect': false});

  var self = this;
  this.socket.on('register', function(msg) {
    if(msg && msg.code === protocol.PRO_OK) {
      self.state = ST_REGISTERED;
      utils.invokeCallback(cb);
    }
  });

  this.socket.on('monitor', function(msg) {
    if(self.state !== ST_REGISTERED) {
      return;
    }

    msg = protocol.parse(msg);

    if(msg.respId) {
      // a response from monitor
      var cb = self.callbacks[msg.respId];
      if(!cb) {
        logger.warn('unknown resp id:' + msg.respId);
        return;
      }
      delete self.callbacks[msg.respId];
      utils.invokeCallback(cb, msg.error, msg.body);
      return;
    }

    // request from master
    self.consoleService.execute(msg.moduleId, 'monitorHandler', msg.body, function(err, res) {
      if(protocol.isRequest(msg)) {
        var resp = protocol.composeResponse(msg, err, res);
        if(resp) {
          self.socket.emit('monitor', resp);
        }
      } else {
        //notify should not have a callback
        logger.error('notify should not have a callback.');
      }
    });
  });

  this.socket.on('connect', function() {
    if(self.state > ST_INITED) {
      //ignore reconnect
      return;
    }
    self.state = ST_CONNECTED;
    var req = {
      id: self.id,
      type: self.type,
      pid: process.pid,
      info: self.info
    };
    self.socket.emit('register', req);
  });

  this.socket.on('error', function(err) {
    if(self.state < ST_CONNECTED) {
      // error occurs during connecting stage
      utils.invokeCallback(cb, err);
    } else {
      self.emit('error', err);
    }
  });

  this.socket.on('disconnect', function(reason) {
    if(reason === 'booted') {
      //disconnected by call disconnect function
      this.state = ST_CLOSED;
      self.emit('close');
    } else {
      //some other reason such as heartbeat timeout
    }
  });
};

/**
 * close monitor agent
 *
 * @api public
 */
MonitorAgent.prototype.close = function() {
  if(this.state >= ST_CLOSED) {
    return;
  }
  this.state = ST_CLOSED;
  this.socket.disconnect();
};

/**
 * set module
 *
 * @param {String} moduleId module id/name
 * @param {Object} value module object
 * @api public
 */
MonitorAgent.prototype.set = function(moduleId, value) {
  this.consoleService.set(moduleId, value);
};

/**
 * get module
 *
 * @param {String} moduleId module id/name
 * @api public
 */
MonitorAgent.prototype.get = function(moduleId) {
  return this.consoleService.get(moduleId);
};

/**
 * notify master server without callback
 *
 * @param {String} moduleId module id/name
 * @param {Object} msg message
 * @api public
 */
MonitorAgent.prototype.notify = function(moduleId, msg) {
  if(this.state !== ST_REGISTERED) {
    logger.error('agent can not notify now, state:' + this.state);
    return;
  }
  this.socket.emit('monitor', protocol.composeRequest(null, moduleId, msg));
};

MonitorAgent.prototype.request = function(moduleId, msg, cb) {
  if(this.state !== ST_REGISTERED) {
    logger.error('agent can not request now, state:' + this.state);
    return;
  }
  var reqId = this.reqId++;
  this.callbacks[reqId] = cb;
  this.socket.emit('monitor', protocol.composeRequest(reqId, moduleId, msg));
};
