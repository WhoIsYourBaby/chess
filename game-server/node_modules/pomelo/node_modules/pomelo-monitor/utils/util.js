/**
 * convert Date as  yyyy-mm-dd hh:mm:ss
 */
function formatTime(date) {
	var n = date.getFullYear(); 
	var y = date.getMonth() + 1;
	var r = date.getDate(); 
	var mytime = date.toLocaleTimeString(); 
	var mytimes = n+ "-" + y + "-" + r + " " + mytime;
  return mytimes;
}
module.exports.formatTime = formatTime;
