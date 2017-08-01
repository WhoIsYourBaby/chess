var GateConnector = require("../protocol/GateConnector");

cc.Class({
    extends: cc.Component,

    properties: {
        label: {
            default: null,
            type: cc.Label
        },
        // defaults, set visually when attaching this script to the Canvas
        text: 'Hello, World!',

        buttonGuestLogin: {
            default: null,
            type: cc.Button
        },
    },

    // use this for initialization
    onLoad: function () {
        this.label.string = this.text;

        this.buttonGuestLogin.node.on('click', this.btnGuestLoginTap, this);
    },

    // called every frame
    update: function (dt) {
    },

    btnGuestLoginTap: function () {
        // var token = cc.sys.localStorage.getItem('token');
        // if (token) {
        //     GateConnector.gateRefreshToken('39.108.83.192', 3101, function (data) {
        //         cc.director.loadScene('Home');
        //     });
        // } else {
            GateConnector.gateGuestLogin('127.0.0.1', 3101, function (data) {
                cc.director.loadScene('Home');
            });
        // }
    }
});
