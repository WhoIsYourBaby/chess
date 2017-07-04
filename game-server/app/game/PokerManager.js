

var PokerManager = function() {
    this.pokers = [];
};


module.exports = PokerManager;

//bool hasJoker, false则不会有joker
PokerManager.prototype.recreatePoker = function(hasJoker) {
    for (var index = 1; index <= 13; index++) {
        //color D:方块,C:梅花,B:红桃,A:黑桃,E:joker
        var arrColor = ['A','B','C','D'];
        for (var color = 0; color < 4; color++) {
            var card = {
                    color : arrColor[color],
                    value : index
                }
            this.pokers.push(card);
        }
    }

    if (hasJoker) {
        var jokerLittle = {
            color : 'F',
            value : -1,
        };
        this.pokers.push(jokerLittle);

        var jokerBig = {
            color : 'E',
            value : 0,
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

//发一张牌
PokerManager.prototype.dealOnePoker = function() {
    return this.pokers.pop();
}

//发count张牌
PokerManager.prototype.dealSomePoker = function(count) {
    var somepk = this.pokers.slice(-count);
    this.pokers.splice(-count, count);
    return somepk;
}