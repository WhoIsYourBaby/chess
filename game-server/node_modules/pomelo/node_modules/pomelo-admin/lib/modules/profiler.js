var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../util/utils');
var profiler = require('v8-profiler');
var fs = require('fs');
var ProfileProxy = require('../util/profileProxy');

module.exports = function(opts) {
	return new Module(opts);
};

module.exports.moduleId = 'profiler';

var Module = function(opts) {
	if(opts && opts.isMaster) {
		this.proxy = new ProfileProxy();
	}
};

Module.prototype.monitorHandler = function(agent, msg, cb) {
	var type = msg.type, action = msg.action, uid = msg.uid, result = null;
	if (type === 'CPU') {
		if (action === 'start') {
			profiler.startProfiling();
		} else {
			result = profiler.stopProfiling();
			var res = {};
			res.head = result.getTopDownRoot();
			res.bottomUpHead = result.getBottomUpRoot();
			res.msg = msg;
			agent.notify(module.exports.moduleId, {clientId: msg.clientId, type: type, body: res});
		}
	} else {
		var snapshot = profiler.takeSnapshot();
		var name = process.cwd() + '/logs/' + utils.format(new Date()) + '.log';
		var log = fs.createWriteStream(name, {'flags': 'a'});
		var data;
		snapshot.serialize({
			onData: function (chunk, size) {
				chunk = chunk + '';
				
				data = {
					method:'Profiler.addHeapSnapshotChunk',
					params:{
						uid: uid,
						chunk: chunk
					}
				};
				log.write(chunk);
				agent.notify(module.exports.moduleId, {clientId: msg.clientId, type: type, body: data});
			},
			onEnd: function () {
				agent.notify(module.exports.moduleId, {clientId: msg.clientId, type: type, body: {params: {uid: uid}}});
				profiler.deleteAllSnapshots();
			}
		});
	}
};

Module.prototype.masterHandler = function(agent, msg, cb) {
	if(msg.type === 'CPU') {
		this.proxy.stopCallBack(msg.body, msg.clientId, agent);
	} else {
		this.proxy.takeSnapCallBack(msg.body);
	}
};

Module.prototype.clientHandler = function(agent, msg, cb) {
	if(msg.action === 'list') {
		list(agent, msg, cb);
		return;
	}

	if(typeof msg === 'string') {
		msg = JSON.parse(msg);
	}
	var id = msg.id;
	var command = msg.method.split('.');
	var method = command[1];
	var params = msg.params;
	var clientId = msg.clientId;

	if (!this.proxy[method] || typeof this.proxy[method] !== 'function') {
		return;
	}

	this.proxy[method](id, params, clientId, agent);
};

var list = function(agent, msg, cb) {
	var servers = [];
	var idMap = agent.idMap;

	for(var sid in idMap){
		servers.push(sid);
	}
	cb(null, servers);
};