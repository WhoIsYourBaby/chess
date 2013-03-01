/*!
 * Pomelo -- consoleModule nodeInfo processInfo
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */
var monitor = require('pomelo-monitor');
var logger = require('pomelo-logger').getLogger(__filename);

var DEFAULT_INTERVAL = 5 * 60;		// in second

module.exports = function(opts) {
	return new Module(opts);
};

module.exports.moduleId = 'nodeInfo';

var Module = function(opts) {
	opts = opts || {};
	this.type = opts.type || 'pull';
	this.interval = opts.interval || DEFAULT_INTERVAL;
};

Module.prototype.monitorHandler = function(agent, msg, cb) {
	var serverId = agent.id;
	var pid = process.pid;
	var params = {
		serverId: serverId,
		pid: pid
	};
	monitor.psmonitor.getPsInfo(params, function (data) {
		agent.notify(module.exports.moduleId, {serverId: agent.id, body: data});
	});

};

Module.prototype.masterHandler = function(agent, msg, cb) {
	if(!msg) {
		agent.notifyAll(module.exports.moduleId);
		return;
	}

	var body=msg.body;
	var data = agent.get(module.exports.moduleId);
	if(!data) {
		data = {};
		agent.set(module.exports.moduleId, data);
	}

	data[msg.serverId] = body;
};

Module.prototype.clientHandler = function(agent, msg, cb) {
	cb(null, agent.get(module.exports.moduleId) || {});
};
