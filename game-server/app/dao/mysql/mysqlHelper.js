
/*
对于callback的普适性：
第一个参数是error，第二个参数是正确返回的数据
一般情况下，两者仅有一个有效
*/
var mysqlHelper = function(app){
    var mysqlConfig = app.get('mysql');
    var mysql = require('mysql');
    var pool  = mysql.createPool(mysqlConfig);
    this.pool = pool;
};

module.exports = mysqlHelper;

mysqlHelper.prototype.query = function(sqlString, values, callback){
    console.log('######' + sqlString + values + '######');
    if (values) {
        this.pool.query(sqlString, values, callback);
    } else {
        this.pool.query(sqlString, callback);
    }
};


mysqlHelper.prototype.guestLogin = function(callback) {
	var sql = "insert into t_user () values ();";
	this.query(sql, null, function(err, results, fileds){
        if (err) {
            callback(err, results);
        } else {
            var userid = results['insertId'];
            this.queryUserInfo(userid, callback);
        }
    }.bind(this));
};


mysqlHelper.prototype.queryUserInfo = function(userid, callback) {
    var sqlString = "select * from t_user where userid = '?'";
    this.query(sqlString, [userid], function(err, results, fileds){
        if (results.length > 0) {
            callback(err, results[0]);
        } else {
            callback("没有该用户", null);
        }
    });
};


//事务入口
mysqlHelper.prototype.beginTransaction = function(callback) {
    this.pool.getConnection(callback);
}

//根据用户输赢更新数据库，并返回用户的金币总额
mysqlHelper.prototype.updateUsersGold = function(ugoldResults, callback){
    this.beginTransaction(function(err, connection) {
        if (err) {
            if (callback) {
                callback(err);   
            }
            return;
        }
        var userids = [];
        for (var index = 0; index < ugoldResults.length; index++) {
            var element = ugoldResults[index];
            var userid = element.userid;
            userids.push(userid);
            var getGold = element.getGold;
            var sqlString = "update t_user set gold = IF(gold + '?' < 0, 0, gold + '?') where userid = ?;";
            connection.query(sqlString, [getGold, getGold, userid]);
        }

        var useridString = userids.join(',');
        var sqlString = "select userid, gold from t_user where userid in(" + useridString + ");";
        console.log(sqlString);
        connection.query(sqlString, function(err, results, fileds) {
            if (!err) {
                for (var index = 0; index < ugoldResults.length; index++) {
                    var element = ugoldResults[index];
                    var dbElement = results[index];
                    element.totalGold = dbElement.gold;
                }
            }
        });
        connection.commit(function(err) {
            if (err) {
                connection.rollback();
                callback(err, ugoldResults);
            } else {
                if (callback) {
                    callback(null, ugoldResults);
                }
            }
        });
    });
};