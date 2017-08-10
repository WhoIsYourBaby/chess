var GateConnector = require("../protocol/GateConnector");
require("../pomelo/pomelo-client");

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
        buttonBrnnRoom: {
            default: null,
            type: cc.Button
        },

        roomCreated: null,
    },

    // use this for initialization
    onLoad: function () {
        this.buttonBrnnRoom.node.on('click', this.buttonBrnnRoomTap, this);

        GateConnector.connectToConnector(function () {
            console.log('Connect Success');
        });
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    buttonBrnnRoomTap: function () {
        var param = {
            'token': pomelo.token,
            'rtype': 'brnn'
        };
        pomelo.request('connector.entryHandler.joinRoom', param, function (data) {
            cc.director.loadScene('BrnnRoom');
        });
    },

    buttonCreateNNTap: function () {
        var param = {
            'token': pomelo.token,
            'rtype': 'jdnn',
            'userid': pomelo.userinfo.userid
        };
        var self = this;
        pomelo.request('connector.entryHandler.createRoom', param, function (data) {
            var roomid = data.data.roomid;
            self.roomid = roomid;
        });
    },

    buttonJoinNNTap: function() {
        var param = {
            userid : pomelo.userinfo.userid,
            roomid : this.roomid,
            rtype : 'jdnn',
            token : pomelo.token
        };
        console.log(param);
        pomelo.request('connector.entryHandler.joinRoom', param, function (data) {
            console.log(data);
        });
    },

    buttonReadyNNTap: function() {
        var param = {
            userid: pomelo.userinfo.userid,
            roomid: this.roomid,
            ready: 1
        };
        pomelo.request('jdnn.jdnnHandler.ready', param, function (data) {
            console.log(data);
        });
    },
});
