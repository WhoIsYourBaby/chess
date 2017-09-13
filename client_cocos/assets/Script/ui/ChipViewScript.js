

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
            default: null,
            visible: false
        },

        myPokerList: null,    //发牌的数据
        myResult: null,
        myPokerNodes: null,     //poker节点数组
        myChipItemNodes: null,  //筹码节点数组
    },

    // use this for initialization
    onLoad: function () {
        this.pokerPosFromWorld = new cc.Vec2(cc.winSize.width/2-150,cc.winSize.height/2-30);
        this.myChipItemNodes = new Array();
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
        if (this.labelMine != null) {
            this.labelMine.string = '0';   
        }
        if (this.labelTotal != null) {
            this.labelTotal.string = '0';
        }
        if (this.myPokerNodes == null) {
            return ;
        }
        this.myPokerNodes.forEach(function(element) {
            element.parent = null;
            element.destroy();
        }, this);
        this.myPokerNodes = null;

        this.myChipItemNodes.forEach(function(element) {
            element.parent = null;
            element.destroy();
        }, this);
        this.myChipItemNodes = new Array();
    },

    /*
    nntype表示用户牌型
    炸弹(6) > 五小(5) > 五花(4) > 四花(3) > 牛牛(2) > 有牛(1) > 没牛(0)
    niuN
    牌面大小
    */
    showNiuNiu: function () {
        //牌型大小
        var muti = 1;
        var resName = 'png/nm';
        if (this.myResult.nntype == 6) {
            resName = 'png/nzd';
            muti = 8;
        }
        if (this.myResult.nntype == 5) {
            resName = 'png/nwx';
            muti = 6;
        }
        if (this.myResult.nntype == 4) {
            resName = 'png/nwh';
            muti = 5;
        }
        if (this.myResult.nntype == 3) {
            resName = 'png/nsh';
            muti = 4;
        }
        if (this.myResult.nntype == 2) {
            resName = 'png/nn';
            muti = 3;
        }
        if (this.myResult.nntype == 1) {
            //有牛区分牛几
            resName = 'png/n' + this.myResult.niuN;
            if (this.myResult.niuN >= 7) {
                muti = 2;
            } else {
                muti = 1;
            }
        }
        if (this.myResult.nntype == 0) {
            resName = 'png/nm';
            muti = 1;
        }
        var self = this;
        cc.loader.loadRes(resName, cc.SpriteFrame, function(error, spriteFrame){
                var ppNode = new cc.Node('nntype');
                var sprite = ppNode.addComponent(cc.Sprite);
                sprite.spriteFrame = spriteFrame;
                self.node.addChild(ppNode);

                var move = new cc.moveBy(0.5, 0, ppNode.getContentSize().height/8*5);
                var scale = new cc.scaleTo(0.5, 0.5, 0.5);
                var sp = new cc.spawn(move, scale);
                ppNode.runAction(sp);

                self.myPokerNodes.push(ppNode);
        });

        //输赢显示
        //庄家没有单独的输赢标识，但是要显示倍数
        if (this.myResult.win == null || this.myResult.win == true) {
            cc.loader.loadRes('prefab/MutiLabel', cc.Prefab, function (error, prefab) {
                var node = cc.instantiate(prefab);
                self.node.addChild(node);
                node.getComponent(cc.Label).string = 'X' + muti.toString();
                var move = new cc.moveBy(0.5, 0, -node.getContentSize().height * 1.2);
                var scale = new cc.scaleTo(0.5, 0.7, 0.7);
                var sp = new cc.spawn(move, scale);
                node.runAction(sp);
                self.myPokerNodes.push(node);
            });
        } else {
            cc.loader.loadRes('png/shu', cc.SpriteFrame, function (error, spriteFrame) {
                var ppNode = new cc.Node('shu');
                var sprite = ppNode.addComponent(cc.Sprite);
                sprite.spriteFrame = spriteFrame;
                self.node.addChild(ppNode);

                var move = new cc.moveBy(0.5, 0, -ppNode.getContentSize().height/8*5);
                var scale = new cc.scaleTo(0.5, 0.5, 0.5);
                var sp = new cc.spawn(move, scale);
                ppNode.runAction(sp);

                self.myPokerNodes.push(ppNode);
            });
        }
    },

    positionOfCenterWorld : function () {
        var rrr = cc.random0To1();
        if (rrr < 0.7) {
            //70%靠中间
            var posOrigin = this.node.convertToWorldSpace(cc.v2(100, 100));
            posOrigin = cc.v2(cc.random0To1() * 100 + posOrigin.x, cc.random0To1() * 100 + posOrigin.y);
            return posOrigin;
        } else if (rrr < 0.9) {
            var posOrigin = this.node.convertToWorldSpace(cc.v2(75, 75));
            posOrigin = cc.v2(cc.random0To1() * 150 + posOrigin.x, cc.random0To1() * 150 + posOrigin.y);
            return posOrigin;
        } else {
            var posOrigin = this.node.convertToWorldSpace(cc.v2(25, 25));
            posOrigin = cc.v2(cc.random0To1() * 250 + posOrigin.x, cc.random0To1() * 250 + posOrigin.y);
            return posOrigin;
        }
    },

    chipItemAnimationFinish: function (chipItem) {
        var posWorld = chipItem.parent.convertToWorldSpaceAR(chipItem.getPosition());
        var posNode = this.node.convertToNodeSpaceAR(posWorld);
        chipItem.parent = this.node;
        chipItem.setPosition(posNode);
        this.myChipItemNodes.push(chipItem);
    },
});
