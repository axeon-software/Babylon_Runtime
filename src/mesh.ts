module _r.mesh {
    /** Box **/
    export interface IBox {
        name : string,
        size : number,
        updatable? : boolean,
        sideOrientation? : number | string
    };

    export function box(params : IBox) {
        if(params.sideOrientation && _r.is.String(params.sideOrientation)) {
            params.sideOrientation = BABYLON.Mesh[params.sideOrientation];
        }
        var _box = BABYLON.Mesh.CreateBox(params.name, params.size, _r.scene, params.updatable, <number> params.sideOrientation);
        return _r.merge(_box, params, ['name', 'size', 'updatable', 'sideOrientation'])
    };

    /** Sphere **/
    export interface ISphere {
        name : string,
        segments : number,
        diameter : number,
        updatable? : boolean,
        sideOrientation? : number | string
    };

    export function sphere(params : ISphere) : BABYLON.Mesh {
        if(params.sideOrientation && _r.is.String(params.sideOrientation)) {
           params.sideOrientation = BABYLON.Mesh[params.sideOrientation];
        }
        var _sphere = BABYLON.Mesh.CreateSphere(params.name, params.segments, params.diameter, _r.scene, params.updatable, <number> params.sideOrientation);
        return _r.merge(_sphere,params, ['name', 'segments', 'diameter', 'updatable', 'sideOrientation'])
    };

    /** Ground **/
    export interface IGround {
        name : string,
        width : number,
        height : number,
        subdivisions : number,
        updatable? : boolean,
    };

    export function ground(params : IGround) : BABYLON.Mesh {
        var _ground = BABYLON.Mesh.CreateGround(params.name, params.width, params.height, params.subdivisions, _r.scene, params.updatable);
        return _r.merge(_ground, params, ['name', 'width', 'height', 'subdivisions', 'updatable']);
    };

    _r.override(["mesh.ground"], function(target, source, property){
        return ground(source[property]);
    });

    /** Plane **/
    export interface IPlane {
        name : string,
        size : number,
        updatable? : boolean,
        sideOrientation? : number | string
    }

    export function plane(params : IPlane) : BABYLON.Mesh {
        if(params.sideOrientation && _r.is.String(params.sideOrientation)) {
            params.sideOrientation = BABYLON.Mesh[params.sideOrientation];
        }
        var _plane = BABYLON.Mesh.CreatePlane(params.name, params.size, _r.scene, params.updatable, <number> params.sideOrientation);
        return _r.merge(_plane, params, ['name', 'size', 'updatable', 'sideOrientation'])
    }
}
