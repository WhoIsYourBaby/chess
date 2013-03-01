/**
 * Module dependencies.
 */
 var utils = require('../utils/utils');
 var invoke = utils.invoke;
/**
 * Initialize a new AOF Rewriter with the given `db`.
 * 
 * @param {options}
 * 
 */
 var Rewriter = module.exports = function Rewriter(server) {
 	this.server = server;
 	this.count = 0;
 };

/**
 * Initiate sync.
 */

 Rewriter.prototype.sync = function(){
 	var self = this,server = self.server;
 	server.flushQueue.shiftEach(function(element){
 		self.tick(element.key,element.val);	
 	});
 	var mergerMap = server.mergerMap;  
 	for (var mergerKey in mergerMap){
 		var entry = mergerMap[mergerKey];
 		self.tick(entry.key,entry.val);	
 		delete mergerMap[mergerKey];	
 	}
 	return true;
 };

/*
 *
 * flush db
 *
 */
 Rewriter.prototype.flush = function(key,val){
 	this.tick(key,val);
 };
/*
 *
 * judge task is done
 *
 */
 Rewriter.prototype.tick = function(key,val,cb){
 	var self = this,server = self.server;
 	if (!server.client){
 		server.log.error('db sync client is null');
 		return ;
 	}
 	var syncb = server.mapping[key];
 	if (!syncb) {
 		server.log.error(key + ' callback function not exist ');
 		return;
 	}
 	if (!cb) {
 		self.count+=1;
 		return invoke(syncb,server.client,val,function(){self.count-=1;});
 	} else {
 		invoke(syncb,server.client,val,cb);
 	}
 };
/*
 *
 * judge task is done
 *
 */
 Rewriter.prototype.isDone = function() {
 	return this.count===0;
 };
