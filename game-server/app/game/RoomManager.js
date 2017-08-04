var RoomManager = function() {};

module.exports = RoomManager;


//state 房间状态，0：准备状态，1：正在游戏
//rtype 房间游戏类型--(jdnn,zjh,bjl)
//获取限制个数的游戏房间信息
RoomManager.fetchRoomInfo = function (sqlHelper, rtype, callback) {
    var sqlstring = "select * from t_room where rtype = '" + rtype + "' limit 6;";
    sqlHelper.query(sqlstring, null,
        function (error, results, fields) {
            callback(error, results);
        }
    );
};


RoomManager.fetchRoomCreatedByUser = function (sqlHelper, userid, callback) {
    var sqlstring = "select * from t_room where creator = '" + userid + "';";
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

RoomManager.fetchRoomJoinedByUser = function (sqlHelper, userid, callback) {
    var sqlstring = "select * from t_room where users like '%" + userid + "%';";
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


RoomManager.createRoom = function (sqlHelper, rtype, userid, callback) {
    var time = new Date().getTime();
    var params = {rtype:rtype, createtime: time, creator:userid, cost:1, state:0};
    var sqlstring = 'insert into t_room SET ?';
    sqlHelper.query(sqlstring, params, 
        function (error, results, fields) {
            if (error) {
                callback(error, results);
            } else {
                RoomManager.fetchRoomCreatedByUser(sqlHelper, userid, callback);
            }
        }
    );
};


//获取多个用户信息
//uidArr    用户id数组
RoomManager.fetchUserInfo = function (sqlHelper, uidArr, callback) {
    var uidstring = uidArr.join(",");
    var sqlstring = 'select * from t_user where userid in (' + uidstring + ')';
    sqlHelper.query(sqlstring, null,
        function (error, results, fields) {
            callback(error, results);
        }
    );
}