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

        brnnState: 2,   //state: 0,下注时间等待开始 | 1,游戏开始计算输赢 | 2,其他场景
        brnnChipedDic: new Array(),
        brnnChipSelect: 2000,
    },

    // use this for initialization
    onLoad: function () {
        this.buttonExit.node.on('click', this.buttonExitTap, this);
        this.initBrnnEvent();

        this.resetData();
    },

    resetData: function () {
        this.brnnChipedDic = {'1' : 0, '2': 0, '3': 0, '4': 0};
    },
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    buttonExitTap: function(){
        GateConnector.connectorExit(function() {
            cc.director.loadScene('Home');
        });
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
            self.brnnState = 1;
			self.updateStateAndTime(self.brnnState, -1);
        });

        BrnnProto.onGoldResult(function(data){
            self.brnnState = 2;
            self.updateStateAndTime(self.brnnState, -1);
            self.resetData();
        });
    },

    //下注金额按钮点击事件
    //chipin 是下注金额
    buttonChipInTap: function (event, chipin) {
        this.brnnChipSelect = chipin;
    },

    //下注牌点击事件，真正完成下注
    buttonChipPokerTap: function(event, pkindex) {
        if (this.brnnState != 0) {
            return ;
        }
        this.brnnChipedDic[pkindex] += this.brnnChipSelect;

        console.log(this.brnnChipedDic);
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

    updateChipView: function() {
        var cp1 = this.node.getChildByName('chipView1');
        var cpscript = cp1.getComponent('ChipViewScript');
        cpscript.updateGold(100, 1000);
    },
});
