module _r {
    export var overrides = [];

    export function override(properties : Array<string>, callback : (target, source, property) => any ) {
        properties.forEach(function(property){
            _r.overrides[property] = callback;
        });
    }

    export function extend(...params : any[]) : any {
        var target = params[0];
        for(var i = 1; i < params.length; i++) {
            var nextSource = params[i];
            Object.getOwnPropertyNames(nextSource).forEach(function(key) {
                if(overrides[key]) {
                    var res = overrides[key](target, nextSource, key);
                    if(res) {
                        target = res;
                    }
                }
                else {
                    if(key.indexOf('::') != -1) {
                        var split = key.split('::');
                        var res = _r[split[0]][split[1]](nextSource[key]);
                        if(res) {
                            target = res;
                        }
                    }
                    else {
                        if (_r.is.PlainObject(nextSource[key])) {
                            if(target[key] == null) {
                                target[key] = {}
                            }
                            target[key] = extend(target[key], nextSource[key]);
                        }
                        else {
                            if(target[key] != null && _r.is.Color(target[key]) && _r.is.HexColor(nextSource[key])) {
                                target[key] = BABYLON.Color3.FromHexString(nextSource[key]);
                            }
                            else {
                                if(_r.is.Function(nextSource[key])) {
                                    target[key] = nextSource[key].call(target, key);
                                }
                                else {
                                    target[key] = nextSource[key];
                                }
                            }
                        }
                    }

                }
            })
        }
        return target;
    }

    export function merge(target: any, source: any, excluded? : Array<string>): any {
        var others = {};
        Object.getOwnPropertyNames(source).forEach(function(property) {
            if(!excluded || excluded.indexOf(property) == -1) {
                others[property] = source[property];
            }
        });
        _r.extend(target, others);
        return target;
    }

    export function patch(...params : any[]) : Elements {
        if(params.length == 1) {
           params[0].forEach(function(_patch) {
               var selector = Object.getOwnPropertyNames(_patch)[0];
               if(selector.indexOf('::') != -1) {
                   var split = selector.split('::');
                   _r[split[0]][split[1]](_patch[selector]);
               }
               else {
                   _r.select(selector).each(function(element) {
                       _r.extend(element, _patch[selector]);
                   });
               }
           });
        }
        else {
            var nodes = params[0];
            var patch = params[1];
            var el = new Elements(nodes);
            el.each(function(obj) {
                console.info("patch", obj.name, patch);
                _r.extend(obj, patch);
            });
            return el;
        }

    }
}
