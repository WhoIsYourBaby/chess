var instrument = require('./instrument');

/**
 * do not exec this function
 * the function body will insert into instrument files
 */
function jscFunctionBody() {
  // instrument by jscoverage, do not modifly this file
  (function () {
    var BASE;
    if (typeof global === 'object') {
      BASE = global;
    } else if (typeof window === 'object') {
      BASE = window;
    } else {
      throw new Error('[jscoverage] unknow ENV!');
    }
    if (!BASE._$jscoverage) {
      BASE._$jscoverage = {};
      BASE._$jscoverage_cond = {};
      BASE._$jscoverage_done = function (file, line, express) {
        if (arguments.length === 2) {
          BASE._$jscoverage[file][line] ++;
        } else {
          BASE._$jscoverage_cond[file][line] ++;
          return express;
        }
      };
      BASE._$jscoverage_init = function (base, file, lines) {
        var tmp = [];
        for (var i = 0; i < lines.length; i ++) {
          tmp[lines[i]] = 0;
        }
        base[file] = tmp;
      };
    }
  })();
}
/**
 * gen coverage head
 */
function genCodeCoverage(instrObj) {
  if (!instrObj) return '';
  var code = [];
  var filename = instrObj.file;
  var lines = instrObj.lines;
  var conditions = instrObj.conditions;
  var src = instrObj.src;
  var hh = jscFunctionBody.toString().split(/\n/);
  hh.forEach(function (v, i, a) {
    a[i] = v.replace(/^\s{2}/, '');
  });
  code.push(hh.slice(1, hh.length - 1).join('\n'));
  code.push('_$jscoverage_init(_$jscoverage, "' + filename + '",' + JSON.stringify(lines)  + ');');
  code.push('_$jscoverage_init(_$jscoverage_cond, "' + filename + '",' + JSON.stringify(conditions)  + ');');
  code.push('_$jscoverage["' + filename + '"].source = ' + JSON.stringify(src) + ';');
  code.push(instrObj.code);
  return code.join('\n');
}

exports.process = function (filename, content) {
  var instrObj;
  if (!filename) {
    throw new Error('jscoverage.process(filename, content), filename needed!');
  }
  if (!content) {
    return '';
  }
  instrObj = instrument(filename, content);
  return genCodeCoverage(instrObj);
};
