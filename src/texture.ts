module _r.texture {
    export interface IBaseTexture {
        url : string;
        noMipmap? : boolean;
        invertY? : boolean;
        coordinatesMode? : string | number
        samplingMode? : string | number;
        onLoad? : () => void;
        onError? : () => void;
        buffer? : any;
    }

    export interface ICubeTexture {
        rootUrl : string; // Link of the texture
        extensions? : string[]; //The cube texture extensions. The defaults extensions are : [_px.jpg, _py.jpg, _pz.jpg, _nx.jpg, _ny.jpg, _nz.jpg]
        noMipmap? : boolean;
        files? : string[];
        onLoad? : () => void;
        coordinatesMode? : string | number
    }

    export interface IVideoTexture {
        name : string;
        urls : string[] | HTMLVideoElement;
        generateMipMaps? : boolean;
        invertY? : boolean;
        samplingMode? : string | number;
    }

    /**
     * Create BABYLON.BaseTexture
     * @param params
     * @returns {BABYLON.BaseTexture}
     */
    export function base(params : IBaseTexture) : BABYLON.BaseTexture {
        if(params.samplingMode) {
            if(is.Number(params.samplingMode)) {
                params.samplingMode = <number> params.samplingMode;
            }
            else {
                params.samplingMode = BABYLON.Texture[params.samplingMode];
            }
        }
        var texture = new BABYLON.Texture(params.url, _r.scene, params.noMipmap, params.invertY, <number>params.samplingMode, params.onLoad, params.onError, params.buffer);
        if(params.coordinatesMode) {
            if(is.Number(params.coordinatesMode)) {
                texture.coordinatesMode = <number> params.coordinatesMode;
            }
            else {
                texture.coordinatesMode = BABYLON.Texture[params.coordinatesMode];
            }
        }
        return _r.merge(texture, params, ["url", "noMipmap", "invertY", "coordinatesMode", "samplingMode", "onLoad", "onError", "buffer"]);
    }

    /**
     * Create BABYLON.CubeTexture
     * @param params
     * @returns {BABYLON.CubeTexture}
     */
    export function cube(params : ICubeTexture) : BABYLON.CubeTexture {
        var texture = new BABYLON.CubeTexture(params.rootUrl, _r.scene, params.extensions, params.noMipmap, params.files, params.onLoad);
        if(params.coordinatesMode) {
            if(_r.is.Number(params.coordinatesMode)) {
                texture.coordinatesMode = <number> params.coordinatesMode;
            }
            else {
                texture.coordinatesMode = BABYLON.Texture[params.coordinatesMode];
            }
        }
        return _r.merge(texture, params, ["rootUrl", "extensions", "noMipmap", "files", "onLoad", "coordinatesMode"]);
    }

    /**
     * Create BABYLON.VideoTexture
     * @param params
     * @returns {BABYLON.VideoTexture}
     */
    export function video(params : IVideoTexture) : BABYLON.VideoTexture {
        if(params.samplingMode) {
            if(is.Number(params.samplingMode)) {
                params.samplingMode = <number> params.samplingMode;
            }
            else {
                params.samplingMode = BABYLON.Texture[params.samplingMode];
            }
        }

        var texture = new BABYLON.VideoTexture(params.name, params.urls, _r.scene, params.generateMipMaps, params.invertY, <number> params.samplingMode);
        return _r.merge(texture, params, ["name", "urls", "generateMipMaps", "invertY", "samplingMode"]);
    }

    /** TODO
    export function hdr() {

    }

    export function mirror() {

    }

    export function dynamic() {

    }

    export function map() {

    }

    export function font() {

    }

    export function refraction() {

    }

    **/

    _r.override(["texture.base"], function(target, source, property) {
        return texture.base(source[property]);
    });

    _r.override(["texture.cube"], function(target, source, property) {
        return texture.cube(source[property]);
    });

    _r.override(["texture.video"], function(target, source, property) {
        return texture.video(source[property]);
    });
}