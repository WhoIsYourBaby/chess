/**
 * Jscoverage
 * @author kate.sf@taobao.com, zhengxinlin@gmail.com, fengmk2@gmail.com
 *
 * @usage
 *   # cli command
 *
 *   # using as a node module
 *
 *   # env switch
 *     --coverage   enable coverage action, default nocoverage
 *     --noinject     close inject action, default inject
 */
var patch = require('./lib/patch');
var fs = require('fs');
var path = require('path');
var jscoverage = require('./lib/jscoverage');
var Module = require('module');

/**
 * inject function names
 */
var _inject_functions = patch.injectFunctions;
/**
 * enableModuleCache
 *   using module cache or not which has jscoverage flag
 * @param  {Boolean} bool
 */
exports.enableModuleCache = function (bool) {
  patch.enableModuleCache = bool;
};
/**
 * enableCoverage 
 * @param {bool} bool default is false
 */
exports.enableCoverage = patch.enableCoverage;
/**
 * enableInject 
 * @param {bool} bool default is true
 */
exports.enableInject = patch.enableInject;
/**
 * config the inject function names
 * @param  {} obj  {get, replace, test, call, reset}
 * @return {}
 */
exports.config = function (obj) {
  for (var i in obj) {
    _inject_functions[i] = obj[i];
  }
};
/**
 * process Code, inject the coverage code to the input Code string
 * @param {String} filename  jscoverage file flag
 * @param {Code} content
 * @return {Code} instrumented code
 */
exports.process = jscoverage.process;

/**
 * processFile, instrument file or hole dir
 * @sync
 * @param  {Path} source  absolute Path
 * @param  {Path} dest    absolute Path
 * @param  {Array} exclude  exclude files ['test_abc.js', /^_svn/]
 * @param  {Object} option  [description]
 */
exports.processFile = function (source, dest, exclude, option) {
  var content;
  var stats;
  var flag;
  var _exclude = [/^\./];
  var self = this;
  var exp_abs = /^\//;
  if (!source || !dest || !exp_abs.test(source) || !exp_abs.test(dest)) {
    throw new Error('abs source path or abs dest path needed!');
  }
  if (exclude) {
    _exclude = _exclude.concat(exclude);
  }
  // test source is file or dir, or not a file
  try {
    stats = fs.statSync(source);
    if (stats.isFile()) {
      flag = 'file';
    } else if (stats.isDirectory()) {
      flag = 'dir';
    } else {
      throw new Error();
    }
  } catch (e) {
    throw new Error('source is not a file or dir');
  }

  if (flag === 'file') { // process file
    content = fs.readFileSync(source).toString();
    content = content.toString();
    content = this.process(source, content);
    mkdirSync(path.dirname(dest));
    fs.writeFileSync(dest, content);
  } else { // process dir
    var nodes = fs.readdirSync(source);
    var tmpPath, tmpDest;
    var ignoreLen = _exclude.length;
    nodes.forEach(function (v) {
      // ignore filter
      var m;
      for (var n = 0 ; n < ignoreLen; n++) {
        m = _exclude[n];
        if (typeof m === 'string' && m === v) {
          return;
        } else if (typeof m === 'object' && m.test(v)) {
          return;
        }
      }
      // process file
      tmpPath = path.join(source, v);
      tmpDest = path.join(dest, v);
      self.processFile(tmpPath, tmpDest, exclude, option);
    });
  }
};

/**
 * mock require module, instead of the node require().
 * @param  {Object} mo module object.
 * @param {Function} require the require function
 * @return {Function} mocked require
 */
exports.mock = function (mo) {
  var _req = Module.prototype.require;
  function _mock() {
    return _req.apply(mo, arguments);
  }
  for (var i in require) {
    _mock[i] = require[i];
  }
  return _mock;
};
/**
 * jsc.require('module', flagjsc);
 * @param  {Path} file : module path
 * @return {Module} module
 */
exports.require = function (mo, file) {
  if (!file) {
    throw new Error('usage:jsc.require(mo, file); both param needed');
  }
  return Module.prototype.require.apply(mo, [file, true]);
};

/**
 * sum the coverage rate
 */
exports.coverage = function () {
  var file;
  var tmp;
  var total;
  var touched;
  var n, len;
  if (typeof _$jscoverage === 'undefined') {
    return;
  }
  for (var i in _$jscoverage) {
    file = i;
    tmp = _$jscoverage[i];
    if (typeof tmp === 'function' || tmp.length === undefined) continue;
    total = touched = 0;
    for (n = 0, len = tmp.length; n < len; n++) {
      if (tmp[n] !== undefined) {
        total ++;
        if (tmp[n] > 0)
          touched ++;
      }
    }
    console.log(
      "[JSCOVERAGE] " +
      file + ":" +
      (total ? (((touched / total) * 100).toFixed(2) + '%') : "Not prepared!!!")
    );
  }
};

exports.coverageDetail = function () {
  var file;
  var tmp;
  var source;
  var lines;
  var allcovered;
  if (typeof _$jscoverage === 'undefined') {
    return;
  }
  for (var i in _$jscoverage) {
    file = i;
    tmp = _$jscoverage[i];
    if (typeof tmp === 'function' || tmp.length === undefined) continue;
    source = tmp.source;
    allcovered = true;
    //console.log('[JSCOVERAGE]',file);
    console.log('[UNCOVERED CODE]', file);
    lines = [];
    for (var n = 0, len = source.length; n < len ; n++) {
      if (tmp[n] === 0) {
        lines[n] = 1;
        allcovered = false;
      } else {
        lines[n] = 0;
      }
    }
    if (allcovered) {
      console.log(colorful("\t100% covered", "GREEN"));
    } else {
      printCoverageDetail(lines, source);
    }
  }
};

function processLinesMask(lines) {
  function processLeft3(arr, offset) {
    var prev1 = offset - 1;
    var prev2 = offset - 2;
    var prev3 = offset - 3;
    if (prev1 < 0) return;
    arr[prev1] = arr[prev1] === 1 ? arr[prev1] : 2;
    if (prev2 < 0) return;
    arr[prev2] = arr[prev2] === 1 ? arr[prev2] : 2;
    if (prev3 < 0) return;
    arr[prev3] = arr[prev3] ? arr[prev3] : 3;
  }
  function processRight3(arr, offset) {
    var len = arr.length;
    var next1 = offset;
    var next2 = offset + 1;
    var next3 = offset + 2;
    if (next1 >= len || arr[next1] === 1) return;
    arr[next1] = arr[next1] ? arr[next1] : 2;
    if (next2 >= len || arr[next2] === 1) return;
    arr[next2] = arr[next2] ? arr[next2] : 2;
    if (next3 >= len || arr[next3] === 1) return;
    arr[next3] = arr[next3] ? arr[next3] : 3;
  }
  var offset = 0;
  var now;
  var prev = 0;
  while (offset < lines.length) {
    now = lines[offset];
    now =  now !== 1 ? 0 : 1;
    if (now !== prev) {
      if (now === 1) {
        processLeft3(lines, offset);
      } else if (now === 0) {
        processRight3(lines, offset);
      }
    }
    prev = now;
    offset ++;
  }
  return lines;
}
/**
 * printCoverageDetail
 * @param  {Array} lines [true] 1 means no coveraged
 * @return {}
 */
function printCoverageDetail(lines, source) {
  var len = lines.length;
  lines = processLinesMask(lines);
  //console.log(lines);
  for (var i = 1; i < len; i++) {
    if (lines[i] !== 0) {
      if (lines[i] === 3) {
        console.log('......');
      } else if (lines[i] === 2) {
        echo(i, source[i - 1], false);
      } else {
        echo(i, source[i - 1], true);
      }
    }
  }
  function echo(lineNum, str, bool) {
    console.log(colorful(lineNum, 'LINENUM') + '|' + colorful(str, bool ? 'YELLOW' : 'GREEN'));
  }
}
/**
 * colorful display
 * @param  {} str
 * @param  {} type
 * @return {}
 */
function colorful(str, type) {
  var head = '\x1B[', foot = '\x1B[0m';
  var color = {
    "LINENUM" : 36,
    "GREEN"  : 32,
    "YELLOW"  : 33,
    "RED" : 31
  };
  return head + color[type] + 'm' + str + foot;
}

/**
 * like mkdir -p  /a/b/c
 * @param  {Path} filepath
 * @param  {Oct} mode     [description]
 */
function mkdirSync(filepath, mode) {
  mode = mode ? mode : 0644;
  var paths = [];
  var exist = _checkDirExistSync(filepath);
  while (!exist) {
    paths.push(filepath);
    filepath = path.dirname(filepath);
    exist = _checkDirExistSync(filepath);
  }
  for (var n = paths.length - 1; n >= 0 ; n--) {
    fs.mkdirSync(paths[n]);
  }
  return true;
}
function _checkDirExistSync(filepath) {
  var exist = fs.existsSync(filepath);
  var stat;
  if (exist) {
    stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      return true;
    } else {
      throw new Error(filepath + ' exist, and Not a directory');
    }
  }
  return false;
}
