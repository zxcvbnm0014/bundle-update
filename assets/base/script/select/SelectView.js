// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        labelTips: {
            default: null,
            type: cc.Label,
        },
        nodeBundle1: {
            default: null,
            type: cc.Node,
        },
        nodeBundle2: {
            default: null,
            type: cc.Node,
        },
    },

    onLoad () {
        cc.director.on('BundleUpdateFinish',this.onBundleUpdateFinish, this);
        cc.director.on('BundletUpdateRate', this.onBundletUpdateRate, this);
    },

    onDestroy () {
        cc.director.off('BundleUpdateFinish',this.onBundleUpdateFinish, this);
        cc.director.off('BundletUpdateRate', this.onBundletUpdateRate, this);
    },

    onBundleUpdateFinish: function (params) {
        let bundleName = params[0];
        let result = params[1];
        let text = `${bundleName}热更完成，热更result：${result}`;
        console.log(text);
        this.labelTips.string = text;
        if (result) {
            this.loadBundle(bundleName);
        }
    },

    onBundletUpdateRate: function (params) {
        let bundleName = params[0];
        let rate = params[1];
        let text = `${bundleName}热更进度：${rate}`;
        console.log(text);
        this.labelTips.string = text;
    },

    loadBundle: function (bundleName) {
        var sceneName = {};
        sceneName['bundle1'] = 'Bundle1Scene';
        sceneName['bundle2'] = 'Bundle2Scene';
        cc.assetManager.loadBundle(bundleName, null, (err, bundle) => {
            //这里存一下bundle，在bundle场景销毁的时候释放，保证下次bundle热更之后引用的资源都是最新的
            window[bundleName] = bundle;
            bundle.loadScene(sceneName[bundleName],(err, sceneAsset) => {
                cc.director.runScene(sceneAsset);
            });
        });
    },

    onBtnLoadBundle1: function () {
        //这里检查一下是否已经加载过bundle，如果加载过就先释放，否则会造成更新之后用老的资源
        let bundle = window['bundle1'];
        if (bundle) {
            bundle.releaseAll();
            cc.assetManager.removeBundle(bundle);
        }
        window['bundle1'] = null;
        this.nodeBundle1.getComponent('BundleUpdateModule').hotUpdate();
    },

    onBtnLoadBundle2: function () {
        let bundle = window['bundle2'];
        if (bundle) {
            bundle.releaseAll();
            cc.assetManager.removeBundle(bundle);
        }
        window['bundle2'] = null;
        this.nodeBundle2.getComponent('BundleUpdateModule').hotUpdate();
    },

    onBtnReturnLogin: function () {
        cc.director.loadScene('LoginScene');
    },

});
