module _r.renderloop {

    function loop() {
        scene.render();
    }

    export function run() {
        engine.runRenderLoop(loop);
    }

    export function stop() {
        engine.stopRenderLoop(loop);
    }
}




