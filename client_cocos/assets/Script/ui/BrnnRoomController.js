require("../pomelo/pomelo-client");
var GateConnector = require("../protocol/GateConnector");
var BrnnProto = require("../protocol/BrnnProto");
var MResponse = require("../protocol/MResponse");

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
        buttonExit: {
            default: null,
            type: cc.Button
        },

        stateSprite: {
            default: null, 
            type: cc.Sprite
        },

        timeLabel: {
            default: null, 
            type: cc.Label
        },

        totalMoney: {
            default: null, 
            type: cc.Label
        },

        chipLayout: {
            default: null,
            type:cc.Layout
        },

        masterView: {
            default: null,
            type: cc.Node
        },

        chipBar: {
            default: null,
            type: cc.Node,
        },

        brnnState: 2,   //state: 0,下注时间等待开始 | 1,游戏开始计算输赢 | 2,其他场景
        brnnChipSelect: 100,
        brnnChipInDic: new Array(),     //{'1':0, '2':0, '3':0, '4':0};

        chipViewSC: {
            default: new Array()
        },
    },

    // use this for initialization
    onLoad: function () {
        this.brnnChipInDic = {'1':0, '2':0, '3':0, '4':0};
        var masterViewSC = this.masterView.getComponent('ChipViewScript');
        this.chipViewSC.push(masterViewSC);

        for (var index = 1; index < 5; index++) {
            var childName = 'chipView' + index;
            var cp = this.chipLayout.node.getChildByName(childName);
            var cpscript = cp.getComponent('ChipViewScript');
            this.chipViewSC.push(cpscript);
        }
        
        this.totalMoney.string = pomelo.userinfo.gold.toString();
    },

    onEnable: function () {
        this.buttonExit.node.on('click', this.buttonExitTap, this);
        this.initBrnnEvent();
        
        var chipBarScript = this.chipBar.getComponent('ChipBarScript');
        chipBarScript.startDefaultAction(this.brnnChipSelect);
    },

    onDisable: function () {
        this.buttonExit.node.off('click', this.buttonExitTap, this);
        BrnnProto.disableEvent();
    },
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    buttonExitTap: function(){
        pomelo.disconnect();
        cc.director.loadScene('Home');
    },

    initBrnnEvent: function () {
        var self = this;
        BrnnProto.onAdd(function(data){
            console.log(data);
        });

        BrnnProto.onLeave(function(data){
            console.log(data);
        });

        BrnnProto.onWillStart(function(data){
            var res = new MResponse(data);
            if (res.hasError()) {
                console.error(res.msg);
                return ;
            }

            self.brnnState = res.data['state'];
            var time = res.data['time'];
            self.updateStateAndTime(self.brnnState, time);
        });

        BrnnProto.onDealPoker(function(data){
            var res = new MResponse(data);
            if (res.hasError()) {
                console.log(res.msg);
                return ;
            }
            self.brnnState = 1;
            self.updateStateAndTime(self.brnnState, -1);
            self.pushPokerToChipView(res.data['pokerRes']);
        });

        BrnnProto.onGoldResult(function(data){
            var res = new MResponse(data);
            if (res.hasError()) {
                console.log(res.msg);
                return ;
            }
            var goldArr = res.data;
            goldArr.forEach(function(element) {
                if (element.userid == pomelo.userinfo.userid) {
                    self.totalMoney.string = element.totalGold.toString();
                }
            }, this);
            self.brnnState = 2;
            self.updateStateAndTime(self.brnnState, -1);
            self.brnnChipInDic = {'1':0, '2':0, '3':0, '4':0};
            self.scheduleOnce(function() {
                this.resetChipView();
            }, 3);
            
        });
    },

    //下注金额按钮点击事件
    //chipin 是下注金额
    buttonChipInTap: function (event, chipin) {
        this.brnnChipSelect = parseInt(chipin);
    },

    //下注牌点击事件，真正完成下注
    buttonChipPokerTap: function(event, pkindex) {
        if (this.brnnState != 0) {
            console.log('下注时间已过');
            return ;
        }
        this.brnnChipInDic[pkindex] += this.brnnChipSelect;

        var self = this;
        BrnnProto.chipIn(this.brnnChipInDic[pkindex], pkindex, function(data) {
            var res = new MResponse(data);
            if (res.hasError()) {
                console.log(res.msg);
                self.brnnChipInDic[pkindex] -= self.brnnChipSelect;
                return ;
            }
            self.updateChipView(res.data);
            self.runChipItemMoveAnimation(event.target);
        });
    },

    //update state and time ui
    //time < 0 的时候隐藏imagetime
    updateStateAndTime : function (state, time) {
        //update time
        this.timeLabel.node.active = (time >= 0);
        var fullTime = time;
        if (fullTime < 10) {
            fullTime = '0' + time;
        }
        this.timeLabel.string = fullTime;

        //更新state
        var stateurl = 'png/brnnstate_' + state;
        var self = this;
        cc.loader.loadRes(stateurl, cc.SpriteFrame, function(error, sf) {
            self.stateSprite.spriteFrame = sf;
        });
    },

    updateChipView: function(mychip) {
        for (var index = 1; index < 5; index++) {
            if (mychip[index] == null) {
                continue ;
            }
            var childName = 'chipView' + index;
            var cp = this.chipLayout.node.getChildByName(childName);
            var cpscript = cp.getComponent('ChipViewScript');
            cpscript.updateGold(mychip[index], null);
        }
    },

    runChipItemMoveAnimation: function (aNode) {
        var cpscript = aNode.getComponent('ChipViewScript');
        var chipBarScript = this.chipBar.getComponent('ChipBarScript');
        var posWorld = cpscript.positionOfCenterWorld();
        chipBarScript.runChipItemMoveAnimation(posWorld, cpscript.chipItemAnimationFinish, cpscript);
    },

    resetChipView: function() {
        var masterViewSC = this.masterView.getComponent('ChipViewScript');
        masterViewSC.resetState();
        for (var index = 1; index < 5; index++) {
            var childName = 'chipView' + index;
            var cp = this.chipLayout.node.getChildByName(childName);
            var cpscript = cp.getComponent('ChipViewScript');
            cpscript.resetState();
        }
    },

    pushPokerToChipView: function(pokerGroup) {
        if (pokerGroup.length !== 5) {
            console.log('pokerGroup长度不对');
            return ;
        }
        var masterPkItem = pokerGroup[0];
        var masterViewSC = this.chipViewSC[0];
        masterViewSC.pokerPosFromWorld = new cc.Vec2(cc.winSize.width/2-160,cc.winSize.height/2+45);
        masterViewSC.bindPokers(masterPkItem['poker'], masterPkItem['result']);
        masterViewSC.pokerAnimationDelay(0);

        for (var index = 1; index < pokerGroup.length; index++) {
            var element = pokerGroup[index];
            var cpscript = this.chipViewSC[index];
            cpscript.bindPokers(element['poker'], element['result']);
            cpscript.pokerAnimationDelay(0.1 * (index + 1));
        }
        //2s后展示牌面大小
        this.scheduleOnce(function() {
            for (var index = 0; index < 5; index++) {
                var cpscript = this.chipViewSC[index];
                cpscript.showNiuNiu();
            }
        }, 2);
    },
});
