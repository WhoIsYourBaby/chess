var EventEmitter = require('events').EventEmitter;
var util = require('util');
var utils = require('../../util/utils');
var Composer = require('stream-pkg');
var net = require('net');

var DEFAULT_INTERVAL = 50;

var MailBox = function(server, opts) {
  EventEmitter.call(this);
  opts = opts || {};
  this.id = server.id;
  this.host = server.host;
  this.port = server.port;
  this.socket = null;
  this.composer = new Composer({maxLength: opts.pkgSize});
  this.requests = {};
  this.curId = 0;
  this.queue = [];
  this.cacheMsg = opts.cacheMsg;
  this.interval = opts.interval || DEFAULT_INTERVAL;
  this.connected = false;
  this.closed = false;
};
util.inherits(MailBox, EventEmitter);

var  pro = MailBox.prototype;

pro.connect = function(cb) {
  if(this.connected) {
    utils.invokeCallback(cb, new Error('mailbox has already connected.'));
    return;
  }

  this.socket = net.connect({port: this.port, host: this.host}, function(err) {
    // success to connect
    self.connected = true;
    if(self.cacheMsg) {
      // start flush interval
      self._interval = setInterval(function() {
        flush(self);
      }, self.interval);
    }
    utils.invokeCallback(cb, err);
  });

  var self = this;

  this.composer.on('data', function(data) {
    var pkg = JSON.parse(data.toString());
    if(pkg instanceof Array) {
      processMsgs(self, pkg);
    } else {
      processMsg(self, pkg);
    }
  });

  this.socket.on('data', function(data) {
    self.composer.feed(data);
  });

  this.socket.on('error', function(err) {
    if(!self.connected) {
      utils.invokeCallback(cb, err);
      return;
    }
    self.emit('error', err, self);
  });

  this.socket.on('end', function() {
    self.emit('close', self.id);
  });

  // TODO: reconnect and heartbeat
};

/**
 * close mailbox
 */
pro.close = function() {
  if(this.closed) {
    return;
  }
  this.closed = true;
  if(this._interval) {
    clearInterval(this._interval);
    this._interval = null;
  }
  if(this.socket) {
    this.socket.end();
    this.socket = null;
  }
};

/**
 * send message to remote server
 *
 * @param msg {service:"", method:"", args:[]}
 * @param opts {} attach info to send method
 * @param cb declaration decided by remote interface
 */
pro.send = function(msg, opts, cb) {
  if(!this.connected) {
    utils.invokeCallback(cb, new Error('not init.'));
    return;
  }

  if(this.closed) {
    utils.invokeCallback(cb, new Error('mailbox alread closed.'));
    return;
  }

  var id = this.curId++;
  this.requests[id] = cb;
  var pkg = {id: id, msg: msg};

  if(this.cacheMsg) {
    enqueue(this, pkg);
  } else {
    this.socket.write(this.composer.compose(JSON.stringify(pkg)));
  }
};

var enqueue = function(mailbox, msg) {
  mailbox.queue.push(msg);
};

var flush = function(mailbox) {
  if(mailbox.closed || !mailbox.queue.length) {
    return;
  }
  mailbox.socket.write(mailbox.composer.compose(JSON.stringify(mailbox.queue)));
  mailbox.queue = [];
};

var processMsgs = function(mailbox, pkgs) {
  for(var i=0, l=pkgs.length; i<l; i++) {
    processMsg(mailbox, pkgs[i]);
  }
};

var processMsg = function(mailbox, pkg) {
  var cb = mailbox.requests[pkg.id];
  delete mailbox.requests[pkg.id];

  if(!cb) {
    return;
  }

  cb.apply(null, pkg.resp);
};

/**
 * Factory method to create mailbox
 *
 * @param {Object} server remote server info {id:"", host:"", port:""}
 * @param {Object} opts construct parameters
 *                      opts.cacheMsg {Boolean} msg should be cache or send immediately.
 *                      opts.interval {Boolean} msg queue flush interval if cacheMsg is true. default is 50 ms
 */
module.exports.create = function(server, opts) {
  return new MailBox(server, opts || {});
};