var fs = require('xfs');
var path = require('path');
var expect = require('expect.js');
var Module = require('module');
var jsc = require('../index');
jsc.enableModuleCache(false);
var index = jsc.require(module, '../index');
Module.prototype.__jsc_patch__ = false;
var jscoverage = jsc.require(module, '../lib/jscoverage');
jsc.require(module, '../lib/patch');
var abc = jsc.require(module, './abc');

var func = jscoverage._get('jscFunctionBody').toString().split(/\n/);
func.shift();
func.pop();
var wrapperGlobal = eval('(function(){ var global = {};' + func.join('\n') + ' return global;})');
var wrapperWindow = eval('(function(){ var window = {}; var global = 123;' + func.join('\n') + ' return window;})');

var _global = wrapperGlobal();
var _window = wrapperWindow();

describe("index.js", function () {
  describe("abc.abc()", function () {
    it('should be ok', function () {
      expect('123').to.be('123');
      expect(abc.abc()).to.be(6);
    });
  });
  describe("exports.enableModuleCache", function () {
    it('should change patch.enableModuleCache', function () {
      index.enableModuleCache(true);
      expect(index._get('patch.enableModuleCache')).to.be.ok();
      index.enableModuleCache(false);
      expect(index._get('patch.enableModuleCache')).to.not.ok();
    });
  });

  describe("exports.config", function () {
    it('should change patch.injectFunctions', function () {
      index.config({
        get: '__get',
        replace : '$$replace'
      });
      var cfg = index._get('patch.injectFunctions');
      expect(cfg.get).to.be('__get');
      expect(cfg.replace).to.be('$$replace');
      expect(cfg.reset).to.be('_reset');
    });
  });

  describe("exports.processFile", function () {
    it('should return an jsc convert file', function () {
      var source = path.join(__dirname, './abc.js');
      var dest = path.join(__dirname, './abc.cov.js');
      index.processFile(source, dest);
      expect(fs.existsSync(dest)).to.be(true);
      expect(fs.readFileSync(dest)).to.match(/_\$jscoverage/);
      fs.unlinkSync(dest);
    });
    it('should return an jsc convert dir', function (done) {
      var source = path.join(__dirname, './dir');
      var dest = path.join(__dirname, './dir-cov');
      index.processFile(source, dest);
      expect(fs.existsSync(dest)).to.be(true);
      expect(fs.readFileSync(dest + '/a1.js')).to.match(/_\$jscoverage/);
      expect(fs.readFileSync(dest + '/a/a2')).to.match(/_\$jscoverage/);
      fs.rmdir(dest, function () {
        done();
      });
    });
    it('should egnore exclude', function (done) {
      var source = path.join(__dirname, './dir');
      var dest = path.join(__dirname, './dir-cov');
      index.processFile(source, dest, ['a2', /\.md$/i]);
      expect(fs.existsSync(dest + '/a/a2')).to.not.ok();
      fs.rmdir(dest, function () {
        done();
      });
    });
    it('should throw error when source and dest not currect', function () {
      function _empty() {
        index.processFile();
      }
      expect(_empty).to.throwException(/abs source path or abs dest path needed!/);
    });
    it('should throw error when source and dest not currect', function () {
      function _empty() {
        index.processFile('./abc', '.abc.cov');
      }
      expect(_empty).to.throwException(/abs source path or abs dest path needed!/);
    });
    it('should throw error when source and dest not currect', function () {
      function _empty() {
        index.processFile(path.join(__dirname, './abdc.js'), '/tmp/abc.cov.js');
      }
      expect(_empty).to.throwException(/source is not a file or dir/);
    });
  });

  describe("exports.mock", function () {
    it('should return an require function', function () {
      var req = index.mock(module, require);
      expect(req).to.be.a('function');
      expect(req).to.have.keys(['cache']);
      abc = req('./abc', true);
      expect(abc.abc()).to.be(6);
      expect(abc._reset).to.be.a('function');
    });
  });

  describe("exports.require", function () {
    it('should return an require function', function () {
      var abc = index.require(module, './abc');
      expect(abc.abc()).to.be(6);
      expect(abc._reset).to.be.a('function');
    });
    it('should return error when file is empty', function () {
      function _empty() {
        index.require(module);
      }
      expect(_empty).to.throwException(/usage:jsc.require/);
    });
  });

  describe("exports.processLinesMask", function () {
    it('should be ok when test1', function () {
      var process = index._get('processLinesMask');
      var input  = [0, 0, 0, 1, 1, 0, 0, 1, 0, 0];
      var result = [3, 2, 2, 1, 1, 2, 2, 1, 2, 2];
      expect(process(input)).to.be.eql(result);
    });
    it('should be ok when test2', function () {
      var process = index._get('processLinesMask');
      var input  = [0, 0, 1, 1, 0, 0, 1, 0, 1];
      var result = [2, 2, 1, 1, 2, 2, 1, 2, 1];
      expect(process(input)).to.be.eql(result);
    });
    it('should be ok when test3', function () {
      var process = index._get('processLinesMask');
      var input  = [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0];
      var result = [2, 2, 1, 2, 2, 3, 0, 0, 0, 3, 2, 2, 1, 2];
      expect(process(input)).to.be.eql(result);
    });
    it('should be ok when test4', function () {
      var process = index._get('processLinesMask');
      var input  = [0];
      var result = [0];
      expect(process(input)).to.be.eql(result);
    });
  });

  describe("exports.processLinesMask", function () {
    var orig_log = console.log;
    var msg = [];
    console.log = function (message) {
      msg.push(message);
    };
    index.coverageDetail();
    index.coverage();
    console.log = orig_log;
  });
  describe("test jscoverage wrapper function", function(){
    it('shoud be ok', function(){
      _global._$jscoverage_init(_global._$jscoverage, 'abc', [0,1,2]);
      _global._$jscoverage_init(_global._$jscoverage_cond, 'abc', [0]);
      _global._$jscoverage_done('abc', 0);
      _global._$jscoverage_done('abc', 0, true);
      expect(_global._$jscoverage['abc']).to.eql([1,0,0]);
    });
  });
  describe("test Module.extension['.js']", function () {
    it('should return a function', function (done) {
      var module = {
        _compile: function (content, filename) {
          var ff = new Function ('require', 'module', 'exports', '__dirname', '__filename', content + ';return module.exports;');
          var module = {exports: {}};
          var mo = ff(require, module, module.exports, __dirname, filename);
          mo._replace('d', [
            undefined,
            null,
            1,
            NaN,
            "string",
            [1, 2, 3],
            {"abc": [1, 2, 3]},
            /a\\\\b/g
          ]);
          var res = mo._get('d');
          expect(res[0]).to.be(undefined);
          expect(res[1]).to.be(null);
          expect(res[2]).to.be(1);
          expect(isNaN(res[3])).to.be.ok();
          expect(res[7].test('a\\\\bc')).to.be.ok();
          mo._reset();
          expect(mo._get('d')).to.be(undefined);
          done();
        }
      };
      Module._extensions['.js'](module, path.join(__dirname, './abc.js'), {
        needjsc : true,
        flagjsc : true,
        needinject : true
      });
    });
    it('should return a function', function (done) {
      var module = {
        _compile: function (content, filename) {
          var ff = new Function ('require', 'module', 'exports', '__dirname', '__filename', content + ';return module.exports;');
          var module = {exports: {}};
          var mo = ff(require, module, module.exports, __dirname, filename);
          mo._replace('d', {});
          var res = mo._get('d');
          expect(res).to.be.eql({});
          mo._reset();
          expect(mo._get('d')).to.be(undefined);
          done();
        }
      };
      Module._extensions['.js'](module, path.join(__dirname, './abc.js'), {
        needjsc : true,
        flagjsc : true,
        needinject : true
      });
    });
  });
  describe("test reset", function () {
    it('should return a abc', function () {
      abc._replace('reset.abc', 123);
      expect(abc._get('reset.abc')).to.be(123);
      abc._reset();
      expect(abc._get('reset.abc')).to.be.a('function');
    });
  });
});

process.on('exit', function () {
  jsc.coverage();
  //jsc.coverageDetail();
});
