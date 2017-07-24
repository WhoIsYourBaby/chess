//AlertView Prefab 's script

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

        labelMsg: {
            default: null,
            type: cc.Label
        },

        btnCancel: {
            default: null,
            type: cc.Button
        },

        btnOK: {
            default: null,
            type: cc.Button
        },
    },

    // use this for initialization
    onLoad: function () {
        this.btnCancel.node.on('click', this.dismiss, this);
        this.btnOK.node.on('click', this.dismiss, this);
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    dismiss: function () {
        this.node.removeFromParent();
    }

});
