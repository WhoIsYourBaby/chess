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

        labelTotal : {
            default: null,
            type: cc.Label
        },

        labelMine : {
            default: null,
            type: cc.Label
        },

        myPokerList: [],    //发牌的数据
    },

    // use this for initialization
    onLoad: function () {
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    bindPokers: function(pokerList) {
        myPokerList = pokerList;
    },

    updateGold: function(mine, total) {
        if (total == null) {
            this.labelTotal.string = 0;
        } else {
            this.labelTotal.string = total;
        }
        
        this.labelMine.string = mine;
    },

    //延迟一定时间开始发牌动画
    pokerAnimationDelay: function (delay) {
        if (this.myPokerList.length <= 0) {
            return ;
        }
    },
});
