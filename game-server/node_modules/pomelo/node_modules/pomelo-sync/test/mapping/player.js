module.exports = player = {};

   player.updateUser=function(client,val,cb){
		console.error(' updatewrite ' + JSON.stringify(val)+ '  ' + val.x+ '  ' +val.y + '  ' +val.uid);
		var sql = 'update Hero set x = ? ,y = ? ,sceneId = ? where id = ?';
		var args = [val.x, val.y, val.sceneId, val.uid];
		client.query(sql, args, function(err, res){
				if(err !== null){
				console.error('write mysql failed!　' + sql + ' ' + JSON.stringify(val));
				} else {
				console.info('write mysql success! flash dbok ' + sql + ' ' + JSON.stringify(val));
				cb();
				}
				});
	}

