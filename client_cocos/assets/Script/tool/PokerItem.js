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
        var bpos = new cc.Vec2(pos.x, this.node.getPositionY());
        // var mt1 = cc.moveTo(0.15, bpos);
        // var mt2 = cc.moveTo(0.15, pos);
        //改为贝塞尔移动
        var ar = [this.node.getPosition(), bpos, pos];
        var beiz = cc.bezierTo(0.3,ar);
        
        var cal = cc.callFunc(finishCallback, target, this);
        var seq = cc.sequence(dl, beiz, cal);
        this.node.runAction(seq);
    },

    animationFlipTo: function (isFront, finishCallback, target) {
        this.frontState = isFront;
        var flip0 = cc.scaleTo(0.2, 0, 1);
        var cal = cc.callFunc(this.switchSprite, this);
        var flip1 = cc.scaleTo(0.2, 1, 1);
        var calFinish = cc.callFunc(finishCallback, target, this);
        var seq = cc.sequence(flip0, cal, flip1, calFinish);
        this.node.runAction(seq);
    },

    switchSprite: function() {
        var resname = null;
        if (this.frontState) {
            resname = 'png/' + this.pokerModel.value + this.pokerModel.color;
        } else {
            resname = 'png/pk_back';
        }
        var self = this;
        cc.loader.loadRes(resname, cc.SpriteFrame, function(error, spriteFrame){
            var oriSize = self.node.getContentSize();
            var sprite = self.getComponent(cc.Sprite);
            sprite.spriteFrame = spriteFrame;
            self.node.setContentSize(oriSize);
        });
    },
});
