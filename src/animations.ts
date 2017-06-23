/**
 *
 * # Examples
 * ## 2 seconds animation
 * ```js
 * _r.animate([
 *      {
 *          'mesh.000' : {
 *              position : {
 *                  x : 10
 *          }
 *      },
 *      {
 *          'mesh.001' : {
 *              position : {
 *                  y : 10
 *              }
 *          }
 *      }
 * }, 5)
 *
 * _r.animate('mesh.000', {
 *      position : {
 *          x : 10
 *      }
 * }, 2)
 * ```
 *
 * ## Easing with [easings](http://easings.net "easings.net")
 * ```js
 * _r.animations.animate('mesh.000', {
 *      position : {
 *          x : 10
 *      }
 * }, {
 *      duration : 2,
 *      easing : "easeOutQuint"
 * })
 * ```
 * @see {@link IAnimationOption}
 * ## Shortcuts
 * ### On elements
 * ```js
 * _r("mesh.*").animate(position : {
 *          x : 10
 * }, 2)
 * ```
 *
 *
 */
module _r.animations {
    /**
     * Map http://easings.net to Babylon.EasingFunction
     * @param easing
     * @returns {any}
     */
    export function getEasingFunction(easing : string) : BABYLON.EasingFunction {
        var mode;
        var func;
        if(easing.indexOf("easeInOut") != -1) {
            mode = BABYLON.EasingFunction.EASINGMODE_EASEINOUT;
            func = easing.replace("easeInOut", "");
        }
        else {
            if(easing.indexOf("easeIn") != -1) {
                mode = BABYLON.EasingFunction.EASINGMODE_EASEIN;
                func = easing.replace("easeIn", "");
            }
            else {
                if(easing.indexOf("easeOut") != -1) {
                    mode = BABYLON.EasingFunction.EASINGMODE_EASEOUT;
                    func = easing.replace("easeOut", "");
                }
                else {
                    console.info("_r::unrecognized easing function " + easing);
                    return null;
                }
            }
        }
        var easingFunction;
        switch(func) {
            case "Sine":
                easingFunction = new BABYLON.SineEase();
                easingFunction.setEasingMode(mode);
                return easingFunction;
            case "Quad":
                easingFunction = new BABYLON.QuadraticEase();
                easingFunction.setEasingMode(mode);
                return easingFunction;
            case "Cubic":
                easingFunction = new BABYLON.CubicEase();
                easingFunction.setEasingMode(mode);
                return easingFunction;
            case "Quart":
                easingFunction = new BABYLON.QuarticEase();
                easingFunction.setEasingMode(mode);
                return easingFunction;
            case "Quint":
                easingFunction = new BABYLON.QuinticEase();
                easingFunction.setEasingMode(mode);
                return easingFunction;
            case "Expo" :
                easingFunction = new BABYLON.ExponentialEase();
                easingFunction.setEasingMode(mode);
                return easingFunction;
            case "Circ":
                easingFunction = new BABYLON.CircleEase();
                easingFunction.setEasingMode(mode);
                return easingFunction;
            case "Back":
                easingFunction = new BABYLON.BackEase();
                easingFunction.setEasingMode(mode);
                return easingFunction;
            case "Elastic":
                easingFunction = new BABYLON.ElasticEase();
                easingFunction.setEasingMode(mode);
                return easingFunction;
            case "Bounce":
                easingFunction = new BABYLON.BounceEase();
                easingFunction.setEasingMode(mode);
                return easingFunction;
            default:
                console.warn("_r::unrecognized easing function " + easing);
                return null;
        }
    }

    /**
     * Guess the BABYLON.Animation.ANIMATIONTYPE from an element's property
     * @param element
     * @param property
     * @returns {any}
     */
    export function getAnimationType(element : any, property : string) : number {
        if(_r.is.Vector2(element[property])) {
            return BABYLON.Animation.ANIMATIONTYPE_VECTOR2;
        }
        if(_r.is.Vector3(element[property])) {
            return BABYLON.Animation.ANIMATIONTYPE_VECTOR3;
        }
        if(_r.is.Number(element[property])) {
            return BABYLON.Animation.ANIMATIONTYPE_FLOAT;
        }
        if(_r.is.Color(element[property])) {
            return BABYLON.Animation.ANIMATIONTYPE_COLOR3;
        }
        if(_r.is.Quaternion(element[property])) {
            return BABYLON.Animation.ANIMATIONTYPE_QUATERNION;
        }
        if(_r.is.Matrix(element[property])) {
            return BABYLON.Animation.ANIMATIONTYPE_MATRIX;
        }
        return null;
    }


    export class Animation {
        private _fps : number;
        public elements : Elements;
        constructor(public name : string, elements : string | Elements, public property : string, public value : any) {
            this.elements = _r.select(elements);
        }

        static getEasingFunction(easing : string) : BABYLON.EasingFunction {
            var mode;
            var func;
            if(easing.indexOf("easeInOut") != -1) {
                mode = BABYLON.EasingFunction.EASINGMODE_EASEINOUT;
                func = easing.replace("easeInOut", "");
            }
            else {
                if(easing.indexOf("easeIn") != -1) {
                    mode = BABYLON.EasingFunction.EASINGMODE_EASEIN;
                    func = easing.replace("easeIn", "");
                }
                else {
                    if(easing.indexOf("easeOut") != -1) {
                        mode = BABYLON.EasingFunction.EASINGMODE_EASEOUT;
                        func = easing.replace("easeOut", "");
                    }
                    else {
                        console.info("_r::unrecognized easing function " + easing);
                        return null;
                    }
                }
            }
            var easingFunction;
            switch(func) {
                case "Sine":
                    easingFunction = new BABYLON.SineEase();
                    easingFunction.setEasingMode(mode);
                    return easingFunction;
                case "Quad":
                    easingFunction = new BABYLON.QuadraticEase();
                    easingFunction.setEasingMode(mode);
                    return easingFunction;
                case "Cubic":
                    easingFunction = new BABYLON.CubicEase();
                    easingFunction.setEasingMode(mode);
                    return easingFunction;
                case "Quart":
                    easingFunction = new BABYLON.QuarticEase();
                    easingFunction.setEasingMode(mode);
                    return easingFunction;
                case "Quint":
                    easingFunction = new BABYLON.QuinticEase();
                    easingFunction.setEasingMode(mode);
                    return easingFunction;
                case "Expo" :
                    easingFunction = new BABYLON.ExponentialEase();
                    easingFunction.setEasingMode(mode);
                    return easingFunction;
                case "Circ":
                    easingFunction = new BABYLON.CircleEase();
                    easingFunction.setEasingMode(mode);
                    return easingFunction;
                case "Back":
                    easingFunction = new BABYLON.BackEase();
                    easingFunction.setEasingMode(mode);
                    return easingFunction;
                case "Elastic":
                    easingFunction = new BABYLON.ElasticEase();
                    easingFunction.setEasingMode(mode);
                    return easingFunction;
                case "Bounce":
                    easingFunction = new BABYLON.BounceEase();
                    easingFunction.setEasingMode(mode);
                    return easingFunction;
                default:
                    console.warn("_r::unrecognized easing function " + easing);
                    return null;
            }
        }

        static getAnimationType(element : any, property : string) : number {
            if(_r.is.Vector2(element[property])) {
                return BABYLON.Animation.ANIMATIONTYPE_VECTOR2;
            }
            if(_r.is.Vector3(element[property])) {
                return BABYLON.Animation.ANIMATIONTYPE_VECTOR3;
            }
            if(_r.is.Number(element[property])) {
                return BABYLON.Animation.ANIMATIONTYPE_FLOAT;
            }
            if(_r.is.Color(element[property])) {
                return BABYLON.Animation.ANIMATIONTYPE_COLOR3;
            }
            if(_r.is.Quaternion(element[property])) {
                return BABYLON.Animation.ANIMATIONTYPE_QUATERNION;
            }
            if(_r.is.Matrix(element[property])) {
                return BABYLON.Animation.ANIMATIONTYPE_MATRIX;
            }
            return null;
        }

        public easing : string;

        public animationType : string;

        public loopMode : string | boolean;

        public keys : Array<any>;

        public duration : number;

        get fps() : number {
            return this._fps || 30;
        }

        set fps(value : number) {
            this._fps = value;
        }

        private getLoopMode() {
            var _loopMode;
            if(this.loopMode != null) {
                if(_r.is.String(this.loopMode)) {
                    return BABYLON.Animation['ANIMATIONLOOPMODE_' + (<string> this.loopMode).toUpperCase()];
                }
                else {
                    return this.loopMode;
                }
            }
            return false;
        }

        private _getAnimationType() {
            if(this.animationType != null) {
                return BABYLON.Animation['ANIMATIONTYPE_' + this.animationType.toUpperCase()];
            }
            else {
                return Animation.getAnimationType(this.elements[0], this.property);
            }
        }

        private prepareAnimation() {
            var self = this;
            this.elements.each(function(element){
                console.log("animationType :", self._getAnimationType())
                var animation = new BABYLON.Animation(self.name, self.property, self.fps, self._getAnimationType(), self.getLoopMode());
                if(this.keys) {
                    animation.setKeys(self.keys);
                }
                else {
                    var keys = [];
                    keys.push({
                        frame : 0,
                        value : element[self.property]
                    });
                    keys.push({
                        frame : self.duration * self.fps,
                        value : _r.merge(element[self.property], self.value)
                    });
                    animation.setKeys(keys);
                }
                if(self.easing != null) {
                    animation.setEasingFunction(Animation.getEasingFunction(self.easing));
                }
                if(!element.animations) {
                    element.animations = [];
                }
                element.animations.push(animation);
            });
        }

        clip(from : number, to : number) {
            this.prepareAnimation();
            var self = this;
            this.elements.each(function(element) {
                _r.scene.beginAnimation(element, from, to, self.getLoopMode())
            });
        }

        play() {
            this.elements.log('animations');
            this.clip(0, this.duration * this._fps);
        }

        finish() {

        }
    }

    export interface IAnimationOption {
        duration : number;
        fps? : number;
        easing? : string;
        speedRatio? : number;
        onAnimationEnd? : Function;
        name? : string,
        keys? : any[],
        from : number,
        to? : number,
        loop : boolean
    }

    var animateOptions = {
        duration : 2,
        fps : 25,
        easing : null,
        speedRatio : 1,
        onAnimationEnd : null,
        keys : null,
        from : 0,
        to : null,
        loop : false
    };

    function getAnimationOptions(options? : any) : IAnimationOption {
        if(!options) {
            return animateOptions;
        }
        var _options;
        if(_r.is.Number(options)) {
            _options = {
                "duration" : options
            }
        }
        else {
             _options = options;
        }
        for(var property in animateOptions) {
            if(!_options[property]) {
                _options[property] = animateOptions[property];
            }
        }
        return _options;
    }

    export function animate(nodes : string, properties : any, options? : number | IAnimationOption) : Elements {
        var elements = new Elements(nodes);
        var _options = getAnimationOptions(options);
        var to = _options.to ? _options.to : _options.duration * _options.fps;
        var from = _options.from ? _options.from : 0 ;
        elements.each(function(element) {
            if(!element.animations) {
                element.animations = [];
            }
            var value, name = _options.name || "animation" + element.animations.length;
            Object.getOwnPropertyNames(properties).forEach(function(property) {
                var propertyPath = property.split('.');
                var startValue = element[propertyPath[0]];
                if(propertyPath.length > 1) {
                    for(var i = 1; i < propertyPath.length; i++) {
                        startValue = startValue[propertyPath[i]];
                    }
                }
                var endValue = properties[property];
                var animationType = getAnimationType(element, property) || BABYLON.Animation.ANIMATIONTYPE_FLOAT;
                if(_r.is.PlainObject(properties[property])) {
                    endValue = _r.extend({}, element[property]);
                    Object.getOwnPropertyNames(properties[property]).forEach(function(prop) {
                        endValue[prop] = properties[property][prop];
                    });
                    if(animationType == BABYLON.Animation.ANIMATIONTYPE_COLOR3) {
                        endValue = new BABYLON.Color3(endValue[0], endValue[1], endValue[2]);
                    }
                }

                var animation = new BABYLON.Animation(name, property, _options.fps, animationType, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                var keys;
                if(_options.keys) {
                    keys = _options.keys;
                }
                else {
                    keys = [];
                    keys.push({
                        frame : from,
                        value : startValue
                    });
                    keys.push({
                        frame : to,
                        value : endValue
                    });
                }
                animation.setKeys(keys);
                if(_options.easing) {
                    var easingFunction = getEasingFunction(_options.easing);
                    if(easingFunction) {
                        animation.setEasingFunction(easingFunction);
                    }
                }
                element.animations.push(animation);
            });
            _r.trigger(element, "onAnimationStart");

            _r.scene.beginAnimation(element, from, to, _options.loop, _options.speedRatio, function() {
                if(_options.onAnimationEnd) {
                    _options.onAnimationEnd.call(element);
                }
                _r.trigger(element, "onAnimationEnd")
            });
        });
        return elements;
    }


}

module _r {
    export function animate(...params : any[]) {
        if(params.length == 2) {
            if(_r.is.String(params[0])) {
                _r.animations.animate(params[0], params[1]);
            }
            else {
                if(_r.is.Array(params[0])) {
                    params[0].forEach(function(param) {

                        _r.animate(param, params[1]);
                    });
                }
                else {
                    Object.getOwnPropertyNames(params[0]).forEach(function(param) {
                        _r.animations.animate(param, params[0][param], params[1]);
                    });
                }

            }
        }
        else {
            if(params.length == 3) {
                _r.animations.animate(params[0], params[1], params[2]);
            }
            else {
                console.error("_r.animate required 2 or 3 arguments, not " + params.length);
            }
        }
    }
}

