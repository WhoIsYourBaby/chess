var DouniuRoom = require('../../../game/DouniuRoom.js');
var GMResponse = require('../../../game/GMResponse.js');
var logger = require('pomelo-logger').getLogger('pomelo', __filename);

module.exports = function (app) {
	return new BrnnRemote(app);
};

var BrnnRemote = function (app) {
	this.app = app;
	this.channelService = app.get('channelService');
};

/**
 * Add user into brnn channel.
 *
 * @param {String} userid unique id for user
 * @param {String} sid server id
 * @param {String} name channel name
 * @param {boolean} flag channel parameter
 *
 */
BrnnRemote.prototype.add = function (userid, sid, name, flag, callback) {
	var channel = this.channelService.getChannel(name, flag);
	var param = {
		route: 'brnn.onAdd',
		userid: userid
	};
	channel.pushMessage(param);

	if (!!channel) {
		if (!channel.gameRoom) {
			var sqlHelper = this.app.get('sqlHelper');
			var room = new DouniuRoom(channel, sqlHelper);
			channel.gameRoom = room;
			channel.gameRoom.startGame();
		}
		channel.add(userid, sid);
		channel.gameRoom.joinUser(userid);
	}
	var users = this.get(name, flag);
	callback(new GMResponse(1, '加入房间成功', users));
};

/**
 * Get user from Brnn channel.
 *
 * @param {Object} opts parameters for request
 * @param {String} name channel name
 * @param {boolean} flag channel parameter
 * @return {Array} users userids in channel
 *
 */
BrnnRemote.prototype.get = function (name, flag) {
	var users = [];
	var channel = this.channelService.getChannel(name, flag);
	if (!!channel) {
		users = channel.getMembers();
	}
	return users;
};

/**
 * Kick user out brnn channel.
 *
 * @param {String} userids unique id for user
 * @param {String} sid server id
 * @param {String} name channel name
 *
 */
BrnnRemote.prototype.kick = function (userid, sid, name) {
	var channel = this.channelService.getChannel(name, false);
	// leave channel
	if (!!channel) {
		channel.leave(userid, sid);
		channel.gameRoom.kickUser(userid);
	}
	var param = {
		route: 'brnn.onLeave',
		user: userid
	};
	channel.pushMessage(param);
};


BrnnRemote.prototype.exit = function (userid, sid, roomid, callback) {
	var channelService = this.app.get('channelService');
	var channel = channelService.getChannel(roomid, false);
	if (!channel) {
		if (callback) {
			callback({
				code: 0,
				msg: '未找到指定房间'
			});
		}
		return;
	}
	channel.leave(userid, sid);
	channel.gameRoom.kickUser(userid);
	if (channel.getUserAmount() == 0) {
		channel.gameRoom.destroy();
		delete channel.gameRoom;
		channel.destroy();
		if (callback) {
			callback({
				code: 1,
				msg: '离开房间，房间被销毁'
			});
		}
		console.log("房间释放成功");
	} else {
		channel.pushMessage('brnn.onLeave', {
			code: 1,
			msg: '有用户离开房间',
			data: {
				userid: userid
			}
		});
		if (callback) {
			callback({
				code: 1,
				msg: '离开房间'
			});
		}
	}
};