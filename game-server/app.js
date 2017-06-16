var pomelo = require('pomelo');
/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'chatofpomelo-websocket');

// app configuration
app.configure('production|development', 'connector', function(){
	app.set('connectorConfig',
		{
			connector : pomelo.connectors.hybridconnector,
			heartbeat : 10,
		});
});

app.configure('production|development', 'gate', function(){
	app.set('connectorConfig',
		{
			connector : pomelo.connectors.hybridconnector,
			useProtobuf : true
		});
});

app.loadConfig("mysql", app.getBase() + "/config/mysql.json"); // 添加配置
//mysql 应该是对所有服务器都要生效
app.configure('production|development', function () {
    var Helper = require("./app/dao/mysql/mysqlHelper"); // 初始化dbclient
	var sqlHelper = new Helper(app);
    app.set("sqlHelper", sqlHelper);// dbclient 为外部数据库接口，app,get("dbclient") 来使用
})

// start app
app.start();

process.on('uncaughtException', function(err) {
	console.error(' Caught exception: ' + err.stack);
});
