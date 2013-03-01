/**
 * Module dependencies.
 */
 var utils = require('../utils/utils');
 var invoke = utils.invoke;
 var clone = utils.clone;
/**
 * 
 * invoke tick instant 
 *
 * @module
 *
 * @param {String} key
 * @param {Object}  val
 * @param {Function} cb
 *
 */
 exports.execSync = function(key,val,cb){
     this.rewriter.tick(key,val,cb);
 };

/**
 * exec add be synced data to queue 
 * invoke by timer
 *  
 * @module 
 */
 exports.exec = function(){
    var mergerKey;
    switch (arguments.length) {
        case 2:
        this.enqueue(arguments[0],arguments[1]);
        break;
        case 3:
        mergerKey = [arguments[0],arguments[1]].join('');
        this.mergerMap[mergerKey] = {key:arguments[0],val:clone(arguments[2])};
        this.writeToAOF(arguments[0], [arguments[2]]);
        break;
        default:
        break;
    }
};

/**
 * 
 * enqueue data  
 *
 * @param {String} key
 * @param {Object} val
 * 
 */
 exports.enqueue = function(key, val){
     var target = clone(val);
     if (!!target) {
      this.writeToAOF(key, [val]);
      this.flushQueue.push({key:key,val:val});
  }
};

/**
 * flush all data go head
 */
 exports.sync = function(){
     if (this.rewriter) {
      this.rewriter.sync(this);
  }
};
/**
 * reutrn queue is empty or not when shutdown server 
 *
 * @module 
 *
 */
 exports.isDone = function(){
    var writerEmpty = true,queueEmpty = false,mapEmpty = false;
    if (!!this.rewriter) {
     writerEmpty = this.rewriter.isDone();
 }
 queueEmpty = (this.flushQueue.getLength()===0);
 mapEmpty = (utils.getMapLength(this.mergerMap)===0);
 return writerEmpty && queueEmpty && mapEmpty;
};

/*
 * 
 * flush single data to db
 * first remove from cache map
 */
 exports.flush = function(){
    var mergerKey;
    if (arguments.length>=3) {
        mergerKey = [arguments[0],arguments[1]].join('');
        var exists = this.mergerMap[mergerKey];
        if (!!exists) {
            this.writeToAOF([arguments[0],['_remove']].join(''),[exists]);
            delete this.mergerMap[mergerKey];
        } 
        this.writeToAOF(arguments[0], [arguments[2]]);
        return this.rewriter.flush(arguments[0],arguments[2]);
    } else {
        this.log.error('invaild arguments,flush must have at least 3 arguments');
        return false;
    }
};

/**
 * get dbsync info  INFO
 *
 *
 */
 exports.info = function(){
  var buf = ''
  , day = 86400000
  , uptime = new Date - this.server.start;

  this.dbs.forEach(function(db, i){
    var keys = Object.keys(db)
    , len = keys.length;
    if (len) {
      buf += 'db' + i + ':keys=' + len + ',expires=0\r\n';
  }
});

  return (buf);
};


