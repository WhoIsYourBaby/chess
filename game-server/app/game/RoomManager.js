var RoomManager = function() {};

module.exports = RoomManager;


//state 房间状态，0：准备状态，1：正在游戏
//获取限制个数的游戏房间信息
// where state = '?' limit 6
RoomManager.fetchRoomInfo = function (sqlHelper, roomTable, callback) {
    var sqlstring = 'select * from ' + roomTable;
    sqlHelper.query(sqlstring, null,
        function (error, results, fields) {
            callback(error, results);
        }
    );
};


RoomManager.fetchRoomCreatedByUser = function (sqlHelper, roomTable, userid, callback) {
    var sqlstring = 'select * from ' + roomTable + " where creator = '" + userid + "';";
    sqlHelper.query(sqlstring, null,
        function (error, results, fields) {
            if (callback) {
                var roomdata = null;
                if (results) {
                    roomdata = results[0];
                }
                callback(error, roomdata);
            }
        }
    );
};


RoomManager.createRoom = function (sqlHelper, roomTable, userid, callback) {
    var time = new Date().getTime();
    var params = {createtime: time, users:'U'+userid, creator:userid, cost:1, banker:userid, state:0};
    var sqlstring = 'insert into ' + roomTable + ' SET ?';
    sqlHelper.query(sqlstring,
        params, function (error, results, fields) {
            if (error) {
                callback(error, results);
            } else {
                RoomManager.fetchRoomCreatedByUser(sqlHelper, roomTable, userid, callback);
            }
        }
    );
};