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
JdnnRemote.prototype.joinRoom = function (userid, roomid, serverid, callback) {
    var channel = this.channelService.getChannel(roomid, false);
    if (channel) {
        var room = channel.gameRoom;
        if (room.hasUser(userid)) {
            callback(new GMResponse(-2, '不能重复加入房间'));
            return ;
        }
        if (parseInt(room.roomdata.usercount) >=4) {
            callback(new GMResponse(-2, '房间人数已满'));
            return ;
        }
        //先通知房间内用户有新人加入
        var param = {
            route: 'jdnn.onAdd',
            userid: userid
        };
        channel.pushMessage(param);
        room.joinUser(userid);
        channel.add(userid, serverid);
        //返回房间内用户id列表
        var response = new GMResponse(1, '成功加入房间', {userList : room.roomdata.users.split(',')});
        callback(response);
    } else {
        var response = new GMResponse(-3, '找不到指定房间 roomid:' + roomid);
        callback(response);
    }
};

JdnnRemote.prototype.createRoom = function (userid, roomdata, callback) {
    var channel = this.channelService.createChannel(roomdata.roomid);
    if (!channel.gameRoom) {
        var sqlHelper = this.app.get('sqlHelper');
        var room = new JdnnRoom(channel, sqlHelper, roomdata);
        channel.gameRoom = room;
    }
    callback();
};


JdnnRemote.prototype.exit = function (userid, serverid, name, callback) {
    var channel = this.channelService.getChannel(name);
    var jdroom = channel.gameRoom;
    jdroom.exitUser(userid, serverid);
};