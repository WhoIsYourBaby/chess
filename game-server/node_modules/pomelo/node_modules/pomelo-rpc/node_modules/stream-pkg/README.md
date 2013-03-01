#Stream-pkg

Stream-pkg is a simple tool for packages that transfered on stream-based API. 

As we known, stream API is a good thing of Node.js and we could compose different applications by stream-based API conventionally. And package may be splited into small chunks when it transfered on stream-based API such as socket. We have to recompose the chunks into package when we receive them. But we have to do some jobs to find out when we get enough data to recover the original package. 

Stream-pkg add a simple header for each package and the header uses variable length to record the length of the package. The header contains several bytes. The highest bit of each byte indicates whether current byte is the last byte of the header. 0 for so and 1 for not. And the low 7 bits are the data of the length value. We can read the length of package from the header and then recover the package from the rest of data. And inside stream-pkg, we use a FSM to figure out when we should parse the header part and when we should parse the data part.

##Installation
```
npm install stream-pkg
```

##Usage
``` javascript
var Composer = require('stream-pkg');

var src = 'Hello world.';
var comp = new Composer();
// package to data
var res = comp.compose(src);

// data to package
comp.on('data', function(data) {
	var str = data.toString('utf-8');
	str.should.equal(src);
	done();
});
comp.feed(res);
``` 

And we can use stream-pkg in a socket-based echo server and client as below:

###sever.js
``` javascript
var net = require('net');
var Composer = require('stream-pkg');

var server = net.createServer(function(socket) {

  var composer = new Composer();

  composer.on('data', function(pkg) {
    console.log('package receive: %j', pkg.toString());
    socket.write(composer.compose(pkg));
  });

  socket.on('data', function(data) {
    composer.feed(data);
  });

  socket.on('end', function(data) {
    composer.feed(data);
    socket.end();
    server.close();
  });
});

server.listen(8888);
```

###client.js
``` javascript
var net = require('net');
var Composer = require('stream-pkg');

var client = net.connect({port: 8888});

var composer = new Composer();
var count = 3;
var src = 'hello world!';
var revCount = 0;

composer.on('data', function(pkg) {
  if(pkg.toString() === src) {
    console.log('ok');
  } else {
    console.log('fail');
  }

  revCount++;

  if(revCount >= count) {
    client.end();
  }
});

client.on('data', function(data) {
  composer.feed(data);
});

for(var i=0; i<count; i++) {
	client.write(composer.compose(src));
}
```

##API
###composer.compose(pkg)
Compose package into byte data. 
####Arguments
+ pkg - String or Buffer. Package data.
+ return - Buffer that fill with package data.

###composer.feed(data, [offset], [end])
Feed data into composer. 
####Arguments
+ data - Buffer. Next chunnk of data receive from stream. 
+ offset - Number. Optional. Offset index of buffer that start to feed. Default is 0.
+ end - Number. Optional. End index (not includ) of buffer that stop to feed. Default is data.length.

##Event
###'data'(pkg)
Emit package by data event when the package has finished.
###'length_limit'(composer, data, offset)
Emit when the package exceeds the limit of package size.