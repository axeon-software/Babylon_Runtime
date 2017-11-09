module _r.renderloop {

    function loop() {
        scene.render();
    }

    export function run() {
        _r.scene.executeWhenReady(function() {
            engine.runRenderLoop(loop);
        });
    }

    export function stop() {
        engine.stopRenderLoop(loop);
    }
}




