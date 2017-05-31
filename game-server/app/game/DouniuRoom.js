//绑定的room
var DouniuRoom = function(channel) {
  this.channel = channel;
  this.userList = [];
};

module.exports = DouniuRoom;

//需要在外部对channel新增uid
DouniuRoom.prototype.joinUser = function(usermodel) {
    this.userList.push(usermodel);
};

//需要在外部对channel删除uid
DouniuRoom.prototype.kickUser = function(usermodel) {
  for (var index = 0; index < this.userList.length; index++) {
    var element = this.userList[index];
    if (element == usermodel) {
      this.userList.spice(index, 1);
    }
  }
};


DouniuRoom.prototype.startGame = function() {};