cc.Class({
    extends: cc.Component,

    properties: {
        menuNode: {
            default: null,
            type: cc.Node,
        },
        labelTips: {
            default: null,
            type: cc.Label,
        },
    },

    onLoad: function () {
        this.menuNode.active = false;
        this.checkVersion();
        this.labelTips.string = '正在检查更新，请稍等';
    },

    onDestroy: function () {

    },

    onEnable: function() {
        cc.director.on('HotUpdateFinish',this.onHotUpdateFinish, this);
        cc.director.on('HotUpdateRate', this.onHotUpdateRate, this);
    },

    onDisable: function() {
        cc.director.off('HotUpdateFinish',this.onHotUpdateFinish, this);
        cc.director.off('HotUpdateRate', this.onHotUpdateRate, this);
    },

    //检查版本更新
    checkVersion: function() {
        // gg.fun.showLoading('正在更新游戏资源');
        var hotUpdateModule = this.node.getComponent('HotUpdateModule');
        hotUpdateModule.checkUpdate();
    },

    //更新完成
    onUpdateFinish: function () {
        this.menuNode.active = true;
        this.labelTips.string = '';
    },

    //热更新结束
    onHotUpdateFinish: function (param) {
        let result = param;
        if (result) {
            this.onUpdateFinish();
        } else {
            this.onUpdateFinish();
        }
    },

    //热更进度
    onHotUpdateRate: function (param) {
        let percent = param;
        if (percent > 1) {
            percent = 1;
        }

        this._updatePercent = percent;
        this.labelTips.string = '正在更新游戏资源，更新进度'+ parseInt(percent * 100)+'%';
    },

    onBtnStartGame: function () {
        cc.director.loadScene('SelectScene');
    },

    onBtnBill: function () {
        cc.director.loadScene('GameScene');
    },
});
