/**
 * Module dependencies.
 */

var utils = require('../utils/utils');
/**
 * HLEN <key>
 */
exports.hlen = function(key){
  var obj = this.lookup(key);
  if (!!obj && 'hash' == obj.type) {
    return Object.keys(obj.val).length;
  } else {
    return -1;
  }
};

/**
 * HVALS <key>
 */

exports.hvals = function(key){
  var obj = this.lookup(key);
  if (!!obj && 'hash' == obj.type) {
    return (obj.val);
  } else {
    return null;
  }
};

/**
 * HKEYS <key>
 */

exports.hkeys = function(key){
  var obj = this.lookup(key);
  if (!!obj && 'hash' == obj.type) {
    return Object.keys(obj.val);
  } else {
    return null;
  }
};

/**
 * HSET <key> <field> <val>
 */

(exports.hset = function(key, field, val){
    var obj = this.lookup(key);

    if (obj && 'hash' != obj.type) { return false;}
    obj = obj || (this.db.data[key] = { type: 'hash', val: {} });

    obj.val[field] = val;

    return true;

}).mutates = true;

/**
 * HMSET <key> (<field> <val>)+
 */

(exports.hmset = function(data){
    var len = data.length , key = data[0] , obj = this.lookup(key) , field , val;
    if (obj && 'hash' != obj.type) { return false;} 
    obj = obj || (this.db.data[key] = { type: 'hash', val: {} });
    var i = 1;
    for (i = 1; i < len; ++i) {
      field = data[i++];
      val = data[i];
      obj.val[field] = val;
    }
    return true;

}).mutates = true;

exports.hmset.multiple = 2;
exports.hmset.skip = 1;

/**
 * HGET <key> <field>
 */

exports.hget = function(key, field){
  var obj = this.lookup(key) , val;
  if (!obj) {
    return null;
  } else if ('hash' == obj.type) {
    return obj.val[field] || null;
  } else {
    return null;
  }
};

/**
 * HGETALL <key>
 */

exports.hgetall = function(key){
  var obj = this.lookup(key);
  var list = [];
  var field;
  if (!!obj && 'hash' == obj.type) {
    for (field in obj.val) {
      list.push(field, obj.val[field]);
    }
    return list;
  } else {
    return null;
  }
};

/**
 * HEXISTS <key> <field>
 */

exports.hexists = function(key, field){
  var obj = this.lookup(key);
  if (!!obj && 'hash' == obj.type) {
    var result = (hfield in obj.val);
    return result;
  } else {
    return false;
  }
};
