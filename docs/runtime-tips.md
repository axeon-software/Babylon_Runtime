# Babylon Runtime Tips

### I see some strange numbers starting by "."

This is just a shortcut to write numbers between 1 and -1. Writing __-.5__ or __-0.5__ is the same.

### My parameter doesn't appear in BJS inspector !

Access it via browser console and __\_r()__ selector.

Examples:

  - type ``` _r("myMaterialName")[0] ``` and search for your param,
  - type:
    - ``` _r("myMaterialName")[0].emissiveFresnelParameters.bias ``` to have direct access to current value,
    - ``` _r("myMaterialName")[0].emissiveFresnelParameters.bias = 0.5 ``` to set custom value.

### I'm tired to write a line by color channel when using RGB type.

You can use __\_r.color()__ function ! It works for RGB, RGBA and HEX color type.

Examples:

```JSON
{
  "myMaterial":
  {
    "ambientColor": _r.color(1,.2,.3),
    "diffuseColor": _r.color(1,.2,.3,.5)
  }
}
```



### Some javascript code must be executed when scene loading is done.

__\_r.ready(function(){__ _[...]_ __}); __ is here for you. Juste put it after ``` _r.launch(); ``` .

Example:

```html
<script>
    _r.launch({ scene: "scene.babylon", activeCamera: "cameraFree.000" });
    _r.ready(function () {
    	alert("my javascript alert !");
    });
</script>
```

### I want to be sure I select only a precise type of element (mesh, light, camera, etc)

In your selector, use :mesh, :material, :light or :camera.

Examples:
> in patch file

```javascript
{
  /* this select only material named myName */
  "myName:material": { "param": "value" }
},
{
  /* this select only meshes named myName */
  "myName:mesh": { "param": "value" }
}
```
> in browser console
```javascript
/* this select only first material named myName */
_r("myName:material")[0].param = "value";
/* this select only first meshes named myName */
_r("myName:mesh")[0].param = "value";
```
