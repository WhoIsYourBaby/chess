# pomelo-unitychat

a pomelo unity chat sample

* pure c# code
* support proto,dict cache
* poll mode only and all delegate at main thread
* support tls
* use LitJson

you can use [pomelo's proto generator](https://github.com/flamefox/pomeloc) to generate the stub msg

## TestServer

Use the sample server at this link [https://github.com/NetEase/chatofpomelo-websocket].
or use submodule just 
```
cd game-server
npm install -d
node app
```


## TLS/SSL EASY USE

client:
```C#
pomeloBehaviour client;
client.ConnectServer(host, port, Pomelo.DotNetClient.ClientProtocolType.TLS);
```

server: 
```javascript
//app.js
app.set('connectorConfig',{
	connector: pomelo.connectors.hybridconnector,
	useDict: true,

	// enable useProto
	useProtobuf: true

	,ssl: {
		ca: [fs.readFileSync('./keys/out/CA/ca.crt')],
		pfx: fs.readFileSync('./keys/out/newcert/server.pfx'),
		// This is necessary only if using the client certificate authentication.
		//requestCert: true,
		//rejectUnauthorized: true
	}
});
```

if you want change the verify of the server, change the code of 
```
TransporterSSL.ValidateServerCertificate
```


## Test with

unity 5.6.0
pomelo 2.2.x
Windows

## install

just run the newest chatofpomelo-websocket game-server, and open the project with untiy3d and play it.

## known issue

~~sometime unity socket BeginConnect will not return(maybe Unity Editor's bug[[TCP Socket Async BeginSend never happens](http://answers.unity3d.com/questions/892371/tcp-socket-async-beginsend-never-happens.html)]), re-compile script or restart will fix this~~
