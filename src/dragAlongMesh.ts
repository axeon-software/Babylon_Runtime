module _r.dragdrop {
     class DragDrop {
        currentMesh : BABYLON.AbstractMesh;
        startingPoint : BABYLON.Vector3;

        constructor(public target : BABYLON.AbstractMesh, public ground : BABYLON.AbstractMesh) {
            var scene = this.ground.getScene();
            var canvas = scene.getEngine().getRenderingCanvas();

            var self = this;
            var pointerdown = function(evt) {
                self.onPointerDown.call(self, evt);
            };
            var pointerup = function(evt) {
                self.onPointerUp.call(self, evt);
            };
            var pointermove = function(evt) {
                self.onPointerMove.call(self, evt);
            };
            canvas.addEventListener("pointerdown",pointerdown, false);
            canvas.addEventListener("pointerup",pointerup , false);
            canvas.addEventListener("pointermove",pointermove , false);

            scene.onDispose = function () {
                canvas.removeEventListener("pointerdown",pointerdown);
                canvas.removeEventListener("pointerup", pointerup);
                canvas.removeEventListener("pointermove", pointermove);
            }
        }

        getGroundPosition(evt) {
            var scene = this.ground.getScene();
            var ground = this.ground;
            var pickinfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) { return mesh == ground; });
            if (pickinfo.hit) {
                return pickinfo.pickedPoint;
            }

            return null;
        }

        onPointerDown(evt) {
            if (evt.button !== 0) {
                return;
            }
            var scene = this.ground.getScene();
            // check if we are under a mesh
            var ground = this.ground;
            var self = this;
            var pickInfo = scene.pick(scene.pointerX,
                scene.pointerY,
                function (mesh) {
                    return self.target == mesh;
                });
            if (pickInfo.hit) {
                this.currentMesh = pickInfo.pickedMesh;
                this.startingPoint = this.getGroundPosition(evt);

                if (this.startingPoint) { // we need to disconnect camera from canvas
                    setTimeout(function () {
                        scene.activeCamera.detachControl(scene.getEngine().getRenderingCanvas());
                    }, 0);
                }
            }
        }

        onPointerUp() {
            var scene = this.ground.getScene();
            if (this.startingPoint) {
                scene.activeCamera.attachControl(scene.getEngine().getRenderingCanvas());
                this.startingPoint = null;
                return;
            }
        }

        onPointerMove(evt) {
            if (!this.startingPoint) {
                return;
            }

            var current = this.getGroundPosition(evt);

            if (!current) {
                return;
            }

            var diff = current.subtract(this.startingPoint);
            this.currentMesh.position.addInPlace(diff);

            this.startingPoint = current;
        }
    }

    _r.override(
        ["dragAlongMesh"],
        function(target, source, property) {
            new DragDrop(_r.select(target)[0], _r.select(source[property])[0]);
        })
}
