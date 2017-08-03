var GMResponse = require('../../../game/GMResponse.js');
var RoomManager = require('../../../game/RoomManager.js');
var JdnnRoom = require('../../../game/JdnnRoom.js');

module.exports = function (app) {
    return new JdnnRemote(app);
};

var JdnnRemote = function (app) {
    this.app = app;
    this.channelService = app.get('channelService');
};

//userid
//roomid 同时作为channelName
//sid 客户端连接的connector服务器id
//
JdnnRemote.prototype.joinRoom = function (userid, roomid, serverid, callback) {
    var channel = this.channelService.getChannel(roomid, false);
    if (channel) {
        var room = channel.gameRoom;
        channel.add(userid, serverid);
    } else {
        var response = new GMResponse(-3, '找不到指定房间 roomid:' + roomid);
        callback(response);
    }
};

JdnnRemote.prototype.createRoom = function (userid, roomdata, serverid, callback) {
    var channel = this.channelService.createChannel(roomdata.roomid);
    if (!channel.gameRoom) {
        var sqlHelper = this.app.get('sqlHelper');
        var room = new JdnnRoom(channel, sqlHelper, roomdata);
        channel.gameRoom = room;
    }
    if (callback) {
        callback();
    }
};