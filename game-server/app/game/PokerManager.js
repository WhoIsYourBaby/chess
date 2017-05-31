

var PokerManager = function() {
    this.pokers = [];
};


module.exports = PokerManager;

//bool hasJoker, false则不会有joker
PokerManager.prototype.recreatePoker = function(hasJoker) {
    //color 1:黑桃,2:方块,3:梅花,4:红桃,0:joker
    for (var index = 1; index <= 13; index++) {
        for (var color = 1; color <= 4; color++) {
            var card = {
                    color : color,
                    value : index
                }
            this.pokers.push(card);
        }
    }

    if (hasJoker) {
        var jokerLittle = {
            color : 0,
            value : 0,
        };
        this.pokers.push(jokerLittle);

        var jokerBig = {
            color : 0,
            value : 1,
        };
        this.pokers.push(jokerBig);
    }
}


//洗牌
PokerManager.prototype.randomPoker = function() {
    //随机轮训5次洗牌
    for (var index = 0; index < 5; index++) {
        //与随机顺序的牌置换位置
        for (var cindex = 0; cindex < this.pokers.length; cindex++) {
            var temp = this.pokers[cindex];
            var rindex = Math.floor(Math.random() * this.pokers.length);
            this.pokers[cindex] = this.pokers[rindex];
            this.pokers[rindex] = temp;
        }
    }
};

PokerManager.prototype.getPokers = function() {
    return this.pokers;
};

PokerManager.prototype.dealPoker = function() {
    var poker = this.pokers[this.pokers.length - 1];
    this.pokers.pop();
    return poker;
}