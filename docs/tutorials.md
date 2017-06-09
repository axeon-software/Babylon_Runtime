# Tutorials

## Basics

We assume that you know how to export a .babylon file from your 3D modeler, and that this .babylon contain at least one camera, one light and one object. For testing locally your scene, you have to launch a local web server (EasyPhp or Wamp can help).

Our babylon example file is in _babylon-runtime\docs\assets_ folder, and blender file in _babylon-runtime\docs\assets-sources_.

### index.html

To load and init a very basic scene, you have to tell to babylon :

- where is the babylon file,
- which camera will be used at launch.

So let's go, here our html file :

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>_r.launch</title>
	<script src="http://preview.babylonjs.com/babylon.js"></script>
	<script src="../../assets/js/babylon-runtime.js"></script> 
</head>
<body>
<script>
    _r.launch({
        scene : "scene.babylon",
        assets : "../../assets/",
        activeCamera : "cameraFree.000"
    })
</script>
</body>
</html>
```
[launch demo scene](demos/launch)

As you can see, babylon-runtime (we will name it _\_r_ later) just need 3 parameters to launch a babylon file :
- the .babylon file name,
- where is the .babylon file,
- which camera at launch.

Once our scene is loaded, we probably want to tweak scene parameters, such as ambientColor. So we have to tell to \_r some actions in a _ready_ function :

```javascript
    _r.launch({
        scene : "scene.babylon",
        assets : "../../assets/",
        activeCamera : "cameraFree.000"
    });
    _r.ready(function(){
        _r.scene.ambientColor = new BABYLON.Color3.FromHexString('#ffffff');
        /*  or if you prefer RGB syntax :
            _r.scene.ambientColor = new BABYLON.Color3(1,1,1);
        */
        _r.scene.clearColor = new BABYLON.Color3.FromHexString('#9CC1CE');
    });
```

Don't be scary, it's indeed javascript here, 'cause _scene_ is a special case. Later, for classic things like materials, cameras & others, we'll stay in JSON syntax which keep it simple.

So, in this new line, we select scene by writing _\_r.scene_, and we access to some of its color setup.

![launch-options01](tutorials-assets/launch-options01.jpg)



### Let's do some patches

Now we have our scene, we want setup things inside.

#### We want a patch

To start, we will configure where our camera spawn. We have to add a patch parameter in _\_r.launch_ function, and tell it that we want access to our camera :

```javascript
    _r.launch({
        scene : "scene.babylon",
        assets : "../../assets/",
        activeCamera : "cameraFree.000",        
        patch : [
          {
              "cameraFree.000":
              {

              }
          }
        ]
    });
```

#### JSON syntax

Explanation about [JSON](https://en.wikipedia.org/wiki/JSON) syntax must be made, you'll find a [dedicated page here](json-syntax.html).

#### Get ant tweak params

So, in our babylon app, we quickly realize that our camera speed is a way too high. We know thanks to [BJS doc](http://doc.babylonjs.com/classes/2.5/targetcamera#speed-number) that our cam have a speed parameter. But what is the current value ? Two solutions :
  - ask to \_r
  - get it via BJS inspector (since BJS 3.0)

##### get values via \_r

```javascript
_r("cameraFree.000")
```

##### get values via BJS inspector

## Advanced
