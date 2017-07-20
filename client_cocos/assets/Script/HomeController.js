var GateConnector = require("./protocol/GateConnector");

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
    },

    // use this for initialization
    onLoad: function () {
        this.buttonBrnnRoom.node.on('click', this.buttonBrnnRoomTap, this);
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    buttonBrnnRoomTap: function () {
        GateConnector.connectToConnector(function () {
            GateConnector.connectorEnterRoom('brnn', null, function (data) {
                console.log(data);
            });
        });

    }
});
