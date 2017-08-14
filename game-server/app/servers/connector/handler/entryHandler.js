
var UToken = require('../../../game/UToken.js');
var GMResponse = require('../../../game/GMResponse.js');
var RoomManager = require('../../../game/RoomManager.js');

module.exports = function (app) {
	return new Handler(app);
};

var Handler = function (app) {
	this.app = app;
};

var handler = Handler.prototype;

/*
msg.rid		房间id(百人类型的大房间可以不需要rid，因为只有一个这样的房间)
msg.rtype	房间类型：brnn（百人牛牛）
msg.token	必须有效的token才能建立session
 */
handler.enterRoom = function (msg, session, next) {
	var tokenStr = msg.token;
	var token = new UToken();
	token.decrypt(tokenStr);
	var sessionService = this.app.get('sessionService');
	if (token.isValid() == false) {
		next(null, {
			code: -102,
			msg: '无效的token'
		});
		sessionService.kickBySessionId(session.id);
		return;
	}

	if (msg.rtype == 'brnn') {
		var rid = msg.rtype;		//brnn不需要rid，用rtype作为rid
		//duplicate log in
		if (!sessionService.getByUid(token.userid)) {
			session.bind(token.userid);
			session.set('rid', rid);
			session.push('rid', function (err) {
				if (err) {
					console.error('set rid for session service failed! error is : %j', err.stack);
				}
			});
			session.on('closed', brnnOnUserLeave.bind(null, this.app));
		}
		//put user into channel
		this.app.rpc.brnn.brnnRemote.add(session, token.userid, this.app.get('serverId'), msg.rtype, true, function (users) {
			next(null, {
				users: users
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
var brnnOnUserLeave = function (app, session) {
	if (!session || !session.uid) {
		return;
	}
	app.rpc.brnn.brnnRemote.exit(session, session.uid, app.get('serverId'), session.get('rid'), null);
};


handler.exit = function (msg, session, next) {
	this.app.rpc.brnn.brnnRemote.exit(session, session.uid, this.app.get('serverId'), session.get('rid'), function (res) {
		next(null, res);
	});
};


/**
 * for 多个游戏选择
 */

/*
获取不同游戏的房间list信息
msg.rtype	房间类型：jdnn（经典牛牛），zjh（扎金花），bjl（百家乐）
 */
handler.fetchRoomInfo = function (msg, session, next) {
	var sqlHelper = this.app.get('sqlHelper');
	RoomManager.fetchRoomInfo(sqlHelper, msg.rtype, function (error, roomsData) {
		if (error) {
			var response = new GMResponse(-100, '获取房间信息失败', error);
			next(null, response);
		} else {
			var response = new GMResponse(1, 'OK', roomsData);
			next(null, response);
		}
	});
};

//根据rtype创建不同类型的房间，
//rtype:游戏类型
//user:查找这个userid创建的房间
handler.createRoom = function (msg, session, next) {
	var tokenStr = msg.token;
	var token = new UToken();
	token.decrypt(tokenStr);
	var sessionService = this.app.get('sessionService');
	if (token.isValid() == false) {
		next(null, {
			code: -102,
			msg: '无效的token'
		});
		sessionService.kickBySessionId(session.id);
		return;
	}

	if (!sessionService.getByUid(token.userid)) {
		session.bind(token.userid);
		session.on('closed', this.exitGame.bind(null, this.app));
	}
	var sqlHelper = this.app.get('sqlHelper');
	var self = this;
	RoomManager.fetchRoomCreatedByUser(sqlHelper, msg.userid,
		function (error, roomdata) {
			if (error) {
				var response = new GMResponse(-100, '获取该用户创建的房间失败', error);
				next(null, response);
				return;
			}
			if (roomdata) {
				var response = new GMResponse(2, '不能重复创建房间', roomdata);
				next(null, response);
			} else {
				RoomManager.createRoom(sqlHelper, msg.rtype, msg.userid,
					function (error, roomdata) {
						if (error) {
							var response = new GMResponse(-100, '创建房间失败', error);
							next(null, response);
						} else {
							if (msg.rtype == 'jdnn') {
								self.app.rpc.jdnn.jdnnRemote.createRoom(session, msg.userid, roomdata, function () {
									var response = new GMResponse(1, '成功创建房间', roomdata);
									next(null, response);
								});
							}
						}
					}
				);
			}
		}
	);
};

//userid 用户id
//roomid 房间id
//rtype	 房间type,brnn、jdnn、zjh、bjl
handler.joinRoom = function (msg, session, next) {
	var tokenStr = msg.token;
	var token = new UToken();
	token.decrypt(tokenStr);
	var sessionService = this.app.get('sessionService');
	if (token.isValid() == false) {
		next(null, {
			code: -102,
			msg: '无效的token'
		});
		sessionService.kickBySessionId(session.id);
		return;
	}

	if (!sessionService.getByUid(token.userid)) {
		session.bind(token.userid);
		session.on('closed', this.exitGame.bind(null, this.app));
	}
	session.set('roomid', msg.roomid);
	session.set('rtype', msg.rtype);
	session.pushAll(function(error) {
		console.error(error);
	});
	if (msg.rtype == 'jdnn') {
		this.app.rpc.jdnn.jdnnRemote.joinRoom(session, msg.userid, msg.roomid, this.app.get('serverId'), function (res) {
			next(null, res);
		});
	}

	if (msg.rtype == 'brnn') {
		this.app.rpc.brnn.brnnRemote.add(session, token.userid, this.app.get('serverId'), msg.rtype, true, function (res) {
			next(null, res);
		});
	}
};

handler.exitGame = function (app, session) {
	//判断session是否有绑定的roomid
	//如果没有则直接断开连接
	//如果有则要退出房间并调用不同的remote的exit方法
	if (!session || !session.uid) {
		return;
	}
	if (session.get('rtype') == 'brnn') {
		app.rpc.brnn.brnnRemote.exit(session, session.uid, app.get('serverId'), session.get('rtype'), null);	
	}
	if (session.get('rtype') == 'jdnn') {
		app.rpc.jdnn.jdnnRemote.exit(session, session.uid, app.get('serverId'), session.get('roomid'), null);	
	}
};


handler.fetchUserInfo = function(msg, session, next) {
	var uidArr = msg.userList;
	var sqlHelper = this.app.get('sqlHelper');
	RoomManager.fetchUserInfo(sqlHelper, uidArr,
		function (error, results) {
			var response = new GMResponse(1, '获取用户信息成功', results);
			next(null, response);
		}
	);
};