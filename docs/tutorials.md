# Tutorials

## Basics

We assume that you know how to export a .babylon file from your 3D modeler, and that this .babylon contain at least one camera, one light and one object. For testing locally your scene, you have to launch a local web server (e.g.: EasyPhp, Wamp, ...).

Our babylon example file is in _babylon-runtime\docs\assets_ folder, and blender file in _babylon-runtime\docs\assets-sources_.

### index.html

To load and init a very basic scene, you have to tell to babylon:

- where is the babylon file,
- which camera will be used at launch.

So let's go, here our html file:

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
        scene: "scene.babylon",
        assets: "../../assets/",
        activeCamera: "cameraFree.000"
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

Once our scene is loaded, we probably want to tweak scene parameters, such as ambientColor, so here comes patches !

### Let's do some patches

 We'll have our .babylon file, that could be update anytime during our 3D scene production.
 Patches will helps us to keep our scene modification even if we re-export our scene from our 3D modeler every 5 minutes.

 How to start patching ? Here an example:

```javascript
    _r.launch({
        scene: "scene.babylon",
        assets: "../../assets/",
        activeCamera: "cameraFree.000",
        patch:
    	[
    		{
    			"scene":
    			{
    				"ambientColor": "#ffffff",
    				"clearColor": "#9CC1CE"
    			}
    		}
    	]
    });
```

We've just tell to babylon runtime to patch our scene, and set its ambientColor to white & its clearColor to blue.

![_r launch option](tutorials-assets/launch-options01.jpg)

[launch demo scene](demos/launch/index2.html)

Hmm ok, but what is this weird way to arrange data?

#### Take a look to JSON syntax

Explanations about [JSON](https://en.wikipedia.org/wiki/JSON) syntax must be made, you'll find a [dedicated page here](json-syntax.html). 

Read it and come back, you'll be ready to patching your BJS scene in every direction.

#### How to get and tweak parameters

So, in our babylon app, we quickly realize that our camera speed is a way too high. We know thanks to [BJS doc](http://doc.babylonjs.com/classes/2.5/targetcamera#speed-number) that our cam have a speed parameter. But what is the current value ? Two solutions:
  - ask to \_r:
    - open your browser console (usually F12 key),
    - type ``` _r("cameraFree.000") ```,
      ![browser console example](tutorials-assets/browser-console01.jpg)
      - tip: notice that you receive a table, here with only one element. For direct access when you know there is only one object, you can type ``` _r("cameraFree.000")[0] ``` to go directly to the first object in this table,
    - you can know check the speed value,
    - to tweak it, just edit the number.
  - get it via BJS inspector (since BJS 3.0):
    - open your browser console (usually F12 key),
    - type ``` _r.showDebug(); ```,
    - go to Cameras tabs, select the desired camera and check its value,
    - to tweak it, just edit the number.

Now we enjoy our new speed value, we have to save it in patch.

We have to add a selector of our camera, including our custom speed value. By knowing JSON syntax, we have to integrate this piece of data in our index.html:

```JSON
{ "cameraFree.000": { "speed": 0.05 } }
```

Let's go!

```javascript
    _r.launch(
    {
    	scene: "scene.babylon",
    	assets: "../../assets/",
    	activeCamera: "cameraFree.000",
    	patch:
        [
            {
    			"scene":
    			{
    				"ambientColor": "#ffffff", /* comma */
    				"clearColor": "#9CC1CE" /* last param, so no comma */
    			}
    		}, /* don't forget this comma */
    		{
    			"cameraFree.000":
    			{
    				"speed": 0.05 /* only one param, no comma */
    			}
    		} /* no comma here 'cause it's the end of the last element */
    	]
    }
    );
```

Do you want also set camera FOV, position & rotation at spawn ? No problem:

```javascript
    _r.launch(
    {
    	scene: "scene.babylon",
    	assets: "../../assets/",
    	activeCamera: "cameraFree.000",
    	patch:
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
    }
    );
```
To get coordinates, you just had to move and orient your camera in BJS scene to the desired place, then type ``` _r("cameraFree.000")[0].position; ``` and ``` _r("cameraFree.000")[0].rotation; ```, and report values to the patch.

![check in console](tutorials-assets/check-in-console01.jpg)

[launch demo scene](demos/first-patches)

#### Starting to customize materials

In our demo scene, due to lightmap textures in ambientTexture channel, we want to control material color by ambientColor, and set diffuseColor to black by default (to reset its influence, and tweak it later if needed).

One way to do this is to apply a patch for each materials, one by one:

```javascript
{
  "scene.multiCube_01":
  {
    "diffuseColor": "#000000"
  }
},
{
  "scene.multiCube_02":
  {
    "diffuseColor": "#000000"
  }
},
[...]
```
But, you'll admit it, it's a little pain to select all materials like this ; obviously, there is an easy way.

By using star selector ``` * ``` , you can tell to \_r that you want select all elements. Here some usage examples, to try in the browser console:

  - ``` _r("*") ``` will return all elements of the current scene (objects, materials, lights, etc),
  - ``` _r("*:mesh") ``` wil return all objects,
  - ``` _r("*:material") ``` wil return all materials,
  - ``` _r("*Cube*") ``` will return all elements which contains _Cube_ in their names,
  - ``` _r("*01") ``` will return all elements where names end with _01_,
  - ``` _r("p*") ``` will return all elements where names start with _p_,
  - ``` _r("*Cube*01") ``` will return all elements which contains _Cube_ in their names and end with _01_.

Time to enhance our patch:

```javascript
    _r.launch(
    {
    	scene: "scene.babylon",
    	assets: "../../assets/",
    	activeCamera: "cameraFree.000",
    	patch: [
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
    		},
            {
                "*:material": /* select all materials in scene... */
                {
                    "diffuseColor": "#000000" /* ... and set diffuse color to black */ 
                }
            }
    	]
    }
    );
```
![all materials patched](tutorials-assets/all-materials-patched01.jpg)

[launch demo scene](demos/first-patches/index2.html)

You can know try to customize any material. Probably the easy way to access and tweak data is via BJS debug layer.
Here an quick example with the torrus:
![torrus patched](tutorials-assets/torrus-patched01.jpg)

```javascript
    _r.launch(
    {
    	scene: "scene.babylon",
    	assets: "../../assets/",
    	activeCamera: "cameraFree.000",
    	patch:
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
    		},
            {
                "*:material": /* select all materials in scene... */
                {
                    "diffuseColor": "#000000" /* ... and set diffuse color to black */ 
                }
            },
            {
                "scene.torrus_01":
                {
                    "diffuseColor":{"r": 0, "g": 0.3, "b": 0.8},
                    "ambientColor":{"r": 0.6, "g": 0.6, "b": 0.6},
                    "specularColor":{"r": 1, "g": 0.4, "b": 0.4},
                    "specularPower": 10
                }
            }
    	]
    }
    );
```
[launch demo scene](demos/first-patches/index3.html)

#### Some bits of organisation

Assume you have tons of materials, you're _index.html_ will be probably messy.
So, is there a way to confine patches to external files ? Yes.

Create a folder named as you want, near your _index.html_, then create one file named _cameras.patch_, another named _scene.patch_ and one more named _materials.patch_.

As you can guess, you can now cut & paste patch data from your _index.html_ to the right _.patch_ files ; and tell to \_r where are stored this patches.

Things to know:
- patch file must have _.patch_ extension,
- entire patch file content must be included in square brackets __[ ]__ (one patch file is a table).

> scene.patch

```javascript
[
	{
		"scene":
		{
			"ambientColor": "#ffffff",
			"clearColor": "#9CC1CE"
		}
	}
]
```

>   cameras.patch

```javascript
[
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

>   materials.patch

```javascript
[
	{
		"*:material":
		{
			"diffuseColor": "#000000"
		}
	},
	{
		"scene.torrus_01":
		{
			"diffuseColor":
			{
				"r": 0,
				"g": 0.3,
				"b": 0.8
			},
			"ambientColor":
			{
				"r": 0.6,
				"g": 0.6,
				"b": 0.6
			},
			"specularColor":
			{
				"r": 1,
				"g": 0.4,
				"b": 0.4
			},
			"specularPower": 10
		}
	}
]
```

> index.html

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>_r / patches</title>
	<script src="http://preview.babylonjs.com/babylon.js"></script>
	<script src="../../assets/js/babylon-runtime.js"></script> 
</head>
<body>
<script>
    _r.launch(
    {
    	scene: "scene.babylon",
    	assets: "../../assets/",
    	activeCamera: "cameraFree.000",
    	patch: 
    	[
    		"patches/scene.patch",
    		"patches/cameras.patch",
    		"patches/materials.patch"
    	]
    }
    );
</script>
</body>
</html>
```
[launch demo scene](demos/first-patches/index4.html)

This is clearer way to work isn't it ? You can create any files you want if you need, this can help for team work.

## Advanced

At this point, you may be interested by the [tips page](runtime-tips.html), take a look and come back.

### Advanced materials options

#### Fresnel

As we have seen when configuring colors, some parameters required other parameters in value.
_diffuseColor_ value can be set to an unique value in hexadecimal, but can also be composed of RGB color, having _R_, _G_ and _B_ channels to specify.

Fresnel is one of these multi-paramaters. [As seen in the BJS doc'](http://doc.babylonjs.com/classes/2.5/standardmaterial#diffusefresnelparameters-fresnelparameters-classes-2-5-fresnelparameters-), we have some types of fresnel.

To active one of these, just report it as shown below. Here an example with emissiveFresnelParameters:

```JSON
{
    "myMaterial":
    {
        "emissiveFresnelParameters":
        {
            "leftColor": "#ffffff",
            "rightColor": "#000000",
            "power": 1,
            "bias": 0
        }
    }
}
```
And a patch example in our demo scene:
```JSON
{
    "scene.strangeThing_porridge_01":
    {
        "diffuseColor": { "r": 0.1, "g": 0.1, "b": 0.1 },
        "ambientColor": { "r": 0.6, "g": 0.7, "b": 0.8 },
        "emissiveColor": { "r": 1, "g": 0.2, "b": 0 },
        "useEmissiveAsIllumination": true,
        "emissiveFresnelParameters":
        {
            "leftColor": "#ffffff",
            "rightColor": "#000000",
            "power": 1,
            "bias": 0
        },
        "specularColor": { "r": 0.5, "g": 0.1, "b": 0 },
        "specularPower": 7
    }
}
```
[launch demo scene](demos/advanced-materials-options/)


#### Texture creation

### Create user interactions

That's right, you can react to some user actions with patches !

Suppose we want a color modification when user click (or touch) on _\_r Code less, babylon more._ object.

Here we call __OnPickUpTrigger__ function. How to implement it ?

```javascript
{
    "myObject":
    {
        "OnPickUpTrigger": function ()
        {
            /* this is javascript */
            alert("alerts hurts.");
        }
    }
}
```
As you can see, here we have to work with javascript. But we can use \_r to easily access to objects. In our demo scene, let's create a file named _interactions.patch_ (don't forget to add it in index.html patch list).
Here our new file:
```javascript
[
	{
		"runtime.000:mesh":
		{
			"OnPickUpTrigger": function ()
			{
				/* this is javascript */
				_r("scene.runtime_02")[0].ambientColor = _r.color("#ff3300"); /* color need to be converted by _r.color function, 'cause we're in javascript and not JSON */
			}
		}
	}
]
```

Over-complicated code here, to alternate colors on click:

```javascript
[
	{
		"runtime.000:mesh":
		{
			"OnPickUpTrigger": function ()
			{
                var logoColor = _r("scene.runtime_02")[0].ambientColor;
                if(logoColor == "{R: 1 G:1 B:1}")
                    _r("scene.runtime_02")[0].ambientColor = _r.color("#ff3300");
                else
                    _r("scene.runtime_02")[0].ambientColor = _r.color("#ffffff");
			}
		}
	}
]
```
[launch demo scene](demos/user-interactions/)

### Import other .babylon in scene

For some reasons, we have separate our final scene into multiple babylon files. Obviously we want merge them. There is a runtime function for that, named __\_r.library.show()__.
As it is a javascript function, you can't include it on a patch. We'll use the __\_r.ready()__ function to call _library.show_.

### Animate things

### Use \_r and write my own javascript as well