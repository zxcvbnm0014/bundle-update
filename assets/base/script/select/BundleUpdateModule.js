var MD5 = require('MD5');

var BundleUpdateModule = cc.Class({
    extends: cc.Component,

    properties: {
        manifestUrl: cc.Asset,
        versionLabel: {
            default: null,
            type: cc.Label,
        },
        bundleName: '',
        _updating: false,
        _canRetry: false,
        _storagePath: ''
    },

    onLoad () {
        if (!cc.sys.isNative) {
            return;
        }
        this._storagePath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'game-remote-asset/assets');

        this.versionCompareHandle = function (versionA, versionB) {
            var vA = versionA.split('.');
            var vB = versionB.split('.');
            for (var i = 0; i < vA.length; ++i) {
                var a = parseInt(vA[i]);
                var b = parseInt(vB[i] || 0);
                if (a === b) {
                    continue;
                } else {
                    return a - b;
                }
            }
            if (vB.length > vA.length) {
                return -1;
            }
            else {
                return 0;
            }
        };

        this._am = new jsb.AssetsManager(this.manifestUrl.nativeUrl, this._storagePath, this.versionCompareHandle);
        this._am.setVerifyCallback(function (filePath, asset) {
            //增加了md5校验，如果不需要可以直接return true
            let data = jsb.fileUtils.getDataFromFile(filePath);
            let fileMd5 = MD5(data);
            let ret = fileMd5 == asset.md5;
            if (!ret) {
                cc.log('md5 is wrong, file:' + filePath);
            }
            return ret;
        });

        if (this.versionLabel) {
            this.versionLabel.string = `src:${this._am.getLocalManifest().getVersion()}`;
        }
  
        //初始化脚本版本信息
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            //一些安卓设备不支持同时下载文件过多
            this._am.setMaxConcurrentTask(2);
        } else {
            this._am.setMaxConcurrentTask(2);
        }
    },

    onDestroy: function () {
        this._am.setEventCallback(null);
        this._am = null;
    },

    showLog: function (msg) {
        cc.log('[HotUpdateModule][showLog]----' + msg);
    },

    retry: function () {
        if (!this._updating && this._canRetry) {
            this._canRetry = false;
            this._am.downloadFailedAssets();
        }
    },

    updateCallback: function (event) {
        var updateOver = false;
        var failed = false;
        switch (event.getEventCode())
        {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                this.showLog("没有发现本地manifest文件，跳过了热更新.");
                failed = true;
                break;
            //更新进度
            case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                let percent = event.getPercent();
                if (isNaN(percent)) return;
                var msg = event.getMessage();
                this.disPatchRateEvent(percent, msg);
                this.showLog("updateCallback更新进度：" + percent + ', msg: ' + msg);
                break;

            //下载manifest文件失败，跳过热更新
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                this.showLog("下载manifest文件失败，跳过热更新.");
                failed = true;
                break;

            //已是最新版本
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                this.showLog("已是最新版本.");
                updateOver = true;
                break;
            //更新结束
            case jsb.EventAssetsManager.UPDATE_FINISHED:
                this.showLog("更新结束."+ event.getMessage());
                this.disPatchRateEvent(1);
                updateOver = true;
                break;
            //更新错误
            case jsb.EventAssetsManager.UPDATE_FAILED:
                this.showLog("更新错误."+ event.getMessage());
                this._updating = false;
                this._canRetry = true;
                this._failCount++;
                this.retry();
                break;
            //更新过程中错误
            case jsb.EventAssetsManager.ERROR_UPDATING:
                this.showLog('更新过程中错误: ' + event.getAssetId() + ', ' + event.getMessage());
                break;
            //解压错误
            case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                this.showLog('解压错误');
                break;
            default:
                break;
        }

        if (failed) {
            this._am.setEventCallback(null);
            this._updating = false;
            this.hotUpdateFinish(false);
        }
        
        if (updateOver) {
            this.hotUpdateFinish(true);
        }
    },

    hotUpdate: function () {
        if (this._am && !this._updating) {
            this._am.setEventCallback(this.updateCallback.bind(this));
            if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
                var url = this.manifestUrl.nativeUrl;
                this._am.loadLocalManifest(url);
            }
            this._failCount = 0;
            this._am.update();
            this._updating = true;
        }
    },

   //检测更新状态
    checkCallback: function (event) {
        switch (event.getEventCode())
        {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                this.showLog("没有发现本地manifest文件，跳过了热更新.");
                this.hotUpdateFinish(true);
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                this.showLog("下载manifest文件失败，跳过热更新.");
                this.hotUpdateFinish(false);
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                this.showLog("已更新.");
                this.hotUpdateFinish(true);
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND: {
                //有新版本
                this.showLog("有新版本,需要更新");
                this._updating = false;
                this.hotUpdate();
                return;
            }
            case jsb.EventAssetsManager.UPDATE_PROGRESSION: {
                //有新版本
                let percent = event.getPercent();
                if (isNaN(percent)) return;
                var msg = event.getMessage();
                this.showLog("checkCallback更新进度：" + percent + ', msg: ' + msg);
                return;
            }
            default:
                console.log('event.getEventCode():' + event.getEventCode());
                return;
        }
        this._am.setEventCallback(null);
        this._updating = false;
    },

    checkUpdate: function () {
        if (this._updating) {
            cc.log("检测更新中...");
            return;
        }
        if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
            var url = this.manifestUrl.nativeUrl;
            this._am.loadLocalManifest(url);
        }
        if (!this._am.getLocalManifest() || !this._am.getLocalManifest().isLoaded()) {
            this.showLog('加载manifest文件失败');
            return;
        }
        this._am.setEventCallback(this.checkCallback.bind(this));
        this._am.checkUpdate();
        this._updating = true;
        this.disPatchRateEvent(0.01);
    },

    //热更完成
    hotUpdateFinish: function (result) {
        cc.director.emit('BundleUpdateFinish',[this.bundleName, result]);
    },

    disPatchRateEvent: function (percent) {
        if (percent > 1) {
            percent = 1;
        }
        cc.director.emit('BundletUpdateRate',[this.bundleName, percent]);
    },
});
