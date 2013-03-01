var Module = require('module');
var path = require('path');
var fs = require('fs');
var argv = require('optimist').argv;
var jscoverage = require('./jscoverage');

var env_coverage = argv.coverage;
var env_noinject = argv.noinject;

var injectFunctions = {
  get : '_get',
  replace : '_replace',
  test : '_test',
  call : '_call',
  reset : '_reset'
};

exports.enableModuleCache = true;
exports.injectFunctions = injectFunctions;

exports.enableCoverage = function (bool) {
  env_coverage = bool;
};

exports.enableInject = function (bool) {
  env_noinject = bool;
};
/**
 * do mock things here
 * @param  {} ){})(
 * @return {}
 */
(function () {
  if (Module.prototype.__jsc_patch__) {
    return;
  }
  Module.prototype.__jsc_patch__ = true;
  var origin_require = Module.prototype.require;
  Module.prototype.require = function (filename, flagjsc) {
    var needinject = !env_noinject;
    var needjsc = env_coverage;

    filename = Module._resolveFilename(filename, this);
    if (typeof(filename) === 'object')
      filename = filename[0];

    if (!flagjsc) {
      return origin_require.call(this, filename);
    }

    if (exports.enableModuleCache) {
      var cachedModule = Module._cache[filename];
      if (cachedModule) {
        return cachedModule.exports;
      }
    }
    var module = new Module(filename, this);
    try {
      module.filename = filename;
      module.paths = Module._nodeModulePaths(path.dirname(filename));
      Module._extensions['.js'](module, filename, {
        needjsc : needjsc,
        flagjsc : flagjsc,
        needinject : needinject
      });
      module.loaded = true;
      Module._cache[filename] = module;
    } catch (err) {
      delete Module._cache[filename];
      console.error(err.stack);
      throw err;
    }
    return module.exports;
  };
  function stripBOM(content) {
    // Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
    // because the buffer-to-string conversion in `fs.readFileSync()`
    // translates it to FEFF, the UTF-16 BOM.
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }
    return content;
  }
  Module._extensions['.js'] = function (module, filename, status) {
    var content = fs.readFileSync(filename, 'utf8');
    var tmpFuncBody = injectFunctionBody.toString().replace(/\$\$(\w+)\$\$/g, function (m0, m1) {
      return injectFunctions[m1];
    });
    // trim first line when script is a shell script
    // content = content.replace(/^\#\![^\n]+\n/, '');
    if (status && status.flagjsc) {
      if (status.needjsc) {
        content = jscoverage.process(filename, content);
      }
      if (status.needinject) {
        tmpFuncBody = injectFunctionBody.toString().replace(/\$\$(\w+)\$\$/g, function (m0, m1) {
          return injectFunctions[m1];
        });
        tmpFuncBody = tmpFuncBody.split(/\n/);
        content += '\n' + tmpFuncBody.slice(1, tmpFuncBody.length - 1).join('\n');
      }
    }
    module._compile(stripBOM(content), filename);
  };
})();

/**
 * do not exec this function
 */
function injectFunctionBody() {
  if (module.exports._i_n_j_e_c_t_e_d_) {
    // DO NOTHING
  } else if (module.exports.$$call$$ || module.exports.$$test$$ || module.exports.$$get$$ ||
      module.exports.$$replace$$ || module.exports.$$reset$$) {
    throw new Error("[jscoverage] jscoverage can not inject function for this module, because the function is exists! using jsc.config({inject:{}})");
  } else {
    var __r_e_p_l_a_c_e__ = {};
    module.exports.$$replace$$ = function (name, obj) {
      function stringify(obj) {
        if (obj === null)
          return 'null';
        if (obj === undefined)
          return 'undefined';
        if (!obj && isNaN(obj))
          return 'NaN';
        if (typeof obj === 'string') {
          return '"' + obj.replace(/"/g, '\\"') + '"';
        }
        if (typeof obj === 'number') {
          return obj;
        }
        if (obj.constructor === Date) {
          return 'new Date(' + obj.getTime() + ')';
        }
        if (obj.constructor === Function) {
          return obj.toString();
        }
        if (obj.constructor === RegExp) {
          return obj.toString();
        }
        var is_array = obj.constructor === Array ? true : false;
        var res, i;
        if (is_array) {
          res = ['['];
          for (i = 0; i < obj.length; i++) {
            res.push(stringify(obj[i]));
            res.push(',');
          }
          if (res[res.length - 1] === ',')
            res.pop();
          res.push(']');
        } else {
          res = ['{'];
          for (i in obj) {
            res.push(i + ':' + stringify(obj[i]));
            res.push(',');
          }
          if (res[res.length - 1] === ',')
            res.pop();
          res.push('}');
        }
        return res.join('');
      }
      if (! __r_e_p_l_a_c_e__.hasOwnProperty(name))
        __r_e_p_l_a_c_e__[name] = eval(name);
      eval(name + "=" + stringify(obj));
    };
    module.exports.$$reset$$ = function (name) {
      var script;
      if (name) {
        script = 'if(__r_e_p_l_a_c_e__.hasOwnProperty("' + name + '"))' + name + ' = __r_e_p_l_a_c_e__["' + name + '"];';
      } else {
        script = 'for(var i in __r_e_p_l_a_c_e__){eval( i + " = __r_e_p_l_a_c_e__[\'" + i + "\'];");}';
      }
      eval(script);
    };
    module.exports.$$call$$ = module.exports.$$test$$ = function (func, args) {
      var f, o;
      if (func.match(/\\./)) {
        func = func.split(".");
        f = func[func.length - 1];
        func.pop();
        o = func.join(".");
      } else {
        f = func;
        o = "this";
      }
      return eval(f + ".apply(" + o + "," + JSON.stringify(args) + ")");
    };
    module.exports.$$get$$ = function (objstr) {
      return eval(objstr);
    };
    module.exports._i_n_j_e_c_t_e_d_ = true;
  }
}
