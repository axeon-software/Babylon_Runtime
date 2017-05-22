module _r.library {
    export var libraries = [];

    export interface ILibrary {
        name : string,
        rootUrl : string,
        fileName : string,
        patch? : Array<any>,
        visible : boolean
        beforeFirstRender : Function
    }
    export function show(params : ILibrary) : Q.Promise<Array<BABYLON.AbstractMesh>> {
        let deferred = Q.defer<Array<BABYLON.AbstractMesh>>();
        BABYLON.SceneLoader.ImportMesh(null, params.rootUrl, params.fileName, _r.scene,
            function(meshes) {
                var names = [];
                if(params.patch) {
                    var promises = [];
                    params.patch.forEach(function(_patch) {
                        promises.push(_r.patchFile.load(_patch));
                    });
                    Q.all(promises).then(function(data) {
                        try {
                            data.forEach(function(_patch){
                                _r.patchFile.apply(_patch);
                            });
                            deferred.resolve(meshes);
                        }
                        catch(exception) {
                            console.error(exception);
                        }
                    })
                }
                else {
                    deferred.resolve(meshes);
                }
            },
            function() {
                //deferred.notify(arguments[0]);
            },
            function() {
                deferred.reject("Error while _r.importLibrary");
            });
        return deferred.promise;
    }

    export function hide(libraryName : string) {
        if(_r.library.libraries[libraryName]) {
            _r.library.libraries[libraryName].forEach(function(meshName) {
                _r.scene.getMeshByName(meshName).dispose(true);
            })
        }
    }
}
