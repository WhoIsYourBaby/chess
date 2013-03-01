#pomelo-rpc - rpc framework for pomelo
pomelo-rpc是pomelo项目底层的rpc框架，提供了一个多服务器进程间进行rpc调用的基础设施。
pomelo-rpc分为客户端和服务器端两个部分。
客户端部分提供了rpc代理生成，消息路由和网络通讯等功能。
服务器端提供了远程服务暴露，请求派发，网络通讯等功能。

远程服务代码加载由pomelo-loader模块完成，相关规则可以参考https://github.com/node-pomelo/pomelo-loader

+ Tags: node.js

##安装
```
npm install pomelo-rpc
```

##用法
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
创建一个rpc server实例。根据配置信息加载远程服务代码，并生成底层acceptor。
###参数
+ opts.port - rpc server监听端口
+ opts.paths - 远程服务信息列表, [{namespace: 远程服务名字空间, path: 远程服务代码目录}, ...].
+ opts.context - 传递给远程服务的上下文信息。
+ opts.acceptorFactory(opts, msgCB) - （可选）opts.port：监听的端口，opts.services：已加载的远程服务集合，结构为：{namespace: {name: service}}。msgCB(msg, cb)：消息到达回调。该方法返回返回值为acceptor实例。

###server.start
启动rpc server实例。

###server.stop
停止rpc server实例，关闭底层的acceptor监听。

###Acceptor
负责rpc server底层的监听和rpc协议的具体实现。可以通过传入acceptorFactory来定制自己的acceptor，从而实现不同的rpc协议和策略。

###acceptor.listen(port)
让acceptor实例开始监听port端口。

###acceptor.close
关闭acceptor实例。

##Client API
###Client.create(opts)
创建一个rpc client实例。根据配置生成代理。
####参数
+ opts.paths - 被代理的远程服务信息列表，结构：[{namespace: 代理的名字空间, serverType: 远程服务器的类型, path: 远程接口的目录}]。
+ opts.servers - 全局服务器信息，结构：{serverType: [{serverId: 服务器id, host: 服务器host, port: 服务器端口(, 其他属性...)}]}。
+ opts.context - 传递给mailbox的上下文信息。
+ opts.routeContext - （可选）传递给router函数的上下文。
+ opts.router(routeParam, msg, routeContext, cb) - （可选）rpc消息路由函数。其中，routeParam是路由的相关的参数，对应于rpc代理第一个参数，可以通过这个参数传递请求用户的相关信息，如session; msg是rpc的描述消息; routeContext是opts.routeContext。
+ opts.mailBoxFactory(serverInfo, opts) - （可选）构建mailbox实例的工厂方法。

###client.start(cb)
启动rpc client实例，之后可以通过代理或rpcInvoke方法发起远程调用。

###client.stop
关闭rpc client实例，并停止底层所有mailbox。

###client.rpcInvoke(serverId, msg, cb)
直接发起rpc调用。
####参数
+ serverId - 远程服务器的id。
+ msg - rpc描述消息，格式：{namespace: 远程服务命名空间, serverType: 远程服务器类型, service: 远程服务名称, method: 远程服务方法名, args: 远程方法调用参数列表}。
+ cb - 远程服务调用结果回调。

###MailBox
负责rpc cliente底层的连接和rpc协议的具体实现。一个mailbox实例对应一个远程服务器。可以通过传入mailBoxFactory来定制自己的mailbox，从而实现不同的rpc协议和策略。

###mailbox.connect(cb)
让mailbox实例连接到目标服务器。

###mailbox.close
关闭mailbox实例。

###mailbox.send(msg, opts, cb)
让mailbox实例发送rpc消息到关联的远程服务器。
####参数
+ msg - rpc描述消息，参考clienet.rpcInvoke。
+ opts - send操作的附加选项，预留，暂时无用。
+ cb - rpc回调函数。