var muk = require('../..');
var assert = require('assert');


module.exports = function testMockDependency(dir, filename) {
  var original;

  it('Original loads without mock', function() {
    original = require(dir)(filename);
  });

  it('Correctly mocks dependency', function() {
    var deps = {};
    var mock = deps[filename] = { existsSync: function() { return true; } };

    var result = muk(dir, deps)(filename);
    assert.equal(result, mock, 'returned module is mocked object');
  });

  it('Original module is restored when require() is called', function() {
    delete require.cache[require.resolve(dir)];

    var result = require(dir)(filename);
    assert.equal(result, original,
                 'requiring module again returns orignal module');
  });
};
