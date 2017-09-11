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

    onChipClick: function (event) {
        for (var index = 0; index < this.chipItemList.length; index++) {
            var chd = this.chipItemList[index];
            chd.stopAllActions();
            chd.y = 0;
        }
        var anode = event.target;
        this.runSelectActionOnNode(anode);  
    },

    runSelectActionOnNode: function(aNode){
        var j1 = cc.jumpBy(0.2, cc.p(0, 0), 20, 1);
        var j2 = cc.jumpBy(0.15, cc.p(0, 0), 10, 1);
        var delay = cc.delayTime(0.05);
        var seq = cc.sequence(j1, j2, delay);
        var rep = cc.repeatForever(seq);
        aNode.runAction(rep);
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
