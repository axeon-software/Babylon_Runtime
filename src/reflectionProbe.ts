module _r.reflectionProbe {
    export interface IReflectionProbe {
        name : string;
        size : number;
        renderList? : string[];
        refreshRate? : string | number;
        attachToMesh? : string;
        position? : BABYLON.Vector3;
    }

    export function create(params : IReflectionProbe) {
        var probe = new BABYLON.ReflectionProbe("main", (params.size)?params.size:512, scene);
        if(params.renderList) {
            params.renderList.forEach(function(mesh) {
                probe.renderList.push(_r.select(mesh)[0]);
            });
        }
        else {
            var meshes = _r.select('*:mesh').toArray();
            meshes.forEach(function(mesh) {
                probe.renderList.push(mesh);
            });
        }
        if(params.refreshRate) {
            if(is.Number(params.refreshRate)) {
                probe.refreshRate = <number> params.refreshRate;
            }
            else {
                probe.refreshRate = BABYLON.RenderTargetTexture[params.refreshRate];
            }
        }
        if(params.attachToMesh) {
            probe.attachToMesh(_r.select(params.attachToMesh)[0]);
        }
        if(params.position) {
            probe.position = params.position;
        }
        var result = _r.merge(probe.cubeTexture, params, ["name", "size", "renderList", "refreshRate", "refreshRate", "attachToMesh", "position" ]);
        return result;
    }


}
