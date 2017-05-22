module _r.is {
    export function Function(functionToCheck) : boolean {
        var getType = {};
        return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
    }

    export function Number(n) : boolean {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    export function PlainObject(n) : boolean {
        // Basic check for Type object that's not null
        if (typeof n == 'object' && n !== null) {
            // If Object.getPrototypeOf supported, use it
            if (typeof Object.getPrototypeOf == 'function') {
                var proto = Object.getPrototypeOf(n);
                return proto === Object.prototype || proto === null;
            }
            // Otherwise, use internal class
            // This should be reliable as if getPrototypeOf not supported, is pre-ES5
            return Object.prototype.toString.call(n) == '[object Object]';
        }
        // Not an object
        return false;
    }

    export function Array(x : any) : boolean {
        return window['Array'].isArray(x);
    }

    export function Mesh(x : any) : boolean{
        return x instanceof BABYLON.AbstractMesh;
    }

    export function Vector3(x : any) : boolean {
        return x instanceof BABYLON.Vector3;
    }

    export function Vector2(x : any) : boolean{
        return x instanceof BABYLON.Vector2;
    }

    export function Color(x : any) : boolean {
        return HexColor(x) || x instanceof BABYLON.Color3 || x instanceof BABYLON.Color4;
    }

    export function HexColor(x : any) : boolean{
        return String(x) && x[0] == '#';
    }

    export function Float(n : any) : boolean{
        return Number(n) === n && n % 1 !== 0;
    }

    export function Int(n : any) : boolean{
        return Number(n) === n && n % 1 === 0;
    }

    export function Quaternion(n : any) : boolean{
        return n instanceof BABYLON.Quaternion;
    }

    export function Matrix(n : any) : boolean{
        return n instanceof  BABYLON.Matrix;
    }

    export function String(x : any) : boolean{
        return typeof x === "string"
    }

    export function Material(x : any) : boolean{
        return x instanceof BABYLON.Material;
    }

    export function Texture(x : any) : boolean{
        return x instanceof BABYLON.Texture;
    }

    export function PatchFile(expr : string) {
        if(typeof expr !== 'string') {
            return false;
        }
        var split = expr.split('.');
        var extension = split[split.length - 1].trim();
        return extension == 'runtime' || extension == 'patch' || extension == 'js';
    }
}
