module _r.camera {
    var name : string;

    var eventPrefix = BABYLON.Tools.GetPointerPrefix();

    class PanCameraPointersInput implements BABYLON.ICameraInput<BABYLON.ArcRotateCamera> {
        camera: BABYLON.ArcRotateCamera;


        public buttons = [0, 1, 2];


        public angularSensibilityX = 1000.0;


        public angularSensibilityY = 1000.0;


        public pinchPrecision = 6.0;


        public panningSensibility: number = 50.0;

        private _isPanClick: boolean = true;
        public pinchInwards = true;

        private _pointerInput: (p: BABYLON.PointerInfo, s: BABYLON.EventState) => void;
        private _observer: BABYLON.Observer<BABYLON.PointerInfo>;
        private _onKeyDown: (e: KeyboardEvent) => any;
        private _onKeyUp: (e: KeyboardEvent) => any;
        private _onMouseMove: (e: MouseEvent) => any;
        private _onGestureStart: (e: PointerEvent) => void;
        private _onGesture: (e: MSGestureEvent) => void;
        private _MSGestureHandler: MSGesture;
        private _onLostFocus: (e: FocusEvent) => any;
        private _onContextMenu: (e: PointerEvent) => void;

        public attachControl(element: HTMLElement, noPreventDefault?: boolean) {
            var engine = this.camera.getEngine();
            var cacheSoloPointer: { x: number, y: number, pointerId: number, type: any }; // cache pointer object for better perf on camera rotation
            var pointA: { x: number, y: number, pointerId: number, type: any }, pointB: { x: number, y: number, pointerId: number, type: any };
            var previousPinchDistance = 0;

            this._pointerInput = (p, s) => {
                var evt = <PointerEvent>p.event;

                if (p.type !== BABYLON.PointerEventTypes.POINTERMOVE && this.buttons.indexOf(evt.button) === -1) {
                    return;
                }

                if (p.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                    try {
                        evt.srcElement.setPointerCapture(evt.pointerId);
                    } catch (e) {
                        //Nothing to do with the error. Execution will continue.
                    }


                    // Manage panning with pan button click
                    //this._isPanClick = evt.button === this.camera._panningMouseButton;
                    this._isPanClick = true;
                    // manage pointers
                    cacheSoloPointer = { x: evt.clientX, y: evt.clientY, pointerId: evt.pointerId, type: evt.pointerType };
                    if (pointA === undefined) {
                        pointA = cacheSoloPointer;
                    }
                    else if (pointB === undefined) {
                        pointB = cacheSoloPointer;
                    }
                    if (!noPreventDefault) {
                        evt.preventDefault();
                        element.focus();
                    }
                } else if (p.type === BABYLON.PointerEventTypes.POINTERUP) {
                    try {
                        evt.srcElement.releasePointerCapture(evt.pointerId);
                    } catch (e) {
                        //Nothing to do with the error.
                    }

                    cacheSoloPointer = null;
                    previousPinchDistance = 0;

                    //would be better to use pointers.remove(evt.pointerId) for multitouch gestures,
                    //but emptying completly pointers collection is required to fix a bug on iPhone :
                    //when changing orientation while pinching camera, one pointer stay pressed forever if we don't release all pointers
                    //will be ok to put back pointers.remove(evt.pointerId); when iPhone bug corrected
                    pointA = pointB = undefined;

                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                } else if (p.type === BABYLON.PointerEventTypes.POINTERMOVE) {
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }

                    // One button down
                    if (pointA && pointB === undefined) {
                        if (this.panningSensibility !== 0 &&
                            ((this.camera._useCtrlForPanning) ||
                            (!this.camera._useCtrlForPanning && this._isPanClick))) {
                            this.camera
                                .inertialPanningX += -(evt.clientX - cacheSoloPointer.x) / this.panningSensibility;
                            this.camera
                                .inertialPanningY += (evt.clientY - cacheSoloPointer.y) / this.panningSensibility;
                        } else {
                            var offsetX = evt.clientX - cacheSoloPointer.x;
                            var offsetY = evt.clientY - cacheSoloPointer.y;
                            this.camera.inertialAlphaOffset -= offsetX / this.angularSensibilityX;
                            this.camera.inertialBetaOffset -= offsetY / this.angularSensibilityY;
                        }

                        cacheSoloPointer.x = evt.clientX;
                        cacheSoloPointer.y = evt.clientY;
                    }

                    // Two buttons down: pinch
                    else if (pointA && pointB) {
                        //if (noPreventDefault) { evt.preventDefault(); } //if pinch gesture, could be useful to force preventDefault to avoid html page scroll/zoom in some mobile browsers
                        var ed = (pointA.pointerId === evt.pointerId) ? pointA : pointB;
                        ed.x = evt.clientX;
                        ed.y = evt.clientY;
                        var direction = this.pinchInwards ? 1 : -1;
                        var distX = pointA.x - pointB.x;
                        var distY = pointA.y - pointB.y;
                        var pinchSquaredDistance = (distX * distX) + (distY * distY);
                        if (previousPinchDistance === 0) {
                            previousPinchDistance = pinchSquaredDistance;
                            return;
                        }

                        if (pinchSquaredDistance !== previousPinchDistance) {
                            this.camera
                                .inertialRadiusOffset += (pinchSquaredDistance - previousPinchDistance) /
                                (this.pinchPrecision *
                                ((this.angularSensibilityX + this.angularSensibilityY) / 2) *
                                direction);
                            previousPinchDistance = pinchSquaredDistance;
                        }
                    }
                }
            }

            this._observer = this.camera.getScene().onPointerObservable.add(this._pointerInput, BABYLON.PointerEventTypes.POINTERDOWN | BABYLON.PointerEventTypes.POINTERUP | BABYLON.PointerEventTypes.POINTERMOVE);

            this._onContextMenu = evt => {
                evt.preventDefault();
            };

            if (!this.camera._useCtrlForPanning) {
                element.addEventListener("contextmenu", this._onContextMenu, false);
            }

            this._onLostFocus = () => {
                //this._keys = [];
                pointA = pointB = undefined;
                previousPinchDistance = 0;
                cacheSoloPointer = null;
            };

            this._onMouseMove = evt => {
                if (!engine.isPointerLock) {
                    return;
                }

                var offsetX = evt.movementX || evt.mozMovementX || evt.webkitMovementX || evt.msMovementX || 0;
                var offsetY = evt.movementY || evt.mozMovementY || evt.webkitMovementY || evt.msMovementY || 0;

                this.camera.inertialAlphaOffset -= offsetX / this.angularSensibilityX;
                this.camera.inertialBetaOffset -= offsetY / this.angularSensibilityY;

                if (!noPreventDefault) {
                    evt.preventDefault();
                }
            };

            this._onGestureStart = e => {
                if (window.MSGesture === undefined) {
                    return;
                }

                if (!this._MSGestureHandler) {
                    this._MSGestureHandler = new MSGesture();
                    this._MSGestureHandler.target = element;
                }

                this._MSGestureHandler.addPointer(e.pointerId);
            };

            this._onGesture = e => {
                this.camera.radius *= e.scale;


                if (e.preventDefault) {
                    if (!noPreventDefault) {
                        e.stopPropagation();
                        e.preventDefault();
                    }
                }
            };

            element.addEventListener("mousemove", this._onMouseMove, false);
            element.addEventListener("MSPointerDown", this._onGestureStart, false);
            element.addEventListener("MSGestureChange", this._onGesture, false);

            //element.addEventListener("keydown", this._onKeyDown, false);
            //element.addEventListener("keyup", this._onKeyUp, false);

            BABYLON.Tools.RegisterTopRootEvents([
                { name: "blur", handler: this._onLostFocus }
            ]);
        }

        public detachControl(element: HTMLElement) {
            if (element && this._observer) {
                this.camera.getScene().onPointerObservable.remove(this._observer);
                this._observer = null;

                element.removeEventListener("contextmenu", this._onContextMenu);
                element.removeEventListener("mousemove", this._onMouseMove);
                element.removeEventListener("MSPointerDown", this._onGestureStart);
                element.removeEventListener("MSGestureChange", this._onGesture);

                element.removeEventListener("keydown", this._onKeyDown);
                element.removeEventListener("keyup", this._onKeyUp);

                this._isPanClick = true;
                this.pinchInwards = true;

                this._onKeyDown = null;
                this._onKeyUp = null;
                this._onMouseMove = null;
                this._onGestureStart = null;
                this._onGesture = null;
                this._MSGestureHandler = null;
                this._onLostFocus = null;
                this._onContextMenu = null;
            }

            BABYLON.Tools.UnregisterTopRootEvents([
                { name: "blur", handler: this._onLostFocus }
            ]);
        }

        getTypeName(): string {
            return "ArcRotateCameraPointersInput";
        }

        getSimpleName() {
            return "pointers";
        }
    }

    export function toPanCamera(camera : string | BABYLON.Camera) : BABYLON.Camera {
        camera = <BABYLON.Camera> _r.select(camera)[0];
        camera.inputs.remove(camera.inputs.attached['pointers']);
        var panInputs = new PanCameraPointersInput();
        camera.inputs.add(panInputs);
        return camera;
    }

    export function isActive(camera: BABYLON.Camera | string) {
        if(_r.is.String(camera)) {
            return _r.scene.activeCamera.name == camera;
        }
        else {
            return _r.scene.activeCamera.name = (<BABYLON.Camera> camera).name;
        }
    }

    export function activate(camera: BABYLON.Camera | string) {
        var _camera = camera instanceof BABYLON.Camera ? camera : _r.scene.getCameraByName(camera);
        console.info('setActiveCamera : ' + _camera.name);
        if (_r.scene.activeCamera) {
            _r.scene.activeCamera.detachControl(_r.canvas);
            if(_r.scene.activeCamera.hasOwnProperty("OnDeactivate")) {
                try {
                    _r.scene.activeCamera["OnDeactivate"].call(_r.scene.activeCamera);
                }
                catch(ex) {
                    console.error('_r::setActiveCamera::OnDeactivate', ex);
                }
            }
        }
        if(_camera.hasOwnProperty("OnActivate")) {
            try {
                _camera["OnActivate"].call( _camera);

            }
            catch (ex) {
                console.error('_r::setActiveCamera::OnActivate', ex);
            }

        }
        _r.scene.activeCamera = _camera;
        _r.scene.activeCamera.attachControl(_r.canvas);
    }

    _r.override(
        ["OnActivate"],
        function(target, source, property) {
            target["OnActivate"] = source[property];
        });
    _r.override(
        ["OnDeactivate"],
        function(target, source, property) {
            target["OnDeactivate"] = source[property];
        });

    export function goTo(position : BABYLON.Vector3, rotation? : BABYLON.Vector3, options? : any) : void {
        if(options == false) {
            var activeCamera = _r.select(_r.scene.activeCamera)[0];
            activeCamera.position = position;
            activeCamera.rotation = rotation;
        }
        else {
            if(rotation) {
                return _r.animate(_r.scene.activeCamera, {
                    position : position,
                    rotation : rotation
                }, options);
            }
            else {
                return _r.animate(_r.scene.activeCamera, {
                    position : position
                }, options);
            }
        }
    }
    export interface IFreeCamera {
        name : string,
        position? : any,
        target : any
    }

    export function free(params : IFreeCamera) : BABYLON.FreeCamera {
       if(params.position) {
           if(!_r.is.Vector3(params.position)) {
               params.position = new BABYLON.Vector3(
                   params.position['x'] ? params.position['x'] : 0,
                   params.position['y'] ? params.position['y'] : 0,
                   params.position['z'] ? params.position['z'] : 0);
           }
       }
       else {
           params.position = new BABYLON.Vector3(0, 0, 0);
       }
       var _camera = new BABYLON.FreeCamera(params.name, params.position, _r.scene);
       if(params.target) {
           if(!_r.is.Vector3(params.target)) {
               params.target = new BABYLON.Vector3(
                   params.target['x'] ? params.target['x'] : 0,
                   params.target['y'] ? params.target['y'] : 0,
                   params.target['z'] ? params.target['z'] : 0
               )
           }
           _camera.setTarget(params.target);
       }
       return _r.merge(_camera, params, ['name', 'position']);
    }

    _r.override(['camera.free'], function(target, source, property){
        return free(source[property]);
    });

    export interface IArcRotateCamera {
        name : string,
        alpha : number,
        beta : number,
        radius : number,
        target : BABYLON.Vector3 | any
    };

    export function arcrotate(params : IArcRotateCamera) : BABYLON.ArcRotateCamera {
        if(params.target) {
            if(!_r.is.Vector3(params.target)) {
                params.target = new BABYLON.Vector3(
                    params.target['x'] ? params.target['x'] : 0,
                    params.target['y'] ? params.target['y'] : 0,
                    params.target['z'] ? params.target['z'] : 0
                )
            }
           else {
                params.target = new BABYLON.Vector3(0, 0, 0);
            }
        }
        var _camera = new BABYLON.ArcRotateCamera(params.name, params.alpha, params.beta, params.radius, params.target, _r.scene);
        return _r.merge(_camera, params, ['name', 'alpha', 'beta', 'radius', 'target']);
    };

    _r.override(['camera.arcrotate'], function(target, source, property){
        return arcrotate(source[property]);
    });


}
