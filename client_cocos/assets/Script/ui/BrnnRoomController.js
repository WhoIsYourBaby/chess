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

        brnnState: 2,   //state: 0,下注时间等待开始 | 1,游戏开始计算输赢 | 2,其他场景
        brnnChipedList: [],
        brnnChipSelect: 2000,
    },

    // use this for initialization
    onLoad: function () {
        this.buttonExit.node.on('click', this.buttonExitTap, this);

        this.initBrnnEvent();
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

            this.brnnState = res.data['state'];
            var time = res.data['time'];
            this.updateStateAndTime(this.brnnState, time);
        });

        BrnnProto.onDealPoker(function(data){
            console.log(data);
        });

        BrnnProto.onGoldResult(function(data){
            console.log(data);
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
    },

    //update ui
    updateStateAndTime : function (state, time) {

    }
});
