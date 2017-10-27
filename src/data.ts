module _r {
    var _cache = [];

    var expando = '_r' + Date.now();
    /**
     * The .data() method allows us to attach data of any type to elements in a way that is safe from circular references and therefore from memory leaks.
     */
    export function data(elements : any, key? : string, value? : any) {
        var el = new Elements(elements);
        var result;
        el.each(function(_element) {
            if(!_element.hasOwnProperty(expando)) {
                _element[expando] = _cache.length;
                _cache[_element[expando]] = {};
            }
            if(key != null) {
                if(value != null) {
                    _cache[_element[expando]][key] = value;
                }
                else {
                    result = _cache[_element[expando]][key];
                    return false; // break the each.
                }
            }
            else {
                result = _cache[_element[expando]];
                return false; // break the each.
            }
        });
        return result;
    }

    _r.override(['data'], function(target, source, property) {
        Object.getOwnPropertyNames(source[property]).forEach(function(key) {
           _r.select(target).data(key, source[property][key]);
        });
    })
}


