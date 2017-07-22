require("../pomelo/pomelo-client");

var GateConnector = function () {}

module.exports = GateConnector;


//guest login on gate
GateConnector.gateGuestLogin = function(host, port, callback) {
    pomelo.init({
            host: host,
            port: port,
            user: {},
            handshakeCallback: function () { }
        }, function () {
            pomelo.request('gate.gateHandler.guestLogin', {}, function (data) {
                pomelo.userinfo = data['data']['userinfo'];
                pomelo.connector = data['data']['connector'];
                pomelo.token = data['data']['token'];
                pomelo.disconnect();
                if (typeof callback === 'function') {
                    callback(data);
                }
            });
        });
}

GateConnector.connectToConnector = function(callback) {
    var host = pomelo.connector.host;
    var port = pomelo.connector.port;
    pomelo.init({
            host: host,
            port: port,
            user: {},
            handshakeCallback: function () { }
        }, callback);
}

//rtype room type
//rid   room id
GateConnector.connectorEnterRoom = function (rtype, rid, callback) {
    var data = {};
    data.token = pomelo.token;
    data.rtype = rtype;
    if (rid != null) {
        data.rid = rid;
    }
    pomelo.request('connector.entryHandler.enterRoom', data, callback);
}

GateConnector.connectorExit = function(callback) {
    pomelo.request('connector.entryHandler.exit', callback);
}