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

        chipItemList: null,    //下注的item列表

        selectChipItem: {
            default: null,
            type: cc.Node,
        },
    },

    // use this for initialization
    onLoad: function () {
        this.chipItemList = new Array();
        for (var index = 0; index < 6; index++) {
            var childName = 'chip' + index.toString();
            var chd = this.node.getChildByName(childName);
            this.chipItemList.push(chd);
            chd.on('click', this.onChipClick, this);
        }
    },

    //根据金额来开始筹码跳动的动画
    startDefaultAction: function (chipSelect) {
        var tmpNode = null;
        switch (chipSelect) {
            case 100:
                tmpNode = this.chipItemList[0];
                break;
            case 500:
                tmpNode = this.chipItemList[1];
                break;
            case 1000:
                tmpNode = this.chipItemList[2];
                break;
            case 5000:
                tmpNode = this.chipItemList[3];
                break;
            case 10000:
                tmpNode = this.chipItemList[4];
                break;
            case 50000:
                tmpNode = this.chipItemList[5];
                break;
            default:
                tmpNode = this.chipItemList[0];
                break;
        }
        this.runSelectActionOnNode(tmpNode);
    },

    stopAllChipAction: function () {
        for (var index = 0; index < this.chipItemList.length; index++) {
            var chd = this.chipItemList[index];
            chd.stopAllActions();
            chd.y = 0;
        }
    },

    onChipClick: function (event) {
        this.stopAllChipAction();
        var anode = event.target;
        this.runSelectActionOnNode(anode);
    },

    runSelectActionOnNode: function (aNode) {
        var j1 = cc.jumpBy(0.2, cc.p(0, 0), 20, 1);
        var j2 = cc.jumpBy(0.15, cc.p(0, 0), 10, 1);
        var delay = cc.delayTime(0.05);
        var seq = cc.sequence(j1, j2, delay);
        var rep = cc.repeatForever(seq);
        aNode.runAction(rep);

        this.selectChipItem = aNode;
    },

    runChipItemMoveAnimation: function (posToWorld, finishiCallback, target) {
        var posNode = this.node.convertToNodeSpaceAR(posToWorld);
        var self = this;
        cc.loader.loadRes('prefab/ChipItem', cc.Prefab, function (error, prefab) {
            var chipitem = cc.instantiate(prefab);
            chipitem.setPosition(self.selectChipItem.getPosition());
            self.node.addChild(chipitem);
            var actionMove = cc.moveTo(1, posNode);
            var callback = cc.callFunc(finishiCallback, target, chipitem);
            chipitem.runAction(cc.sequence(actionMove, callback));
        });
    },


    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
