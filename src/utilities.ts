module _r {
    /** Overrides **/
    _r.override(
        [
            'NothingTrigger ',
            'OnPickTrigger',
            'OnLeftPickTrigger',
            'OnRightPickTrigger',
            'OnCenterPickTrigger',
            'OnPickDownTrigger',
            'OnPickUpTrigger',
            'OnPickOutTrigger',
            'OnLongPressTrigger',
            'OnPointerOverTrigger',
            'OnPointerOutTrigger',
            'OnEveryFrameTrigger',
            'OnIntersectionEnterTrigger',
            'OnIntersectionExitTrigger',
            'OnKeyDownTrigger',
            'OnKeyUpTrigger'
        ],
        function(target, source, property) {
            _r.select(target).on(property, source[property]);
        });

    _r.override(
        ["diffuseFresnelParameters", "opacityFresnelParameters", "emissiveFresnelParameters", "refractionFresnelParameters", "reflectionFresnelParameters"],
        function(target, source, property) {
            var configuration = source[property];
            if(!target[property]) {
                target[property] = new BABYLON.FresnelParameters();
            }
            _r.extend(target[property], configuration);
        });

    _r.override(
        ["includedOnlyMeshes", "excludedMeshes" ],
        function(target, source, property) {
            if(_r.is.Array(source[property])) {
                target[property] = _r.select(source[property].join(',')).toArray();
            }
            else {
                if(_r.is.String(source[property])) {
                    target[property] = _r.select(source[property]).toArray();
                }
                else {
                    target[property] = eval(source[property]);
                }
            }
        })

    _r.override(
        ["LUT", "ColorCorrectionPostProcess" ],
        function(target, source, property) {
            if(target instanceof BABYLON.Camera) {
                new BABYLON.ColorCorrectionPostProcess("color_correction", source[property], 1.0,  target, null, _r.engine, true);
            }
            else {
                console.error("BABYLON.Runtime::" + property + " is only supported for BABYLON.Camera");
            }
        })

    /** Helpers **/
    // TODO
    // DEPRECATED : _r.to.Color(args)
    export function color(...parameters : any[]) {
        if(parameters.length == 1) {
            if(parameters[0] instanceof BABYLON.Color3){
                return parameters[0];
            }

            if(_r.is.HexColor(parameters[0])) {
                return BABYLON.Color3.FromHexString(parameters[0]);
            }

            if(parameters[0].hasOwnProperty("r") && parameters[0].hasOwnProperty("g") && parameters[0].hasOwnProperty("b")) {
                return new BABYLON.Color3(parameters[0]["r"], parameters[0]["g"], parameters[0]["b"]);
            }
            console.warn("_r.color::not a valid color", parameters[0]);


        }
        else {
            if(parameters.length == 3) {
                return new BABYLON.Color3(parameters[0], parameters[1], parameters[2]);
            }
            else {
                if(parameters.length == 4) {
                    return new BABYLON.Color4(parameters[0], parameters[1], parameters[2], parameters[3]);
                }
                else {
                    console.error('_r.color() cannot be parsed');
                    return BABYLON.Color3.Black();
                }
            }
        }
    }

    export function showDebug() {
        _r.scene.debugLayer.show();
    }

    export function hideDebug() {
        _r.scene.debugLayer.hide();
    }
}
