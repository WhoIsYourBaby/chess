require("./pomelo/pomelo-client");

cc.Class({
    extends: cc.Component,

    properties: {
        label: {
            default: null,
            type: cc.Label
        },
        // defaults, set visually when attaching this script to the Canvas
        text: 'Hello, World!'
    },

    // use this for initialization
    onLoad: function () {
        this.label.string = this.text;
    },

    // called every frame
    update: function (dt) {

    },

    btnGuestLoginTap: function () {
        pomelo.init({
            host: '127.0.0.1',
            port: 3101,
            user: {},
            handshakeCallback: function () { }
        }, function () {
            pomelo.request('gate.gateHandler.guestLogin', {}, function (data) {
                pomelo.userinfo = data['data']['userinfo'];
                pomelo.connector = data['data']['connector'];
                pomelo.token = data['data']['token'];
                console.log(pomelo.connector);
            });

        });
    }
});
