# Babylon Runtime Tips

### My screen is white!!!

Check your browser console, you've probably forget a comma somewhere (browser generally tell you where).

### I see some strange numbers starting by a point`.`

This is just a shortcut to write numbers between 1 and -1.

Writing __-.5__ or __-0.5__ is the same.

### Some properties doesn't appear in BJS inspector!

Access it via browser console and `_r()` selector.

Examples:

  - type `_r("myMaterialName")[0]` and search for your property,
  - type:
    - `_r("myMaterialName")[0].emissiveFresnelParameters.bias` to have direct access to current value,
    - `_r("myMaterialName")[0].emissiveFresnelParameters.bias = 0.5` to set custom value.

### I'm tired to write a line by color channel when using RGB type.

You can use `_r.color()` function ! It works for RGB, RGBA and HEX color type.

Examples:

```JSON
{
  "myMaterial":
  {
    "ambientColor": _r.color(1,.2,.3),
    "diffuseColor": _r.color(1,.2,.3,.5),
    "emissiveColor": _r.color("#458721")
  }
}
```



### I have a debug camera, and want to switch to it via browser console

Juste type `_r.camera.activate("myCameraName")`.



### Some javascript code must be executed when scene loading is done.

`_r.ready(function(){ });` is here for you. Juste put it after `_r.launch();` .

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

In your selector, use `:mesh`, `:material`, `:light` or `:camera`.

Examples:
> in patch file

```javascript
{
  /* this select only material named myName */
  "myName:material": { "property": "value" }
},
{
  /* this select only meshes named myName */
  "myName:mesh": { "property": "value" }
}
```
> in browser console
```javascript
/* this select only first material named myName */
_r("myName:material")[0].property = "value";
/* this select only first meshes named myName */
_r("myName:mesh")[0].property = "value";
```

### I want to patch on the fly

You can use:
```javascript
_r.patch([{"*:material":{"ambientColor":"#ff0000"}}])
```
