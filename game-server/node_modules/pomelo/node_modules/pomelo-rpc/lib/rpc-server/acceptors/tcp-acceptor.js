var EventEmitter = require('events').EventEmitter;
var util = require('util');
var utils = require('../../util/utils');
var net = require('net');
var Composer = require('stream-pkg');
var toobusy = require('toobusy');

var Acceptor = function(opts, cb){
  EventEmitter.call(this);
  opts = opts || {};
  this.cacheMsg = opts.cacheMsg;
  this.interval = opts.interval;  // flush interval in ms
  this.pkgSize = opts.pkgSize;
  this._interval = null;          // interval object
  this.server = null;
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

  this.server = net.createServer();
  this.server.listen(port);

  this.server.on('error', function(err) {
    self.emit('error', err, this);
  });

  this.server.on('connection', function(socket) {
    self.sockets[socket.id] = socket;
    socket.composer = new Composer({maxLength: self.pkgSize});

    socket.on('data', function(data) {
      socket.composer.feed(data);
    });

    socket.composer.on('data', function(data) {
      var pkg = JSON.parse(data.toString());
      if(toobusy()) {
        var resp = {
          id: pkg.id,
          resp: [cloneError(new Error('server too busy'))]
        };
        socket.write(socket.composer.compose(JSON.stringify(resp)));
        return;
      }
      if(pkg instanceof Array) {
        processMsgs(socket, self, pkg);
      } else {
        processMsg(socket, self, pkg);
      }
    });

    socket.on('close', function() {
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
  toobusy.shutdown();
  if(this._interval) {
    clearInterval(this._interval);
    this._interval = null;
  }
  try {
    this.server.close();
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
      socket.write(socket.composer.compose(JSON.stringify(resp)));
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
    socket.write(socket.composer.compose(JSON.stringify(queue)));
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

process.on('SIGINT', function() {
  toobusy.shutdown();
  process.exit();
});