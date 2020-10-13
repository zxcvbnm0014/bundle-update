cc.Class({
    extends: cc.Component,

    properties: {
        labelTips: {
            default: null,
            type: cc.Label,
        },
    },

    onLoad () {

    },

    onDestroy () {

    },

    onBtnJumpSelect: function () {
        cc.director.loadScene('SelectScene');
    },
});
