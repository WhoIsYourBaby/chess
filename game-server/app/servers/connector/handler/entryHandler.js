
var UToken = require('../../../game/UToken.js');
var GMResponse = require('../../../game/GMResponse.js');

module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
		this.app = app;
};

var handler = Handler.prototype;

/**
 * New client entry brnn server.
 *
 * @param  {Object}   msg     request message{userid, rid}
 * @param  {Object}   session current session object
 * @param  {Function} next    next stemp callback
 * @return {Void}
 */
handler.enter = function(msg, session, next) {
	var rid = msg.rid;
	var uid = msg.userid + '*' + rid;
	var sessionService = this.app.get('sessionService');

	//duplicate log in
	if(!sessionService.getByUid(uid)) {
		session.bind(uid);
		session.set('rid', rid);
		session.push('rid', function(err) {
			if(err) {
				console.error('set rid for session service failed! error is : %j', err.stack);
			}
		});
		session.on('closed', onUserLeave.bind(null, this.app));
	}

	//put user into channel
	this.app.rpc.brnn.brnnRemote.add(session, uid, this.app.get('serverId'), rid, true, function(users){
		next(null, {
			users:users
		});
	});
};


/*
msg.rid		房间id(百人类型的大房间可以不需要rid，因为只有一个这样的房间)
msg.rtype	房间类型：brnn（百人牛牛）
msg.token	必须有效的token才能建立session
 */
handler.enterRoom = function(msg, session, next) {
	var tokenStr = msg.token;
	var token = new UToken();
	token.decrypt(tokenStr);
	var sessionService = this.app.get('sessionService');
	if (token.isValid() == false) {
		next(null, {
			code : -102,
			msg : '无效的token'
		});
		sessionService.kickBySessionId(session.id);
		return ;
	}

	var rid = msg.rid;
	
	//duplicate log in
	if(!sessionService.getByUid(token.userid)) {
		session.bind(token.userid);
		session.set('rid', rid);
		session.push('rid', function(err) {
			if(err) {
				console.error('set rid for session service failed! error is : %j', err.stack);
			}
		});
		session.on('closed', onUserLeave.bind(null, this.app));
	}

	if (msg.rtype == 'brnn') {
		//put user into channel
		this.app.rpc.brnn.brnnRemote.add(session, token.userid, this.app.get('serverId'), msg.rtype, true, function(users){
			next(null, {
				users:users
			});
		});
	}
};

/**
 * User log out handler
 *
 * @param {Object} app current application
 * @param {Object} session current session object
 *
 */
var onUserLeave = function(app, session) {
	if(!session || !session.uid) {
		return;
	}
	app.rpc.brnn.brnnRemote.exit(session, session.uid, app.get('serverId'), session.get('rid'), null);
};


handler.exit = function(msg, session, next) {
	this.app.rpc.brnn.brnnRemote.exit(session, session.uid, this.app.get('serverId'), session.get('rid'), function(res) {
		next(null, res);
	});
};