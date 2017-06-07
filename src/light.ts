module _r.light {
    export interface IHemisphericLight {
        name : string,
        direction : any
    };

    export function hemispheric(params : IHemisphericLight) : BABYLON.HemisphericLight {

        if(params.direction) {
            if(!_r.is.Vector3(params.direction)) {
                params.direction = new BABYLON.Vector3(
                    params.direction['x'] ? params.direction['x'] : 0,
                    params.direction['y'] ? params.direction['y'] : 0,
                    params.direction['z'] ? params.direction['z'] : 0);
            }
        }
        else {
            params.direction = new BABYLON.Vector3(0, 0, 0);
        }

        var _light = new BABYLON.HemisphericLight(params.name, params.direction, _r.scene);
        return _r.merge(_light, params, ['name', 'direction']);
    };

    _r.override(['light.hemispheric'], function(target, source, property){
        return hemispheric(source[property]);
    });
}
