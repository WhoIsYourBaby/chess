var Module = require('module');
var path = require('path');


/**
 * Mocks a call to `require()`
 *
 * @param {string} filename
 * @param {Object} deps
 * @param {Object} parent
 */
module.exports = function mockRequire(filename, deps, parent) {
  filename = Module._resolveFilename(filename, parent);
  var m = require.cache[filename] = new Module(filename, parent);
  m.filename = filename;
  m.paths = Module._nodeModulePaths(path.dirname(filename));

  // load children
  if (deps) {
    var children = {};
    Object.keys(deps).forEach(function(key) {
      var childpath = Module._resolveFilename(key, m);
      var child = children[childpath] = new Module(childpath, m);
      child.filename = path;
      child.paths = Module._nodeModulePaths(path.dirname(childpath));
      child.loaded = true;
      child.exports = deps[key];
    });

    m.require = function(path) {
      var childpath = Module._resolveFilename(path, m);
      var child = children[childpath];
      if (child) {
        return child.exports;
      } else {
        return Module._load(path, m);
      }
    };
  }

  // load module
  m.load(filename);

  // delete module from cache so it can be required normally
  delete require.cache[filename];

  return m.exports;
};
