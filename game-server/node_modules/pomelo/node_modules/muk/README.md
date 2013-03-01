# muk [![Build Status](https://secure.travis-ci.org/fent/node-muk.png)](http://travis-ci.org/fent/node-muk)


# Usage

Mock an object's methods.

```js
var fs = require('fs');
var muk = require('muk');

muk(fs, 'readFile', function(path, callback) {
  process.nextTick(callback.bind(null, null, 'file contents here'));
});
```

Restore all mocked methods after tests.

```
muk.restore();

fs.readFile(file, function(err, data) {
  // will actually read from `file`
});
```

Mock dependencies too.

**foo.js**
```
var request = require('request');

module.exports = function foo(url) {
  // do something with request
};
```

**test.js**
```js
var mockedRequest = function(url, options, callback) {
  // mock a request here
};

var foo = muk('./foo', {
  request: mockedRequest
});
```

You can also mock modules required with a relative path.

**foo.js**
```js
var bar = require('./bar');

module.exports = function() {
  // do something with bar
};
```

**test.js**
```js
var foo = muk('./foo', { './bar': 'hey!!' });
```


# Install

    npm install muk


# Tests
Tests are written with [mocha](http://visionmedia.github.com/mocha/)

```bash
npm test
```

# License
MIT
