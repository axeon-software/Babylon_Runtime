module _r {
    /** Helpers **/
    export function color(...parameters : any[]) {
        if(parameters.length == 1) {
            return BABYLON.Color3.FromHexString(parameters[0]);
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

    _r.override(["scene"], function(target, source, property) {
        _r.extend(_r.scene, source[property]);
    });

    /**
    _r.override(["texture"], function(params){
        return _r.texture.base(params);
    });

    _r.override(["cubeTexture"], function(params) {
        return _r.texture.cube(params);
    });

    _r.override(['videoTexture'], function(params) {
        return _r.texture.video(params);
    });

    _r.override(["reflectionProbe"], function(params) {
        return _r.reflectionProbe.create(params);
    });
     **/

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
}
