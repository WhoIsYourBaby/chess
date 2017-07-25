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

        pokerModel: null,
        frontState: false,
    },

    // use this for initialization
    onLoad: function () {

    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    bindPokerModel: function(pkmodel) {
        this.pokerModel = pkmodel;
    },

    animationMoveTo: function(pos, finishCallback, target){
        var mt = new cc.moveTo(0.1, pos);
        var cal = new cc.callFunc(finishCallback, target);
        var seq = new cc.sequence(mt, cal);
        this.node.runAction(seq);
    },

    animationFlipTo: function (isFront, finishCallback, target) {
        this.frontState = isFront;
        var flip0 = new cc.scaleTo(0.1, 0, 1);
        var cal = new cc.callFunc(this.switchSprite, this);
        var flip1 = new cc.scaleTo(0.1, 1, 1);
        var calFinish = new cc.callFunc(finishCallback, target);
        var seq = new cc.sequence(flip0, cal, flip1, calFinish);
    },

    switchSprite: function() {
        var resname = null;
        if (this.frontState) {
            resname = 'png/' + this.pokerModel.value + this.pokerModel.color;
        } else {
            resname = 'png/pk_back';
        }
        cc.loader.loadRes(resname, cc.SpriteFrame, function(error, spriteFrame){
            var sprite = this.node.getComponent('Sprite');
            sprite.spriteFrame = spriteFrame;
        });
    },
});
