module _r.light {
    export interface IHemisphericLight {
        name : string,
        direction? : any
    };

    export function hemispheric(params : IHemisphericLight) : BABYLON.HemisphericLight {
        if(params.direction) {
            params.direction = _r.to.Vector3(params.direction);
        }
        else {
            params.direction = new BABYLON.Vector3(0, 0, 0);
        }

        var _light = new BABYLON.HemisphericLight(params.name, params.direction, _r.scene);
        return _r.merge(_light, params, ['name', 'direction']);
    };

    export interface IPointLight {
        name : string,
        direction? : any,
        diffuse? : any,
        specular? : any
    }

    export function point(params : IPointLight) : BABYLON.PointLight {
        if(params.direction) {
            params.direction = _r.to.Vector3(params.direction);
        }
        else {
            params.direction = new BABYLON.Vector3(0, 0, 0);
        }

        var _light = new BABYLON.PointLight(params.name, params.direction, _r.scene);
        return _r.merge(_light, params, ['name', 'direction']);
    }

    export interface IDirectionalLight {
        name : string,
        direction? : any,
        diffuse? : any,
        specular? : any
    }

    export function directional(params : IDirectionalLight) : BABYLON.DirectionalLight {
        if(params.direction) {
            params.direction = _r.to.Vector3(params.direction);
        }
        else {
            params.direction = new BABYLON.Vector3(0, 0, 0);
        }

        var _light = new BABYLON.DirectionalLight(params.name, params.direction, _r.scene);
        return _r.merge(_light, params, ['name', 'direction']);
    }
}
