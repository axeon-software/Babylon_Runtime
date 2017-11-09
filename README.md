# _r
**\_r** is a lightweight, "write less, do more", [BabylonJS library](https://www.babylonjs.com/). The purpose of **\_r** is to make it much easier to use and maintain in the 3D workflow.

**\_r** takes a lot of common tasks that require many lines of JavaScript code to accomplish, and wraps them into methods that you can call with a single line of code. **\_r** also simplifies a lot of the 'complicated' things from BabylonJS.


* Visit  the [Home Page](https://axeon-software.github.io/babylon-runtime/)
* [Download the latest version]()
* Documentation :
    * [3D Designer](https://axeon-software.github.io/babylon-runtime/)
    * [3D Scripter](https://axeon-software.github.io/babylon-runtime/)
    * [3D Developper](https://axeon-software.github.io/babylon-runtime/)
    
## A brief look

### For 3D Designers - No more developpers

From a 3D designers point of view there are always a lot of parameters -  colors, channels intensities, reflection, refraction, etc - which needs to be customised by code. 
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
[read more about patches](https://axeon-software.github.io/babylon-runtime/).

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

**\_r** has a lot of other usefull features for scripters, [read more about scripting](https://axeon-software.github.io/babylon-runtime/).

### For 3D Developpers

Developpers can create plugins and new patch's directives for 3D designers and scripters.

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
Then scripter can use :
```js
_r("mesh1, mesh2").hostpotPlugin("yo");
_r("mesh3").hotspotPlugin("yeah");
```

#### Directive 

We can then make this plugin available in patch  :
```js
_r.override( ["hotspotPlugin"],
    function(target, source, property) {
        var message = source[property];
        _r(target).hotspotPlugin(message);
 });
```
So designers can use :
```json
 [
    {
        "mesh1, mesh2":
        {
            "hotspotPlugin": "yo"
        }
    },
    {
        "mesh3":
        {
            "hotspotPlugin": "yeah"
        }
    }
]
```
[read more about plugins & directives](https://axeon-software.github.io/babylon-runtime/)