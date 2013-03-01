/*!
 * Pomelo -- consoleModule monitorLog
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */
var logger = require('pomelo-logger').getLogger(__filename);
var exec = require('child_process').exec;
var path = require('path');

var DEFAULT_INTERVAL = 5 * 60;		// in second

module.exports = function(opts) {
	return new Module(opts);
};

module.exports.moduleId = 'monitorLog';

/**
 * Initialize a new 'Module' with the given 'opts'
 *
 * @class Module
 * @constructor
 * @param {object} opts
 * @api public
 */
var Module = function(opts) {
	opts = opts || {};
	this.root = opts.path;
	this.interval = opts.interval || DEFAULT_INTERVAL;
};

 /**
 * collect monitor data from monitor
 *
 * @param {Object} agent monitorAgent object
 * @param {Object} msg client message
 * @param {Function} cb callback function
 * @api public
 */
Module.prototype.monitorHandler = function(agent, msg, cb) {
	if(!msg.logfile) {
		cb(new Error('logfile should not be empty'));
		return;
	}

	var serverId = agent.id;
	fetchLogs(this.root, msg, function (data) {
		cb(null, {serverId: serverId, body: data});
	});
};

/**
 * Handle client request
 *
 * @param {Object} agent masterAgent object
 * @param {Object} msg client message
 * @param {Function} cb callback function
 * @api public
 */
Module.prototype.clientHandler = function(agent, msg, cb) {
	agent.request(msg.serverId, module.exports.moduleId, msg, function(err, res) {
		if(err) {
			logger.error('fail to run log for ' + err.stack);
			return;
		}
		cb(null, res);
	});
};

//get the latest logs
var fetchLogs = function(root, msg, callback) {
	var number = msg.number;
	var logfile = msg.logfile;
	var serverId = msg.serverId;
	var filePath = path.join(root, getLogFileName(logfile, serverId));

	var endLogs = [];
	exec('tail -n ' + number + ' ' + filePath, function(error, output) {
		var endOut = [];
		output = output.replace(/^\s+|\s+$/g, "").split(/\s+/);

		for(var i=5; i<output.length; i+=6) {
			endOut.push(output[i]);
		}

		var endLength=endOut.length;
		for(var j=0; j<endLength; j++) {
			var map = {};
			var json;
			try{
				json = JSON.parse(endOut[j]);
			} catch(e) {
				logger.error('the log cannot parsed to json, '+e);
				continue;
			}
			map.time = json.time;
			map.route = json.route || json.service;
			map.serverId = serverId;
			map.timeUsed = json.timeUsed;
			map.params = endOut[j];
			endLogs.push(map);
		}

		callback({logfile:logfile,dataArray:endLogs});
	});
};

var getLogFileName = function(logfile, serverId) {
	return logfile + '-' + serverId + '.log';
};