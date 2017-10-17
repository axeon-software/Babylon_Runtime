/// <reference types="q" />
declare module _r {
    var overrides: any[];
    function override(properties: Array<string>, callback: (target, source, property) => any): void;
    function extend(...params: any[]): any;
    function merge(target: any, source: any, excluded?: Array<string>): any;
    function patch(...params: any[]): Elements;
}
declare module _r {
    /** Helpers **/
    function color(...parameters: any[]): any;
    function showDebug(): void;
    function hideDebug(): void;
}
declare module _r.camera {
    function toPanCamera(camera: string | BABYLON.Camera): BABYLON.Camera;
    function isActive(camera: BABYLON.Camera | string): string | boolean;
    function activate(camera: BABYLON.Camera | string): void;
    function goTo(position: BABYLON.Vector3, rotation?: BABYLON.Vector3, options?: any): void;
    interface IFreeCamera {
        name: string;
        position?: any;
        target: any;
    }
    function free(params: IFreeCamera): BABYLON.FreeCamera;
    interface IArcRotateCamera {
        name: string;
        alpha: number;
        beta: number;
        radius: number;
        target: BABYLON.Vector3 | any;
    }
    function arcrotate(params: IArcRotateCamera): BABYLON.ArcRotateCamera;
}
declare module _r {
    /**
     * The .data() method allows us to attach data of any type to elements in a way that is safe from circular references and therefore from memory leaks.
     */
    function data(elements: any, key?: string, value?: any): any;
}
declare module _r.debug {
    var mode: string;
    function log(...options: any[]): void;
    function info(...options: any[]): void;
    function warn(...options: any[]): void;
    function error(...options: any[]): void;
}
declare module _r.dragdrop {
}
declare module _r {
    class Elements {
        length: number;
        constructor(params?: any);
        patch(value: any): Elements;
        data(key?: string, value?: any): Elements;
        log(property?: string): Elements;
        on(type: string, handler: (args: any) => void): Elements;
        one(type: string, handler: (args: any) => void): Elements;
        off(type: string, handler?: (args: any) => void): Elements;
        trigger(type: string, data?: any): Elements;
        animate(properties: any, options?: any): void;
        fadeOut(options: any[]): void;
        fadeIn(options: any[]): void;
        fadeTo(value: number, options: any): void;
        stop(animationName?: string): Elements;
        finish(): void;
        each(callback: Function): Elements;
        map(func: (obj: any) => any): Elements;
        filter(func: (obj: any) => boolean): Elements;
        concat(...elements: any[]): Elements;
        toArray(): any[];
        attr(attribute: string, value?: any): any;
        /**
         * Reduce the set of matched elements to the first in the set.
         * @returns {any}
         */
        first(): any;
        /**
         * Reduce the set of matched elements to the one at the specified index.
         * @param index
         */
        eq(index: number): Elements;
        get(index?: number): any;
    }
    function select(params: any): Elements;
}
declare module _r {
    function on(elements: any, event: string, handler: (...args: any[]) => void, repeat?: boolean): Elements;
    function one(elements: any, type: string, handler: (args: any) => void): Elements;
    function off(elements: any, type: string, handler?: (args: any) => void): Elements;
    function trigger(elements: any, event: string, data?: any): Elements;
}
declare module _r.is {
    function Function(functionToCheck: any): boolean;
    function Number(n: any): boolean;
    function PlainObject(n: any): boolean;
    function Array(x: any): boolean;
    function Mesh(x: any): boolean;
    function Vector3(x: any): boolean;
    function Vector2(x: any): boolean;
    function Color(x: any): boolean;
    function HexColor(x: any): boolean;
    function Float(n: any): boolean;
    function Int(n: any): boolean;
    function Quaternion(n: any): boolean;
    function Matrix(n: any): boolean;
    function String(x: any): boolean;
    function Material(x: any): boolean;
    function Texture(x: any): boolean;
    function PatchFile(expr: string): boolean;
}
declare module _r {
    var scene: any;
    var engine: any;
    var canvas: any;
    interface ILauncher {
        container?: string | HTMLCanvasElement;
        scene: Function | string;
        activeCamera?: string;
        patch?: Array<any>;
        assets?: string;
        beforeFirstRender?: Function;
        ktx?: boolean | Array<string>;
        enableOfflineSupport?: boolean;
        progressLoading: Function;
        loadingScreen: any;
    }
    function init(scene?: BABYLON.Scene): void;
    var isReady: boolean;
    function ready(callback: (scene: BABYLON.Scene, engine: BABYLON.Engine, canvas: HTMLCanvasElement) => void): void;
    function launch(params: ILauncher): Q.Promise<void>;
}
declare module _r.library {
    var libraries: any[];
    interface ILibrary {
        name: string;
        rootUrl: string;
        fileName: string;
        patch?: Array<any>;
        visible: boolean;
        beforeFirstRender: Function;
    }
    function show(params: ILibrary): Q.Promise<Array<BABYLON.AbstractMesh>>;
    function hide(libraryName: string): void;
}
declare module _r.light {
    interface IHemisphericLight {
        name: string;
        direction: any;
    }
    function hemispheric(params: IHemisphericLight): BABYLON.HemisphericLight;
}
declare module _r {
    function assignMaterial(...args: any[]): void;
}
declare module _r.material {
    interface IStandardMaterial {
        name: string;
    }
    function standard(params: IStandardMaterial): BABYLON.StandardMaterial;
}
declare module _r.mesh {
    /** Box **/
    interface IBox {
        name: string;
        size: number;
        updatable?: boolean;
        sideOrientation?: number | string;
    }
    function box(params: IBox): any;
    /** Sphere **/
    interface ISphere {
        name: string;
        segments: number;
        diameter: number;
        updatable?: boolean;
        sideOrientation?: number | string;
    }
    function sphere(params: ISphere): BABYLON.Mesh;
    /** Ground **/
    interface IGround {
        name: string;
        width: number;
        height: number;
        subdivisions: number;
        updatable?: boolean;
    }
    function ground(params: IGround): BABYLON.Mesh;
    /** Plane **/
    interface IPlane {
        name: string;
        size: number;
        updatable?: boolean;
        sideOrientation?: number | string;
    }
    function plane(params: IPlane): BABYLON.Mesh;
}
declare module _r.patchFile {
    function get(file: string): Q.Promise<any>;
    function apply(_patch: any): void;
    function load(patch: string | any): Q.Promise<any>;
}
declare module _r.reflectionProbe {
    interface IReflectionProbe {
        name: string;
        size: number;
        renderList?: string[];
        refreshRate?: string | number;
        attachToMesh?: string;
        position?: BABYLON.Vector3;
    }
    function create(params: IReflectionProbe): any;
}
declare module _r.renderloop {
    function run(): void;
    function stop(): void;
}
declare module _r.texture {
    interface IBaseTexture {
        url: string;
        noMipmap?: boolean;
        invertY?: boolean;
        coordinatesMode?: string | number;
        samplingMode?: string | number;
        onLoad?: () => void;
        onError?: () => void;
        buffer?: any;
    }
    interface ICubeTexture {
        rootUrl: string;
        extensions?: string[];
        noMipmap?: boolean;
        files?: string[];
        onLoad?: () => void;
        coordinatesMode?: string | number;
    }
    interface IVideoTexture {
        name: string;
        urls: string[] | HTMLVideoElement;
        generateMipMaps?: boolean;
        invertY?: boolean;
        samplingMode?: string | number;
    }
    /**
     * Create BABYLON.BaseTexture
     * @param params
     * @returns {BABYLON.BaseTexture}
     */
    function base(params: IBaseTexture): BABYLON.BaseTexture;
    /**
     * Create BABYLON.CubeTexture
     * @param params
     * @returns {BABYLON.CubeTexture}
     */
    function cube(params: ICubeTexture): BABYLON.CubeTexture;
    /**
     * Create BABYLON.VideoTexture
     * @param params
     * @returns {BABYLON.VideoTexture}
     */
    function video(params: IVideoTexture): BABYLON.VideoTexture;
}
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
declare module _r.animations.old {
    /**
     * Map http://easings.net to Babylon.EasingFunction
     * @param easing
     * @returns {any}
     */
    function getEasingFunction(easing: string): BABYLON.EasingFunction;
    /**
     * Guess the BABYLON.Animation.ANIMATIONTYPE from an element's property
     * @param element
     * @param property
     * @returns {any}
     */
    function getAnimationType(element: any, property: string): number;
    class Animation {
        name: string;
        property: string;
        value: any;
        private _fps;
        elements: Elements;
        constructor(name: string, elements: string | Elements, property: string, value: any);
        static getEasingFunction(easing: string): BABYLON.EasingFunction;
        static getAnimationType(element: any, property: string): number;
        easing: string;
        animationType: string;
        loopMode: string | boolean;
        keys: Array<any>;
        duration: number;
        fps: number;
        private getLoopMode();
        private _getAnimationType();
        private prepareAnimation();
        clip(from: number, to: number): void;
        play(): void;
        finish(): void;
    }
    interface IAnimationOption {
        duration: number;
        fps?: number;
        easing?: string;
        speedRatio?: number;
        onAnimationEnd?: Function;
        name?: string;
        keys?: any[];
        from: number;
        to?: number;
        loop: boolean;
    }
    function animate(nodes: string, properties: any, options?: number | IAnimationOption): Elements;
}
declare module _r {
    class Animation {
        elements: any;
        property: string;
        value: any;
        animationType: number;
        keys: Array<any>;
        easing: string;
        fps: number;
        duration: number;
        speedRatio: number;
        enableBlending: boolean;
        blendingSpeed: number;
        animatables: Array<BABYLON.Animatable>;
        onAnimationEnd: () => void;
        onAnimationStart: () => void;
        _onAnimationFrame: (frame: number, callback: () => void) => void;
        constructor(elements: any, property: string, value: any);
        getKeys(element: any): any[];
        private onComplete();
        play(from?: number, to?: number): void;
        pause(): void;
        restart(): void;
        stop(): void;
        reset(): void;
        static getEasingFunction(easing: string): BABYLON.EasingFunction;
    }
    interface IAnimation {
        fps?: number;
        duration?: number;
        speedRatio?: number;
        name?: string;
        from?: number;
        to?: number;
        loopMode?: boolean | number;
        easing?: string;
        step: (frame) => void;
        progress: (promise, progress, remaining) => void;
        complete: () => void;
        start: () => void;
        keys: Array<any>;
    }
    function animate(elements: string | Elements, properties: any, options?: number | IAnimation | any): void;
}
