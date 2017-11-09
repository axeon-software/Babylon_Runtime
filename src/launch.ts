module _r {
    export var scene;
    export var engine;
    export var canvas;

    export interface ILauncher {
        container? : string | HTMLCanvasElement,
        scene : Function | string,
        activeCamera? : string,
        patch? : Array<any>,
        assets? : string,
        beforeFirstRender? : Function,
        ktx? : boolean | Array<string>,
        enableOfflineSupport? : boolean,
        progressLoading : Function
        loadingScreen : any
    }

    export function init(scene? : BABYLON.Scene) {
        if(scene) {
            _r.scene = scene;
            _r.engine = scene.getEngine();
            _r.canvas = _r.engine.getRenderingCanvas();
        }
        var runtime = function(params) {
            return _r.select(params);
        };

        Object.getOwnPropertyNames(_r).forEach(function(property) {
            runtime[property] = _r[property];
        });

        runtime["engine"] = _r.engine;
        runtime["scene"] = _r.scene;
        runtime["canvas"] = _r.canvas;

        window["_r"] = runtime;

        isReady = true;
        _r.scene.executeWhenReady(function() {
            _r.trigger(window, "ready");
        });
    }

    export var isReady = false;

    export function ready(callback : (scene : BABYLON.Scene, engine : BABYLON.Engine, canvas : HTMLCanvasElement) => void) {
        if(isReady) {
            callback(_r.scene, _r.engine, _r.canvas);
        }
        else {
            _r.on(window, 'ready', callback);
        }
    }


    function load(scene : Function | string, assets? : string, progressLoading? : Function ) : Q.Promise<BABYLON.Scene> {
        let deferred = Q.defer<BABYLON.Scene>();
        if(is.Function(scene)) {
            _r.scene = new BABYLON.Scene(_r.engine);
            (<Function> scene).call(this,_r.scene, _r.engine, _r.canvas)
            deferred.resolve(_r.scene);
        }
        else {
            if(scene) {
                BABYLON.SceneLoader.Load(assets || '', scene, _r.engine, function(_scene) {
                    _r.scene = _scene;
                    deferred.resolve(_r.scene);
                }, progressLoading);
            }
            else {
                _r.scene = new BABYLON.Scene(_r.engine);
                deferred.resolve(_r.scene);
            }

        }
        return deferred.promise;
    }

    export function launch(params : ILauncher) : Q.Promise<void> {
        let deferred = Q.defer<void>();
        if(params.hasOwnProperty('container')) {
            if(_r.is.String(params['container'])) {
                _r.canvas = <HTMLCanvasElement> document.getElementById(<string> params.container);
            }
            else {
                _r.canvas = params['container'];
            }
        }
        else {
            var style = document.createElement('style');
            style.appendChild(document.createTextNode('html, body, canvas { width : 100%; height : 100%; padding : 0; margin : 0; overflow : hidden }'));
            document.getElementsByTagName("head")[0].appendChild(style);
            // Canvas
            _r.canvas = document.createElement('canvas');
            _r.canvas.setAttribute('touch-action', 'none');
            document.body.appendChild(_r.canvas);
        }

        _r.engine = new BABYLON.Engine( _r.canvas, true, null);
        if(params.loadingScreen) {
            _r.engine.loadingScreen = params.loadingScreen;
        }
        window.addEventListener('resize', function () {
            _r.engine.resize();
        });

        if(params.ktx) {
            if(_r.is.Array(params.ktx)) {
                _r.engine.setTextureFormatToUse(params.ktx);
            }
            else {
                if(params.ktx === true) {
                    _r.engine.setTextureFormatToUse(['-astc.ktx', '-dxt.ktx', '-pvrtc.ktx', '-etc2.ktx'])
                }
            }
        }
        if(params.enableOfflineSupport) {
            _r.engine.enableOfflineSupport = params.enableOfflineSupport;
        }
        else {
            _r.engine.enableOfflineSupport = false;
        }

        load(params.scene, params.assets, params.progressLoading).then(function() {
            var promises = [];
            if(params.hasOwnProperty('patch')) {
                params.patch.forEach(function(_patch) {
                    promises.push(_r.patchFile.load(_patch));
                })
            }
            Q.all(promises).then(function(data) {
                if(params.hasOwnProperty('activeCamera')) {
                    _r.scene.setActiveCameraByName(params.activeCamera);
                    _r.scene.activeCamera.attachControl(_r.canvas, true);
                }
                else {
                    if(_r.scene.cameras.length > 0) {
                        _r.scene.setActiveCameraByName(_r.scene.cameras[0].name);
                        _r.scene.activeCamera.attachControl(_r.canvas, true);
                    }
                }
                try {
                    data.forEach(function(_patch){
                        _r.patchFile.apply(_patch);
                    })
                }
                catch(exception) {
                    console.error(exception);
                }
                if(params.beforeFirstRender) {
                    try {
                        params.beforeFirstRender.call(_r.scene);
                    }
                    catch(exception) {
                        console.error(exception);
                    }
                }
                init();
                _r.engine.resize();
                deferred.resolve();
                _r.renderloop.run();
            });
        });
        return deferred.promise;
    }

}
