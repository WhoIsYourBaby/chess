var EventEmitter = require('events').EventEmitter;
var util = require('util');
var utils = require('../../util/utils');
var sio = require('socket.io');

var Acceptor = function(opts, cb){
  EventEmitter.call(this);
  this.cacheMsg = opts.cacheMsg;
  this.interval = opts.interval;  // flush interval in ms
  this._interval = null;          // interval object
  this.sockets = {};
  this.msgQueues = {};
  this.cb = cb;
};
util.inherits(Acceptor, EventEmitter);

var pro = Acceptor.prototype;

pro.listen = function(port) {
  //check status
  if(!!this.inited) {
    utils.invokeCallback(self.cb, new Error('already inited.'));
    return;
  }
  this.inited = true;

  var self = this;

  this.server = sio.listen(port);

  this.server.set('log level', 0);

  this.server.server.on('error', function(err) {
    self.emit('error', err);
  });

  this.server.sockets.on('connection', function(socket) {
    self.sockets[socket.id] = socket;

    socket.on('message', function(pkg) {
      if(pkg instanceof Array) {
        processMsgs(socket, self, pkg);
      } else {
        processMsg(socket, self, pkg);
      }
    });

    socket.on('disconnect', function() {
      delete self.sockets[socket.id];
      delete self.msgQueues[socket.id];
    });
  });

  if(this.cacheMsg) {
    this._interval = setInterval(function() {
      flush(self);
    }, this.interval);
  }
};

pro.close = function() {
  if(!!this.closed) {
    return;
  }
  this.closed = true;
  if(this._interval) {
    clearInterval(this._interval);
    this._interval = null;
  }
  try {
    this.server.server.close();
  } catch(err){
  }
  this.emit('closed');
};

var cloneError = function(origin) {
  // copy the stack infos for Error instance json result is empty
  var res = {
    msg: origin.msg,
    stack: origin.stack
  };
  return res;
};

var processMsg = function(socket, acceptor, pkg) {
  acceptor.cb.call(null, pkg.msg, function() {
    var args = Array.prototype.slice.call(arguments, 0);
    for(var i=0, l=args.length; i<l; i++) {
      if(args[i] instanceof Error) {
        args[i] = cloneError(args[i]);
      }
    }
    var resp = {id: pkg.id, resp: Array.prototype.slice.call(args, 0)};
    if(acceptor.cacheMsg) {
      enqueue(socket, acceptor, resp);
    } else {
      socket.emit('message', resp);
    }
  });
};

var processMsgs = function(socket, acceptor, pkgs) {
  for(var i=0, l=pkgs.length; i<l; i++) {
    processMsg(socket, acceptor, pkgs[i]);
  }
};

var enqueue = function(socket, acceptor, msg) {
  var queue = acceptor.msgQueues[socket.id];
  if(!queue) {
    queue = acceptor.msgQueues[socket.id] = [];
  }
  queue.push(msg);
};

var flush = function(acceptor) {
  var sockets = acceptor.sockets, queues = acceptor.msgQueues, queue, socket;
  for(var socketId in queues) {
    socket = sockets[socketId];
    if(!socket) {
      // clear pending messages if the socket not exist any more
      delete queues[socketId];
      continue;
    }
    queue = queues[socketId];
    if(!queue.length) {
      continue;
    }
    socket.emit('message', queue);
    queues[socketId] = [];
  }
};

/**
 * create acceptor
 *
 * @param opts init params
 * @param cb(msg, cb) callback function that would be invoked when new message arrives
 */
module.exports.create = function(opts, cb) {
  return new Acceptor(opts || {}, cb);
};
