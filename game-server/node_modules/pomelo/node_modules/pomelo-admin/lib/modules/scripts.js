/*!
 * Pomelo -- consoleModule runScript 
 * Copyright(c) 2012 fantasyni <fantasyni@163.com>
 * MIT Licensed
 */
var monitor = require('pomelo-monitor');
var logger = require('pomelo-logger').getLogger(__filename);
var monitor = require('pomelo-monitor');
var vm = require('vm');
var fs = require('fs');
var util = require('util');
var path = require('path');

module.exports = function(opts) {
    return new Module(opts);
};

module.exports.moduleId = "scripts";

var Module = function(opts) {
    this.app = opts.app;
    this.root = opts.path;
    this.commands = {
        'list': list, 
        'get': get, 
        'save': save, 
        'run': run
    };
};

Module.prototype.monitorHandler = function(agent, msg, cb) {
    var context = {
        app : this.app,
        os : require('os'),
        fs : require('fs'),
        process : process,
        util : util
    };
    try{
        vm.runInNewContext(msg.script, context);
    
        var result = context.result;
        if(!result){
            cb(null,"script result should be assigned to result value to script module context");
        }else{
            cb(null,result);
        }
    }catch(e){
        cb(null,e.toString());
    }
    
    //cb(null, vm.runInContext(msg.script, context));
};

Module.prototype.clientHandler = function(agent, msg, cb) {
    var fun = this.commands[msg.command];
    if(!fun || typeof fun !== 'function') {
        cb('unknown command:' + msg.command);
        return;
    }

    fun(this, agent, msg, cb);
};

/**
 * List server id and scripts file name
 */
var list = function(scriptModule, agent, msg, cb) {
    var servers = [];
    var scripts = [];
    var idMap = agent.idMap;

    for(var sid in idMap){
        servers.push(sid);
    }

    fs.readdir(scriptModule.root, function(err, filenames){
        for(var i=0, l=filenames.length; i<l; i++){
            scripts.push(filenames[i]);
        }

        cb(null, {servers: servers, scripts: scripts});
    });
};

/**
 * Get the content of the script file
 */
var get = function(scriptModule, agent, msg, cb) {
    var filename = msg.filename;
    if(!filename) {
        cb('empty filename');
        return;
    }

    fs.readFile(path.join(scriptModule.root, filename), 'utf-8', function(err, data) {
        if(err) {
            logger.error('fail to read script file:' + filename + ', ' + err.stack);
            cb('fail to read script with name:' + filename);
        }

        cb(null, data);
    });
};

/**
 * Save a script file that posted from admin console
 */
var save = function(scriptModule, agent, msg, cb) {
    var filepath = path.join(scriptModule.root, msg.filename);

    fs.writeFile(filepath, msg.body, function(err) {
        if(err){
            logger.error('fail to write script file:' + msg.filename + ', ' + err.stack);
            cb('fail to write script file:' + msg.filename);
            return;
        }
        
        cb();
    });
};

/**
 * Run the script on the specified server
 */
var run = function(scriptModule, agent, msg, cb) {
    agent.request(msg.serverId, module.exports.moduleId, msg, function(err, res) {
        if(err) {
            logger.error('fail to run script for ' + err.stack);
            return;
        }
        cb(null, res);
    });
};