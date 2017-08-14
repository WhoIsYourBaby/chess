var GMResponse = require('../../../game/GMResponse.js');
var RoomManager = require('../../../game/RoomManager.js');
var JdnnRoom = require('../../../game/JdnnRoom.js');

module.exports = function (app) {
	return new JdnnHandler(app);
};

var JdnnHandler = function (app) {
	this.app = app;
	this.channelService = app.get('channelService');
};

JdnnHandler.prototype.ready = function (msg, session, next) {
	var channel = this.channelService.getChannel(msg.roomid);
	var jdroom = channel.gameRoom;
	var readyList = jdroom.userReady(msg.userid, msg.ready);
	if (readyList == null) {
		var response = new GMResponse(-100, '用户不在该房间', null);
		next(null, response);
	} else {
		var response = new GMResponse(1, 'OK', jdroom.getReadyList());
		next(null, response);
	}
};

JdnnHandler.prototype.chipIn = function (msg, session, next) {
	var channel = this.channelService.getChannel(msg.roomid);
	var jdroom = channel.gameRoom;
	if (jdroom.chipIn(msg.userid, msg.muti)) {
		var response = new GMResponse(1, '选择倍数: ' + msg.muti, {muti: msg.muti});
		next(null, response);
	} else {
		var response = new GMResponse(-100, '用户不在该房间或该时间不可进行的操作', null);
		next(null, response);
	}
};