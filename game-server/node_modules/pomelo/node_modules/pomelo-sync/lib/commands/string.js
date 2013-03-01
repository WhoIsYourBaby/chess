/**
 * Module dependencies.
 */

var utils = require('../utils/utils');
/**
 * GET <key> set value
 *
 * @param {String} key
 *
 */
exports.get = function(key){
  var obj = this.lookup(key);
  if (!!obj) {
    return obj.val;
  } else { 
  return null;
  }
  };

  /**
   * GETSET <key> <val>
   *
   * @param {String} key
   * @param {String} val
   *
   */
  exports.getset = function(key, val){
    this.writeToAOF('getset', [key,val]);
    this.db.data[key] = { val: val };

    return this.get(key);
  };

  /**
   * SET db value by key
   *
   * @param {String} key
   * @param {Object} val
   */

  (exports.set = function(key, val){
      this.writeToAOF('set', [key,val]);
      this.db.data[key] = { val: val};
      return true;
  }).mutates = true;


  /**
   * INCR <key> counter
   *
   * @param {String} key
   */

  (exports.incr = function(key){
      var obj = this.lookup(key);

      if (!obj) {
        this.db.data[key] = {val: 1 };
        return 1;
      }  else {
        return ++obj.val;
      } 
  }).mutates = true;

  /**
   * INCRBY <key>  counter with step <num>
   *
   * @param {String} key
   * @param {number} num
   *
   */
  (exports.incrby = function(key, num){
      var obj = this.lookup(key);
      if (isNaN(num)) { throw new Error("TypeError");}
      if (!obj) {
        obj = this.db.data[key] = {val: num };
        return (obj.val);
      } else {
        return (obj.val += num);
      } 
  }).mutates = true;

  /**
   * DECRBY <key> <num>
   */

  (exports.decrby = function(key, num){
      var obj = this.lookup(key);
      if (isNaN(num)) { throw new Error(" TypoeError");}
      if (!obj) {
        obj = this.db.data[key] = {val: -num };
        return (obj.val);
      } else {
        obj.val = obj.val-num;
        return obj.val;
      } 
  }).mutates = true;

  /**
   * DECR <key>
   */

  (exports.decr = function(key){
      var obj = this.lookup(key);

      if(!obj) {
        this.db.data[key] = { val: -1 };
        return -1;
      } else {
        return --obj.val;
      } 
  }).mutates = true;

  /**
   * STRLEN <key>
   */

  exports.strlen = function(key){
    var val = this.lookup(key);
    if (val) {
      return val.length;
    } else {
      return 0;
    } 
    };

    /**
     * MGET <key>+
     */

    (exports.mget = function(keys){
        var len = keys.length;
        var list = [];
        for (var i = 0; i < len; ++i) {
          var obj = this.lookup(keys[i]);
          list.push(obj);
        }
        return list;
    }).multiple = 1;

    /**
     * MSET (<key> <val>)+
     */

    exports.mset = function(strs){
      var len = strs.length
      , key
      , val;

      for (var i = 0; i < len; ++i) {
        key = strs[i++];
        this.db.data[key] = { val: strs[i] };
      }
      return true;
    };

    exports.mset.multiple = 2;
    exports.mset.mutates = true;

