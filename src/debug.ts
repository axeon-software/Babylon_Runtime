module _r.debug {
    export var mode = "DEBUG";

    export function log(...options : any[]) {
        if(mode == "DEBUG" || mode == "PROD") {
            console.log.call(options);
        }
    }

    export function info(...options : any[]) {
        if(mode == "DEBUG" || mode == "PROD") {
            console.info.call(options);
        }
    }

    export function warn(...options : any[]) {
        if(mode == "DEBUG" || mode == "PROD") {
            console.warn.call(options);
        }
    }

    export function error(...options : any[]) {
        if(mode == "DEBUG" || mode == "PROD") {
            console.error.call(options);
        }
    }

    export function showDebug() {
        _r.scene.debugLayer.show();
    }

    export function hideDebug() {
        _r.scene.debugLayer.hide();
    }
}
