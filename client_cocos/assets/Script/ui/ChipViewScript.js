cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...

        labelTotal : {
            default: null,
            type: cc.Label
        },

        labelMine : {
            default: null,
            type: cc.Label
        },

        pokerPrefab: {
            default: null,
            type: cc.Prefab
        },

        //扑克起始点的世界坐标系
        pokerPosFromWorld: {
            default: new cc.Vec2(1000, 450),
        },

        myPokerList: null,    //发牌的数据
        myResult: null,
    },

    // use this for initialization
    onLoad: function () {
        var self = this;
        cc.loader.loadRes('prefab/PokerItem', function(error, pref){
            if (error) {
                console.error(error);
                return ;
            }
            self.pokerPrefab = pref;
        });
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    bindPokers: function(pokerList, result) {
        this.myPokerList = pokerList;
        this.myResult = result;
    },

    updateGold: function(mine, total) {
        if (total) {
            this.labelTotal.string = total;
        }
        
        this.labelMine.string = mine;
    },

    //延迟一定时间开始发牌动画
    pokerAnimationDelay: function (delay) {
        if (this.myPokerList.length <= 0) {
            return ;
        }
        for (var index = 0; index < this.myPokerList.length; index++) {
            var element = this.myPokerList[index];
            var pkitem = cc.instantiate(this.pokerPrefab);
            pkitem.parent = this.node;
            var fromPos = this.node.convertToNodeSpace(this.pokerPosFromWorld);
            pkitem.setPosition(fromPos);
            var PokerItemSC = pkitem.getComponent('PokerItem');
            PokerItemSC.bindPokerModel(element);
            var viewsize = this.node.getContentSize();
            var pksize = pkitem.getContentSize();
            var posTo = new cc.Vec2((index-2) * pksize.width * 0.8, 0);
            PokerItemSC.animationMoveTo(delay + index * 0.1, posTo, this.pokerMoveOverCallback, this);
        }
    },

    pokerMoveOverCallback: function(pkitem) {
        var PokerItemSC = pkitem.getComponent('PokerItem');
        PokerItemSC.animationFlipTo(true, this.pokerFlipOverCallback, this);
    },

    pokerFlipOverCallback: function(pkitem) {

    },
});
