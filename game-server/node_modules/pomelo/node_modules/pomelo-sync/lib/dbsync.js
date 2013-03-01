/**
 * Module dependencies.
 */
var commands = require('./commands');
var utils = require('./utils/utils');
var Queue = require('./utils/queue');
var fs = require('fs');
var crypto = require('crypto');
var Rewriter = require('../lib/rewriter/rewriter');
var SyncTimer = require('../lib/timer/synctimer');

/**
 * 
 * DataSync Components.
 *
 * Initialize a new `DataSync` with the given `options`.
 *
 * DataSync's prototype is based on `commands` under the same directory;
 * 
 * @class DataSync
 * @constructor
 * @param {Object} options init params include aof,log,interval,mapping and mappingPath etc. 
 * 
 */
var DataSync = module.exports = function(options) {
	options = options || {};
	this.dbs = [];
	this.selectDB(0);
	this.client = options.client;
	this.aof = options.aof || false;
	this.debug = options.debug || false;
	this.log = options.log || console;
	this.interval = options.interval || 1000 * 60;
	this.flushQueue =  new Queue();
	this.mergerMap = {};
	if (!!this.aof) {
		if (!!options.filename) {
			this.filename = options.filename;
		} else {
			var path = process.cwd() + '/logs';
			fs.mkdirSync(path);
			this.filename = path+'/dbsync.log';
		}
		this.stream = fs.createWriteStream(this.filename, { flags: 'a' });
	}
	if (!!options.mapping){
		this.mapping = options.mapping;
	} else if (!!options.mappingPath) {
		this.mapping = this.loadMapping(options.mappingPath); 
	}
	this.rewriter = options.rewriter || new Rewriter(this);
	this.timer = options.timer || new SyncTimer();
	this.timer.start(this);
};

/**
 * Expose commands to store.
 */
DataSync.prototype = commands;

/**
 * Select database at the given `index`.
 * @api private
 * @param {Number} index
 */

DataSync.prototype.selectDB = function(index){
  var db = this.dbs[index];
  if (!db) {
    db = {};
    db.data = {};
    this.dbs[index] = db;
  }
  this.db = db;
};

/**
 *return the first used db
 *
 * @api private
 */
DataSync.prototype.use = function() {
  this.selectDB(0);
  var db = this.dbs[0];
  var keys = Object.keys(db);
  var dbkey = keys[0];
  return db[dbkey];
};

/**
 * Lookup `key`, when volatile compare timestamps to
 * expire the key.
 *
 * @api private
 * @param {String} key
 * @return {Object}
 */

DataSync.prototype.lookup = function(key){
  var obj = this.db.data[key];
  if (obj && 'number' == typeof obj.expires && Date.now() > obj.expires) {
    delete this.db.data[key];
    return;
  }
  return obj;
};

/**
 * Write the given `cmd`, and `args` to the AOF.
 *
 * @api private
 * @param {String} cmd
 * @param {Array} args
 */

DataSync.prototype.writeToAOF = function(cmd, args){
  var self = this;
  if (!self.aof) {return;}

  var argc = args.length;
  var op = '*' + (argc + 1) + '\r\n' + cmd + '\r\n';

  // Write head length
  this.stream.write(op);
  var i = 0;
  // Write Args
  for (i = 0; i < argc; ++i) {
    var key = utils.string(args[i]);
    this.stream.write(key);
    this.stream.write('\r\n');
  }
};
