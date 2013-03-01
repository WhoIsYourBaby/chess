#pomelo-rpc - rpc framework for pomelo

pomelo-rpc is the low level RPC framework for pomelo project. It contains two parts: client and server.

The client part generates the RPC client proxy, routes the message to the appropriate remote server and manages the network communications.

The server part exports the remote services, dispatches the remote requests to the services and also manages the network communications.

And the remote service codes would loaded by pomelo-loader module and more details please access this [link](https://github.com/node-pomelo/pomelo-loader).

+ Tags: node.js

##Installation
```
npm install pomelo-rpc
```

##Usage
###Server
``` javascript
var Server = require('pomelo-rpc').server;

// remote service path info list
var paths = [
  {namespace: 'user', path: __dirname + '../../mock-remote/area'},
  {namespace: 'sys', path: __dirname + '../../mock-remote/connector'}
];
var port = 3333;

var server = Server.create({paths: paths, port: port});
server.start();
console.log('rpc server started.');
```

###Client
``` javascript
var Client = require('pomelo-rpc').client;

// remote service interface path info list
var paths = [
  {namespace: 'user', serverType: 'area', path: __dirname + '../../mock-remote/area'},
  {namespace: 'sys', serverType: 'connector', path: __dirname + '../../mock-remote/connector'}
];

// global server info list
var servers = {
  'area': [
    {id: 'area-servere-1', host: '127.0.0.1',  port: 3333}
  ],
  'connector': [
    {id: 'connector-server-1', host: '127.0.0.1',  port: 4444},
    {id: 'connector-server-2', host: '127.0.0.1',  port: 5555}
  ]
};

var client = Client.create({paths: paths, servers: servers}});

client.start(function(err) {
  console.log('rpc client start ok.');
});
```

##Server API
###Server.create(opts)
Create a RPC server instance. Intitiate the instance and acceptor with the configure.
###Parameters
+ opts.port - rpc server listening port.
+ opts.paths - remote service path infos, format: [{namespace: remote service namespace, path: remote service path}, ...].
+ opts.context - remote service context.
+ opts.acceptorFactory(opts, msgCB) - (optional) acceptor factory method. opts.port：port that acceptor would listen，opts.services：loaded remote services，format: {namespace: {name: service}}. msgCB(msg, cb): remote request arrived callback. the method should return a acceptor instance.

###server.start
Start the remote server instance.

###server.stop
Stop the remote server instance and the acceptor.

###Acceptor
Implement the low level network communication with specified protocol. Customize the protocol by passing an acceptorFactory to return different acceptors.

###acceptor.listen(port)
Listen the specified port.

###acceptor.close
Stop the acceptor.

##Client API
###Client.create(opts)
Create an RPC client instance which would generate proxies for the RPC client.
####Parameters
+ opts.paths - remote service path infos, format: [{namespace: proxy namespace, serverType: remote server type, path: remote service path}].
+ opts.servers - global server infos, format: {serverType: [{serverId: server id, host: server host, port: server port}]}.
+ opts.context - context for mailbox.
+ opts.routeContext - (optional)context for route function.
+ opts.router(routeParam, msg, routeContext, cb) - (optional) route function which decides the RPC message should be send to which remote server. routeParam: route parameter, msg: RPC descriptioin message, routeContext: opts.routeContext.
+ opts.mailBoxFactory(serverInfo, opts) - (optional) mail box factory method.

###client.start(cb)
Start the RPC client.

###client.stop
Stop the RPC client and stop all the mail box connections to remote servers.

###client.rpcInvoke(serverId, msg, cb)
Invoke an RPC request.
####Parameters
+ serverId - remote server id.
+ msg - RPC description message. format: {namespace: remote service namespace, serverType: remote server type, service: remote service name, method: remote service method name, args: remote service args}.
+ cb - remote service callback function.

###MailBox
Implement the low level network communication with remote server. A mail box instance stands for a remote server. Customize the protocol by passing a mailBoxFactory parameter to client to return different mail box instances.

###mailbox.connect(cb)
Connect to the remote server.

###mailbox.close
Close mail box instance and disconnect with the remote server.

###mailbox.send(msg, opts, cb)
Send the RPC message to the associated remote server.
####Parameters
+ msg - RPC description message, see also clienet.rpcInvoke.
+ opts - reserved.
+ cb - RPC callback function.