/*!
 * Pomelo -- commandLine Client 
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */

var protocol = require('../util/protocol');
var io = require('socket.io-client');

var Client = function(){
	this.reqId = 1;
	this.callbacks = {};
	this.listeners = {};
	this.state = Client.ST_INITED;
};

Client.prototype = {
	connect: function(id, host, port, cb){
		this.id = id;
		var self = this;
		this.socket = io.connect('http://' + host + ':' + port);

		this.socket.on('connect', function(){
			self.state = Client.ST_CONNECTED;
			self.socket.emit('register', {type: "client", id: id});
		});

		this.socket.on('register', function(res) {
			if(res.code !== protocol.PRO_OK) {
				cb(res.msg);
				return;
			}

			self.state = Client.ST_REGISTERED;
			cb();
		});

		this.socket.on('client', function(msg) {
			msg = protocol.parse(msg);
			if(msg.respId) {
				// response for request
				var cb = self.callbacks[msg.respId];
				delete self.callbacks[msg.respId];
				if(cb && typeof cb === 'function') {
					cb(msg.error, msg.body);
				}
			} else if(msg.moduleId) {
				// notify
				self.emit(msg.moduleId, msg);
			}
		});

		this.socket.on('error', function(err) {
			if(self.state < Client.ST_CONNECTED) {
				cb(err);
			}

			self.emit('error', err);
		});
	},

	request: function(moduleId, msg, cb){
		var id = this.reqId++;
		var req = protocol.composeRequest(id, moduleId, msg);
		this.callbacks[id] = cb;
		this.socket.emit('client', req);
	}, 

	notify: function(moduleId, msg) {
		// something dirty: attach current client id into msg
		msg.clientId = this.id;
		var req = protocol.composeRequest(null, moduleId, msg);
		this.socket.emit('client', req);
	}, 

	on: function(event, listener) {
		this.listeners[event] = this.listeners[event] || [];
		this.listeners[event].push(listener);
	}, 

	emit: function(event) {
		var listeners = this.listeners[event];
		if(!listeners || !listeners.length) {
			return;
		}

		var args = Array.prototype.slice.call(arguments, 1);
		var listener;
		for(var i=0, l=listeners.length; i<l; i++) {
			listener = listeners[i];
			if(typeof listener === 'function') {
				listener.apply(null, args);
			}
		}
	}
};

Client.ST_INITED = 1;
Client.ST_CONNECTED = 2;
Client.ST_REGISTERED = 3;
Client.ST_CLOSED = 4;

module.exports = Client;

