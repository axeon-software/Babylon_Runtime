module _r.patchFile {
    export function get(file : string) : Q.Promise<any> {
        let deferred = Q.defer<Array<any>>();
        var xhr = new XMLHttpRequest();
        xhr.open("get", file, true);
        xhr.onload = function() {
            var status = xhr.status;
            if (status == 200) {
                var data;
                var isJson = false;
                try {
                    data = JSON.parse(xhr.response);
                    isJson = true;
                }
                catch(error) {
                    isJson = false;
                }
                if(!isJson) {
                    try {
                        data = window["eval"].call(window, xhr.response);
                    }
                    catch(error){
                        var __patch;
                        eval('var __patch = ' + xhr.response);
                        data = __patch;
                    }
                }
                if(data) {
                    deferred.resolve(data);
                }
                else {
                    console.warn('BABYLON.Runtime::no data found in '+ file);
                    deferred.resolve([{}])
                }

            } else {
                deferred.reject(status);
            }
        };
        xhr.send();
        return deferred.promise;
    }

    export function apply(_patch : any) {
        if(Array.isArray(_patch)) {
            _patch.forEach(function(_item) {
                Object.getOwnPropertyNames(_item).forEach(function(selector){
                    var value = _item[selector];
                    _r.select(selector).patch(value);
                });
            });
        }
        else {
            Object.getOwnPropertyNames(_patch).forEach(function(selector){
                var value = _patch[selector];
                _r.select(selector).patch(value);
            });
        }
    }

    export function load(patch : string | any) : Q.Promise<any> {
        let deferred = Q.defer<void>();
        if(_r.is.PatchFile(patch)) {
            _r.patchFile.get(patch).then(function(data) {
                deferred.resolve(data);
            }, function(err) {
                console.error("BABYLON.Runtime::Error while loading " + patch, err);
                var emptyPromise = Q.defer<any>();
                emptyPromise.resolve({});
                deferred.resolve(emptyPromise.promise);
            })
        }
        else {
            deferred.resolve(patch);
        }
        return deferred.promise;
    }
}
