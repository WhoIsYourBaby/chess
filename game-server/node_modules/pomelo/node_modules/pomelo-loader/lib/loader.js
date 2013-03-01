/**
 * Loader Module
 */

var fs = require('fs');
var path = require('path');

/**
 * Load modules under the path.
 * If the module is a function, loader would treat it as a factory function 
 * and invoke it with the context parameter to get a instance of the module.
 * Else loader would just require the module.
 * Module instance can specify a name property and it would use file name as 
 * the default name if there is no name property. All loaded modules under the 
 * path would be add to an empty root object with the name as the key.
 * 
 * @param  {String} mpath    the path of modules. Load all the files under the 
 *                           path, but *not* recursively if the path contain 
 *                           any sub-directory. 
 * @param  {Object} context  the context parameter that would be pass to the 
 *                           module factory function.
 * @return {Object}          module that has loaded.
 */
module.exports.load = function(mpath, context) {
	if(!mpath) {
		throw new Error('opts or opts.path should not be empty.');
	}

	mpath = fs.realpathSync(mpath);

	if(!fs.existsSync(mpath)) {
		throw new Error('path not exist, path:' + mpath);
	}

	if(!isDir(mpath)) {
		throw new Error('path should be directory.');
	}

	return loadPath(mpath, context);
};

var loadFile = function(fp, context) {
	var m = require(fp);

	if(!m) {
		return;
	}

	if(typeof m === 'function') {
		// if the module provides a factory function 
		// then invoke it to get a instance
		m = m(context);
	}

	return m;
};

var loadPath = function(path, context) {
	var files = fs.readdirSync(path);
	if(files.length === 0) {
		console.warn('path is empty, path:' + path);
		return;
	}

	if(path.charAt(path.length - 1) !== '/') {
		path += '/';
	}
		
	var fp, fn, m, res = {};
	for(var i=0, l=files.length; i<l; i++) {
		fn = files[i];
		fp = path + fn;
		
		if(!isFile(fp) || !checkFileType(fn, '.js')) {
			// only load js file type
			continue;
		}
		
		m = loadFile(fp, context);
		
		if(!m) {
			continue;
		}

		var name = m.name || getFileName(fn, '.js'.length);
		res[name] = m;
	}
	
	return res;
};

/**
 * Check file suffix

 * @param fn {String} file name
 * @param suffix {String} suffix string, such as .js, etc.
 */
var checkFileType = function(fn, suffix) {
	if(suffix.charAt(0) !== '.') {
		suffix = '.' + suffix;
	}
	
	if(fn.length <= suffix.length) {
		return false;
	}
	
	var str = fn.substring(fn.length - suffix.length).toLowerCase();
	suffix = suffix.toLowerCase();
	return str === suffix;
};

var isFile = function(path) {
	return fs.statSync(path).isFile();
};

var isDir = function(path) {
	return fs.statSync(path).isDirectory();
};

var getFileName = function(fp, suffixLength) {
	var fn = path.basename(fp);
	if(fn.length > suffixLength) {
		return fn.substring(0, fn.length - suffixLength);
	}

	return fn;
};