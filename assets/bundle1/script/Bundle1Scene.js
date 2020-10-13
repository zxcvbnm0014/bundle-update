cc.Class({
    extends: cc.Component,

    properties: {
        labelTips: {
            default: null,
            type: cc.Label,
        },
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.labelTips.string = '这是bundle1Scene';
    },

    onDestroy () {

    },

    start () {

    },

    onBtnExit: function () {
        cc.director.loadScene('LoginScene');
    },

    // update (dt) {},
});
