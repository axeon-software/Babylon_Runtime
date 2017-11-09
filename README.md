# Code Less, Babylon More

## What is \_r ?

**\_r** is a lightweight, "write less, do more", BabylonJS library. The purpose of **\_r** is to make it much easier to use and maintain 3D real time's settings in the 3D workflow.

**\_r** takes a lot of common tasks that require many lines of JavaScript code to accomplish, and wraps them into methods that you can call with a single line of code. **\_r** also simplifies a lot of the 'complicated' things from BabylonJS in a production workflow.

## A brief look

### For 3D Designers - No more developpers

From a 3D designers point of view there are always a lot of parameters - like colors, channels intensities, reflection, refraction, etc - which needs to be customised by code. 
Code is great but it’s hard to understand and maintain for a 3D designers team (they always need developpers and some of them are...)

With **\_r** you can use patch file to customise the scene. Patch are very easy to read/write text files that don't required any programming skills.

```json
 [
    {
        "scene":
        {
            "ambientColor": "#ffffff",
            "clearColor": "#9CC1CE"
        }
    },
    {
        "cameraFree.000":
        {
            "speed": 0.05,
            "fov": 1.1,
            "position":
            {
                "x": 2.72,
                "z": -1.91
            },
            "rotation":
            {
                "x": 0.11,
                "y": -0.43
            }
        }
    }
]
```


### For 3D Scripters - Easy animations and events

**\_r** has been inspired by the jQuery API so scripting animations and managing events is very similar to jQuery :

```js
_r("sphere3").on("OnPickTrigger", function() {
    console.log("click on " + this.name)
});


_r("sphere1, sphere2").animate({
  position : { y : 3},
  rotation : { y : 1}
}, {
  duration : 2, 
  easing : 'easeOutSine', 
  loop : true 
});
```

**\_r** has a lot of usefull features for scripting  :
```js
_r("Camera1").on("activated", function() {
    _r("scene").trigger("cameraChanged")    
});

_r("scene").on("cameraChanged", {
   "mesh.gui.*" : { visible : true } 
});

_r.camera.goTo({ x : 0, y : 0, z : 0}).then(function() {
    _r.camera.activate("Camera1");
});
```
### For 3D Developpers

Developpers can create new directives and plugins from 3D designers and scripters just like a jQuery plugin. 

#### Directive 

This is how we implemented fresnelParameters in **\_r**
```js
 _r.override(
    ["diffuseFresnelParameters", "opacityFresnelParameters", "emissiveFresnelParameters", "refractionFresnelParameters", "reflectionFresnelParameters"],
    function(target, source, property) {
        var configuration = source[property];
        if(!target[property]) {
            target[property] = new BABYLON.FresnelParameters();
        }
        _r.extend(target[property], configuration);
 });
```
So designers now can use fresnel parameters in patches :
```json
{
    "material1" : {
        "useEmissiveAsIllumination": true,
        "emissiveFresnelParameters": {
            "leftColor": "#ffffff",
            "rightColor": "white",
            "power": 1,
            "bias": 0
        }
    }
}

```
#### Plugin
```js
_r.fn.hotspotPlugin = function(message) {
    return this.each(function(element) {
        _r(element).on('OnPickTrigger', function() {
            alert(message)
        })
    })
}
```
Then
```js
_r("mesh1, mesh2").hostpotPlugin("yo");
_r("mesh3").hotspotPlugin("yeah");
```
Make the plugin available in patch  :
```js
_r.override( ["hotspotPlugin"],
    function(target, source, property) {
        var message = source[property];
        _r(target).hotspotPlugin(message);
 });
```