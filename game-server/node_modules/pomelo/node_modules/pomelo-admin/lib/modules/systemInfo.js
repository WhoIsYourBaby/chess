/*!
 * Pomelo -- consoleModule systemInfo
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */
var monitor = require('pomelo-monitor');
var logger = require('pomelo-logger').getLogger(__filename);

var DEFAULT_INTERVAL = 5 * 60;		// in second

module.exports = function(opts) {
	return new Module(opts);
};

module.exports.moduleId = 'systemInfo';

var Module = function(opts) {
	opts = opts || {};
	this.type = opts.type || 'pull';
	this.interval = opts.interval || 5;
};

Module.prototype.monitorHandler = function(agent, msg, cb) {
	//collect data
	monitor.sysmonitor.getSysInfo(function (data) {
		agent.notify(module.exports.moduleId, {serverId: agent.id, body: data});
	});
};

Module.prototype.masterHandler = function(agent, msg) {
	if(!msg) {
		agent.notifyAll(module.exports.moduleId);
		return;
	}

	var body = msg.body;

	var oneData = {
		Time:body.iostat.date,hostname:body.hostname,serverId:msg.serverId,cpu_user:body.iostat.cpu.cpu_user,
		cpu_nice:body.iostat.cpu.cpu_nice,cpu_system:body.iostat.cpu.cpu_system,cpu_iowait:body.iostat.cpu.cpu_iowait,
		cpu_steal:body.iostat.cpu.cpu_steal,cpu_idle:body.iostat.cpu.cpu_idle,tps:body.iostat.disk.tps,
		kb_read:body.iostat.disk.kb_read,kb_wrtn:body.iostat.disk.kb_wrtn,kb_read_per:body.iostat.disk.kb_read_per,
		kb_wrtn_per:body.iostat.disk.kb_wrtn_per,totalmem:body.totalmem,freemem:body.freemem,'free/total':(body.freemem/body.totalmem),
		m_1:body.loadavg[0],m_5:body.loadavg[1],m_15:body.loadavg[2]
	};

	var data = agent.get(module.exports.moduleId);
	if(!data) {
		data = {};
		agent.set(module.exports.moduleId, data);
	}

	data[msg.serverId] = oneData;
};

Module.prototype.clientHandler = function(agent, msg, cb) {
	cb(null, agent.get(module.exports.moduleId) || {});
};
