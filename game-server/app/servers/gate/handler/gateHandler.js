var UToken = require('../../../game/UToken.js');


module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
	this.app = app;
};

var handler = Handler.prototype;

/**
 * Gate handler that dispatch user to connectors.
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param {Function} next next stemp callback
 *
 */
handler.queryEntry = function(msg, session, next) {
	var userid = msg.userid;
	if(!userid) {
		next(null, {
			code: 500
		});
		return;
	}
	// get all connectors
	var connectors = this.app.getServersByType('connector');
	if(!connectors || connectors.length === 0) {
		next(null, {
			code: 500
		});
		return;
	}
	// here we just start `ONE` connector server, so we return the connectors[0] 
	var res = connectors[0];
	next(null, {
		code: 200,
		host: '39.108.83.192',
		port: res.clientPort
	});
};


handler.guestLogin = function(msg, session, next){
	var sqlHelper = this.app.get('sqlHelper');//获取全局mysql client
	sqlHelper.guestLogin(function(err, userinfo){
		console.log(userinfo);
		var token = new UToken(userinfo.userid);
		if (err) {
			//失败
			next(null, {
				code : -101,
				msg : '游客登录失败，请重试'
			});
		} else {
			next(null, {
					code : 1,
					msg : 'ok',
					data : {
						userinfo : userinfo,
						token : token
					}
			});
		}
	});
}