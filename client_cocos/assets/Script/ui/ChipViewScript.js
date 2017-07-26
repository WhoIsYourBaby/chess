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
        myPokerNodes: null,     //poker节点
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

    //绑定数据model
    //pokerList：牌数组
    //result：   结果数据
    bindPokers: function(pokerList, result) {
        this.myPokerList = pokerList;
        this.myResult = result;
    },

    //更新总下注金额、我的下注金额
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
        this.myPokerNodes = new Array();
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
            this.myPokerNodes.push(pkitem);
        }
    },

    pokerMoveOverCallback: function(pkitem) {
        //移动-》翻转显示正面
        var PokerItemSC = pkitem.getComponent('PokerItem');
        PokerItemSC.animationFlipTo(true, this.pokerFlipOverCallback, this);
    },

    pokerFlipOverCallback: function(pkitem) {
        //do nothing
    },


    //重置ChipView上的状态
    //移除上面的扑克、赌注
    resetState: function() {
        this.labelMine.string = '0';
        this.labelTotal.string = '0';
        if (this.myPokerNodes == null) {
            return ;
        }
        this.myPokerNodes.forEach(function(element) {
            element.parent = null;
            element.destroy();
        }, this);
        this.myPokerNodes = null;
    },
});
