jscoverage
==========
jscoverage tool, both node or javascript support

### install 
  
    npm install jscoverage -g

### get source code
    git clone git://github.com/fishbar/jscoverage.git
    cd ./jscoverage
    mocha -R list test --coverage

### using as cli command
```shell
jscoverage
# print help info
jscoverage source.js
# convert source.js to source-cov.js
jscoverage source.js dest.js
# convert source.js to dest.js
jscoverage sourcedir destdir --exclude a.js,b.js,c.js
# convert all files in sourcedir to destdir, exclude list will be ignored
```
TODO, comming soon
```sh
jscoverage sourcedir destdir --no-instrument
```

### using as node module

```js
var jsc = require('jscoverage');
var abc = jsc.require(module, 'testmodule.js');
describe('test', function () {
    // TEST CODE HERE
});
```
==== or =====
```js
var jsc = require('jscoverage');
require = jsc.mock(mo);
var abc = require('abc.js', true);
describe('test', function () {
    // TEST CODE HERE
});
```
### env switchs

jscoverage do not process coverage by default,
because when we writting test case in the begining, case always fail,
and we need to fix problems by check the error stack, finding the exact line where error happened

using follow options, you can switch the functions

    --coverage   enable coverage action, default nocoverage
    --noinject   close inject action, default inject , sometimes you already using rewire module do the same thing

i.e when you run test code by mocha:
```sh
    mocha test/ --coverage  # open coverage instrument
    mocha test/ --noinject  # close inject when you are using rewire
```
or you can also do in this way:
```js
var jsc = require('jscoverage');
jsc.enableCoverage(true);
jsc.enableInject(false);
```
    
### run with mocha

output a html coverage reporter 
```sh
mocha -R html-cov test/test.js --coverage > coverage.html
```

### print coverage info in cli

you can just print the coverage info in cli , like this:
```js
// add the following code to you test file
var jsc = require('jscoverage');
process.on('exit', function () {
  jsc.coverage(); // print summary info, cover percent
  jsc.coverageDetail(); // print uncovered lines
});
```

### mocha global leaks detect

the follow object will be detected, all of them are create by jscoverage

    _$jscoverage, _$jscoverage_done, _$jscoverage_init, _$jscoverage_cond

