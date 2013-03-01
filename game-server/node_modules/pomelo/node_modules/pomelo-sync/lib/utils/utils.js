var util = require('util');
/**
 * Convert object to a string.
 *
 * @param {object} buf
 * @return {String}
 */

exports.string = function(o) {
	   try {
        return JSON.stringify(o);}
    catch(ex){
        return util.inspect(o,true,100,true);
    }
    return o;
};

/**
 * Parse a `pattern` and return a RegExp.
 *
 * @param {String} pattern
 * @return {RegExp}
 */

exports.parsePattern = function(pattern){
    pattern = pattern
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
    return new RegExp('^' + pattern + '$');
};

/**
 * invoke callback function
 * @param cb
 */
exports.invoke = function(cb) {
	  if(!!cb && typeof cb == 'function') {
		    cb.apply(null, Array.prototype.slice.call(arguments, 1));
	  }
};



/***
 * clone new object
 * 
 * @param {Object} obj;
 *
 */
exports.clone = function(obj){
	  if (obj === Object(obj)){
		    if (Object.prototype.toString.call(obj) == '[object Array]'){
			      return obj.slice();
		    } else {
			      var ret = {};
			      Object.keys(obj).forEach(function (val) {
				        ret[val] = obj[val];
			      });
			      return ret;	
		    }
	  } else {
		    return null;
	  }
};

/**
 *return the merge length
 */
 exports.getMapLength = function(map){
    var length = 0;
    for (var key in map) {
        length+=1;
    }
    return length;
}
