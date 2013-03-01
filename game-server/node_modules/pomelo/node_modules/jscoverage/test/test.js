var jsc = require("../index");
var expect = require('expect.js');
var abc = jsc.require(module, './abc');
describe('test', function () {
  it('should be ok', function () {
    expect('123').to.be('123');
    expect(abc.abc()).to.be(6);
  });
});