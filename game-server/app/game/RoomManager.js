var RoomManager = function() {};

module.exports = RoomManager;


//state 房间状态，0：准备状态，1：正在游戏
//获取限制个数的游戏房间信息
RoomManager.fetchRoomInfo = function(sqlHelper, roomTable, callback) {
    sqlHelper.query('select * from ? where state = ? limit 6', [roomTable, 0], callback);
};