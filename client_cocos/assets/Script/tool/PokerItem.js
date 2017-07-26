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

    animationMoveTo: function(delay, pos, finishCallback, target){
        var dl = cc.delayTime(delay);
        var mt = cc.moveTo(0.2, pos);
        mt.easing(cc.easeOut(3));
        var cal = cc.callFunc(finishCallback, target, this);
        var seq = cc.sequence(dl, mt, cal);
        this.node.runAction(seq);
    },

    animationFlipTo: function (isFront, finishCallback, target) {
        this.frontState = isFront;
        var flip0 = cc.scaleTo(0.1, 0, 1);
        var cal = cc.callFunc(this.switchSprite, this);
        var flip1 = cc.scaleTo(0.1, 1, 1);
        var calFinish = cc.callFunc(finishCallback, target);
        var seq = cc.sequence(flip0, cal, flip1, calFinish);
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
