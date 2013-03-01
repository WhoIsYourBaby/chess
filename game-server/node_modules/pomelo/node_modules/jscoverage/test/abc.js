var cde = require('./cde');
var a = 1;
var b = 2;
var c = 3;
var d;

var reset = {
  abc:function () {}
};

function abc() {
  var tmp = a + b;
  // test require ok
  cde.a();
  // test switch coverage
  testSwitch('first');
  testSwitch('second');
  testSwitch();
  return tmp + c;
}

function testSwitch(act) {
  var res = [
    'a',
    'b',
    'c'
  ];
  var tmp;
  switch (act) {
  case 'first' :
    tmp = res[0];
    break;
  case 'second' :
    tmp = res[1];
    break;
  default:
    tmp = res.join(',');
  }
  return tmp;
}
exports.abc = abc;
