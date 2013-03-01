var log4js = require('log4js');
var fs = require('fs');

var funcs = {
	'env': doEnv, 
	'args': doArgs, 
	'opts': doOpts
};

function getLogger(categoryName) {
	if(typeof categoryName === 'string') {
		// category name is __filename then cut the prefix path
		categoryName = categoryName.replace(process.cwd(), '');
	}

	return log4js.getLogger(categoryName);
}

/**
 * Configure the logger.
 * Configure file just like log4js.json. And support ${scope:arg-name} format property setting.
 * It can replace the placeholder in runtime.
 * scope can be:
 *     env: environment variables, such as: env:PATH
 *     args: command line arguments, such as: args:1
 *     opts: key/value from opts argument of configure function
 *
 * @param  {String|Object} config configure file name or configure object
 * @param  {Object} opts   options
 * @return {Void}        
 */
function configure(config, opts) {
	config = config || process.env.LOG4JS_CONFIG;
	opts = opts || {};

	if(typeof config === 'string') {
		config = JSON.parse(fs.readFileSync(config, "utf8"));
	}

	if(config) {
		config = filterAppenders(config, opts);
		config = replaceProperties(config, opts);
	}

	// config object could not turn on the auto reload configure file in log4js
	log4js.configure(config, opts);
}

function filterAppenders(configObj, opts) {
	var appenders = configObj.appenders;
	if(!appenders) {
		return configObj;
	}

	var appender, res = [];
	for(var i=0, l=appenders.length; i<l; i++) {
		appender = appenders[i];
		// TODO: regexp test?
		if(appender.pattern && appender.pattern !== opts.pattern) {
			continue;
		}

		res.push(appender);
	}

	configObj.appenders = res;
	return configObj;
}

function replaceProperties(configObj, opts) {
	if(configObj instanceof Array) {
		for(var i=0, l=configObj.length; i<l; i++) {
			configObj[i] = replaceProperties(configObj[i], opts);
		}
	} else if(typeof configObj === 'object') {
		var field;
		for(var f in configObj) {
			if(!configObj.hasOwnProperty(f)) {
				continue;
			}

			field = configObj[f];
			if(typeof field === 'string') {
				configObj[f] = doReplace(field, opts);
			} else if(typeof field === 'object') {
				configObj[f] = replaceProperties(field, opts);
			}
		}
	}

	return configObj;
}

function doReplace(src, opts) {
	if(!src) {
		return src;
	}

	var ptn = /\$\{(.*?)\}/g;
	var m, pro, ts, scope, name, defaultValue, func, res = '', lastIndex = 0;
	while((m = ptn.exec(src))) {
		pro = m[1];
		ts = pro.split(':');
		if(ts.length !== 2 && ts.length !== 3) {
			res += pro;
			continue;
		}
		
		scope = ts[0];
		name = ts[1];
		if(ts.length === 3) {
			defaultValue = ts[2];
		}

		func = funcs[scope];
		if(!func && typeof func !== 'function') {
			res += pro;
			continue;
		}

		res += src.substring(lastIndex, m.index);
		lastIndex = ptn.lastIndex;
		res += (func(name, opts) || defaultValue);
	}

	if(lastIndex < src.length) {
		res += src.substring(lastIndex);
	}

	return res;
}

function doEnv(name) {
	return process.env[name];
}

function doArgs(name) {
	return process.argv[name];
}

function doOpts(name, opts) {
	return opts ? opts[name] : undefined;
}

module.exports = {
    getLogger: getLogger,
    getDefaultLogger: log4js.getDefaultLogger,

    addAppender: log4js.addAppender,
    loadAppender: log4js.loadAppender,
    clearAppenders: log4js.clearAppenders,
    configure: configure,

    replaceConsole: log4js.replaceConsole,
    restoreConsole: log4js.restoreConsole,

    levels: log4js.levels,
    setGlobalLogLevel: log4js.setGlobalLogLevel,

    layouts: log4js.layouts,
};

configure();