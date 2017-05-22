module _r {
    export function assignMaterial(...args : any[]) {
        var meshes,
            subMaterial,
            material
        if(args.length == 3) {
            meshes = _r.select(args[0]);
            subMaterial = args[1];
            material = _r.select(args[2])[0];
        }
        else {
            if(args.length == 2) {
                meshes = _r.select(args[0]);
                material = _r.select(args[1])[0];
            }
            else {
                console.error("_r.assignMaterial::wrong number of parameters");
                return;
            }
        }
        if(subMaterial != undefined) {
            meshes.each(function(mesh) {
                mesh.material.subMaterials[subMaterial] = material;
            });

        }
        else {
            meshes.each(function(mesh) {
                mesh.material = material;
            });
        }
    }
}

module _r.material {
    export interface IStandardMaterial {
        name : string
    }

    export function standard(params : IStandardMaterial) : BABYLON.StandardMaterial {
        var _material = new BABYLON.StandardMaterial(params.name, _r.scene);
        return _r.merge(_material, params, ['name']);
    }

    _r.override(['material.standard'], function(target, source, property) {
        return standard(source[property]);
    });
}
