module _r {

    export class Elements {
        length: number;

        constructor(params?: any) {
            if (!params || params === '' || typeof params === 'string' && params.trim() === '') {
                this.length = 0;
                return;
            }
            if (typeof params === 'string') {
                var i = 0;
                var self = this;
                params.split(',').forEach(function (selector) {
                    selector = selector.trim();
                    var types = [];
                    if(selector.indexOf(':mesh') !== -1) {
                        selector = selector.replace(':mesh', '');
                        types.push("meshes");
                    }
                    if(selector.indexOf(':material') !== -1) {
                        selector = selector.replace(':material', '');
                        types.push("materials");
                    }
                    if(selector.indexOf(':light') !== -1) {
                        selector = selector.replace(':light', '');
                        types.push("lights");
                    }
                    if(selector.indexOf(':camera') !== -1) {
                        selector = selector.replace(':camera', '');
                        types.push("cameras");
                    }
                    if(selector.indexOf(':texture') !== -1) {
                        selector = selector.replace(':texture', '');
                        types.push("textures");
                    }
                    if(types.length == 0) {
                        types = ["meshes", "materials", "lights", "cameras", "textures"];
                    }
                    var attributes = [];
                    var regExpAttribute = /\[(.*?)\]/;
                    var matched = regExpAttribute.exec(selector);
                    if(matched) {
                        selector = selector.replace(matched[0], '');
                        var expr = matched[1];
                        var operator;
                        if(expr.indexOf('!=') != -1) {
                            operator = '!=';
                        }
                        else {
                            if(expr.indexOf('=') != -1) {
                                operator = '=';
                            }
                        }

                        if(operator){
                            var split = expr.split(operator);
                            attributes.push({
                                'property' : split[0],
                                'operator' : operator,
                                'value' : split[1].replace(/[""]/g, '')
                            })
                        }
                        else {
                            attributes.push({
                                'property' : expr
                            })
                        }
                    };

                    var exp = selector.replace(/\*/g, '.*'),
                        regExp = new RegExp('^' + exp + '$'),
                        scene = _r.scene;

                    if(selector == "scene") {
                        self[i++] = scene;
                    }

                    types.forEach(function(_type) {
                        scene[_type].forEach(function(_item) {
                            // TODO : name or ID ?
                            if(regExp.test(_item.name)) {
                                if(attributes.length > 0) {
                                    attributes.forEach(function(attribute) {
                                        if(attribute.hasOwnProperty('operator')) {
                                            if(_item.hasOwnProperty(attribute.property)) {
                                                switch(attribute.operator) {
                                                    case '=':
                                                        if(_item[attribute.property].toString() == attribute.value) {
                                                            self[i++] = _item;
                                                        }
                                                        break;
                                                    case '!=':
                                                        if(_item[attribute.property].toString() != attribute.value) {
                                                            self[i++] = _item;
                                                        }
                                                        break;
                                                    default :
                                                        console.warn('BABYLON.Runtime._r : unrecognized operator ' + attribute.operator);
                                                }
                                            }
                                        }
                                        else {
                                            if(_item.hasOwnProperty(attribute.property)) {
                                                self[i++] = _item;
                                            }
                                        }
                                    })
                                }
                                else {
                                    self[i++] = _item;
                                }

                            }
                        });
                    });
                    self.length = i;
                });
                if (this.length == 0) {
                    console.warn('BABYLON.Runtime::no object(s) found for selector "' + params + '"')
                }
            }
            else {
                if(params instanceof Elements) {
                    this.length = 0;
                    var self = this;
                    params.each(function(element) {
                        self[self.length++] = element
                    });
                }
                else {
                    this[0] = params;
                    this.length = 1;
                }
            }
            // TODO : idea...WHAT IF ?
            // if(isMeshes || isCamera) -> rotate, move, etc.
            // if(isLights) ->
            // if(isScene) ->
            // if(isTextures) ->
        }

        patch(value: any) : Elements {
            return _r.patch(this, value);
        }

        data(key? : string, value? : any) : Elements {
            return _r.data(this, key, value);
        }

        log(property?: string) : Elements{
            this.each(function (item) {
                if (property) {
                    console.log(item[property]);
                }
                else {
                    console.log(item);
                }
            });
            return this;
        }

        on(type : string, handler : (args : any) => void) : Elements{
            return _r.on(this, type, handler);
        }

        one(type : string, handler : (args : any) => void): Elements {
           return _r.one(this, type, handler);
        }

        off(type : string, handler? : (args : any) => void) : Elements{
            return _r.off(this, type, handler);
        }

        trigger(type : string, data? : any) : Elements{
            return _r.trigger(this, type, data);
        }

        animate(properties : any, options? : any) : void{
            return _r.animate(this, properties, options);
        }

        fadeOut(options : any[]) {
            return this.fadeTo(0, options);
        }

        fadeIn(options : any[]) {
           return this.fadeTo(1, options);
        }

        fadeTo(value : number, options : any) {
            return _r.animate(this, {
                visibility : value,
                alpha : value
            }, options)
        }

        stop(animationName? : string) : Elements{
            this.each(function(element) {
                _r.scene.stopAnimation(element, animationName);
            });
            return this;
        }

        finish()  {

        }

        each(callback: Function) : Elements{
            for (var i = 0; i < this.length; i++) {
                /** We can break the .each() loop at a particular iteration by making the callback function return false. Returning non-false is the same as a continue statement in a for loop; it will skip immediately to the next iteration. **/
                if(callback.call(this[i], this[i], i) == false) {
                    return;
                }
            }
            return this;
        }

        map(func : (obj : any) => any) : Elements {
            var result = new Elements();
            var length = 0;
            this.each(function(element) {
                result[length++] = func(element);
            })
            result.length = length;
            return result;
        }

        filter(func : (obj : any) => boolean) : Elements{
            var result = new Elements();
            var length = 0;
            this.each(function(element) {
                if(func(element)) {
                    result[length++] = element;
                }
            });
            result.length = length;
            return result;
        }

        concat(...elements : any[]) : Elements {
            var self = this;
            elements.forEach(function(element) {
                var base;
                // TODO : all of this should maybe being in the constructor....
                if(element instanceof Elements) {
                   base = element;
                }
                else {
                   if(_r.is.String(element)) {
                       base = new Elements(element);
                   }
                   else {
                       if(_r.is.Array(element)) {
                           base = new Elements();
                           element.forEach(function(item) {
                               base[base.length++] = item;
                           })
                       }
                       else {
                           base = new Elements(element);
                       }
                   }
                }
                base.each(function(item) {
                    self[self.length++] = item;
                })
            });
            return this;
        }

        toArray() : any[] {
            var result = [];
            for (var i = 0; i < this.length; i++) {
                result.push(this[i]);
            }
            return result;
        }

        attr(attribute: string, value?: any) : any {
            if (value) {
                this.each(function (item) {
                    item[attribute] = value;
                });
                return this;
            }
            else {
                return this[0][attribute];
            }
        }

        /**
         * Reduce the set of matched elements to the first in the set.
         * @returns {any}
         */
        first() : any {
            return this[0];
        }

        /**
         * Reduce the set of matched elements to the one at the specified index.
         * @param index
         */
        eq(index : number) : Elements {
            return new Elements(this[index]);
        }

        get(index? : number) : any {
            if(index) {
                return this[index];
            }
            else {
                return this.toArray();
            }
        }

        // TODO https://api.jquery.com/slice/
        /**
         slice(start : number, end? : number) : BABYLON.Runtime._r {
            //return slice.apply(this, arguments)
        }**/


        /** TODO CLONE **/
    }

    export function select(params) : Elements{
        return new Elements(params);
    }
}

