module _r {
    export class Animation {
        public animationType : number;
        public keys : Array<any>;
        public easing : string;
        public fps : number;
        public duration : number;
        public speedRatio : number;
        public enableBlending : boolean;
        public blendingSpeed : number;
        public loop : string | number | boolean;
        public animatables : Array<BABYLON.Animatable>;
        public onAnimationEnd : () => void;
        public onAnimationStart : () => void;
        public _onAnimationFrame : (frame : number, callback : () => void) => void;

        constructor(public elements : any, public property : string, public value : any) {
            this.fps = 30;
            this.duration = 0.4;
            this.speedRatio = 1;
            this.elements = _r.select(elements);
            var element = _r.select(elements)[0];
            if(_r.is.Vector2(element[property])) {
                this.animationType = BABYLON.Animation.ANIMATIONTYPE_VECTOR2;
                return;
            }
            if(_r.is.Vector3(element[property])) {
                this.animationType =  BABYLON.Animation.ANIMATIONTYPE_VECTOR3;
                return;
            }
            if(_r.is.Number(element[property])) {
                this.animationType =  BABYLON.Animation.ANIMATIONTYPE_FLOAT;
                return;
            }
            if(_r.is.Color(element[property])) {
                this.animationType =  BABYLON.Animation.ANIMATIONTYPE_COLOR3;
                return;
            }
            if(_r.is.Quaternion(element[property])) {
                this.animationType =  BABYLON.Animation.ANIMATIONTYPE_QUATERNION;
                return;
            }
            if(_r.is.Matrix(element[property])) {
                this.animationType =  BABYLON.Animation.ANIMATIONTYPE_MATRIX;
                return;
            }
        }

        getKeys(element : any) {
            if(this.keys) {
                return this.keys;
            }
            else {
                var initialValue = element[this.property];
                var finalValue;
                switch(this.animationType) {
                    case BABYLON.Animation.ANIMATIONTYPE_COLOR3:
                        finalValue = new BABYLON.Color3();
                        _r.extend(finalValue, initialValue, _r.color(this.value));
                        break;
                    case BABYLON.Animation.ANIMATIONTYPE_FLOAT:
                        finalValue = this.value;
                        break;
                    case BABYLON.Animation.ANIMATIONTYPE_MATRIX:
                        finalValue = new BABYLON.Matrix();
                        _r.extend(finalValue, initialValue, this.value);
                        break;
                    case BABYLON.Animation.ANIMATIONTYPE_QUATERNION:
                        finalValue = new BABYLON.Quaternion();
                        _r.extend(finalValue, initialValue, this.value);
                        break;
                    case BABYLON.Animation.ANIMATIONTYPE_SIZE:
                        finalValue = new BABYLON.Size(0, 0);
                        _r.extend(finalValue, initialValue, this.value);
                        break;
                    case BABYLON.Animation.ANIMATIONTYPE_VECTOR2:
                        finalValue = new BABYLON.Vector2(0, 0);
                        _r.extend(finalValue, initialValue, this.value);
                        break;
                    case BABYLON.Animation.ANIMATIONTYPE_VECTOR3:
                        finalValue = new BABYLON.Vector3(0, 0, 0);
                        _r.extend(finalValue, initialValue, this.value);
                        break;
                }
                return [
                    {
                        frame : 0,
                        value : initialValue
                    },
                    {
                        frame : this.fps * this.duration,
                        value : finalValue
                    }
                ]

            }
        }

        private onComplete() {
            if(this.animatables) {
                this.animatables.forEach(function(animatable) {
                    if(animatable.animationStarted) {
                        return;
                    }
                });
                if(this.onAnimationEnd) {
                    this.onAnimationEnd();
                }
            }
        }

        getLoopMode() : number {
            if(_r.is.Boolean(this.loop)) {
                if(this.loop) {
                    return BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE;
                }
            }
            if(_r.is.String(this.loop)) {
                if((<string> this.loop).toLowerCase() == "cycle") {
                    return BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE;
                }
                if((<string> this.loop).toLocaleLowerCase() == "relative" || (<string> this.loop).toLocaleLowerCase() == "pingpong") {
                    return BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE;
                }
            }
            else {
                if(_r.is.Number(this.loop)) {
                    return <number> this.loop;
                }
            }
            return BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT;
        }



        play(from? : number, to? : number) {
            var self = this;
            var started = false;
            var completed = false;
            var loop = this.getLoopMode();
            this.elements.each(function(element) {
                if(!element.animations) {
                    element.animations = [];
                }
                var animation = new BABYLON.Animation("_r.animation" + element.animations.length, self.property, self.fps, self.animationType, loop);
                var keys = self.getKeys(element);
                animation.setKeys(keys);
                if(self.enableBlending == true) {
                    animation.enableBlending = true;
                    if(self.blendingSpeed) {
                        animation.blendingSpeed = self.blendingSpeed;
                    }
                }

                if(self.easing) {
                    animation.setEasingFunction(_r.Animation.getEasingFunction(self.easing));
                }
                element.animations.push(animation);

                if(!self.animatables) {
                    self.animatables = [];
                }
                var animatable = _r.scene.beginAnimation(element, from ? from : 0, to ? to : self.fps * self.duration, true, self.speedRatio);
                //_r.trigger(_r.scene, 'animationStart', animatable);
                animatable.onAnimationEnd = self.onComplete;
                self.animatables.push(animatable);
            });
            if(this.animatables && this.animatables.length > 0) {
                if(this.onAnimationStart) {
                    this.onAnimationStart();
                }
            }
        }

        pause() {
            this.elements.each(function(element) {
                var animatable = _r.scene.getAnimatableByTarget(element);
                animatable.pause();
            });
        }

        restart() {
            this.elements.each(function(element) {
                var animatable = _r.scene.getAnimatableByTarget(element);
                animatable.restart();
            });
        }

        stop() {
            this.elements.each(function(element) {
                var animatable = _r.scene.getAnimatableByTarget(element);
                animatable.stop();
            });
        }

        reset() {
            this.elements.each(function(element) {
                var animatable = _r.scene.getAnimatableByTarget(element);
                animatable.reset();
            });
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

    }

    export interface IAnimation {
        fps? : number;
        duration? : number;
        speedRatio? : number;
        name? : string;
        from? : number;
        to? : number;
        loopMode? : boolean | number;
        easing? : string;
        step : (frame) => void;
        progress : (promise, progress, remaining) => void;
        complete : () => void;
        start : () => void;
        keys : Array<any>;
    }



    export function animate(elements : string | Elements, properties : any, options? : number | IAnimation | any)  {
        Object.getOwnPropertyNames(properties).forEach(function(property){
            var animation = new _r.Animation(elements, property, properties[property]);
            if(_r.is.Number(options)) {
                animation.duration = <number> options;
            }
            else {
                for(var option in <IAnimation> options) {
                    animation[option] = options[option];
                }
            }
            animation.play();
        });


    }
}
