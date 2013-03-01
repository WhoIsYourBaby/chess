var EventEmitter = require('events').EventEmitter;
var utils = require('../../util/utils');
var logger = require('pomelo-logger').getLogger(__filename);

var exp = module.exports = new EventEmitter();

exp.connect = function(cb) {
  process.nextTick(function() {
    utils.invokeCallback(cb, new Error('fail to connect to remote server and switch to blackhole.'));
  });
};

exp.close = function(cb) {
};

exp.send = function(msg, opts, cb) {
  logger.info('message into blackhole: %j', msg);
  process.nextTick(function() {
    utils.invokeCallback(cb, new Error('message was forward to blackhole.'));
  });
};