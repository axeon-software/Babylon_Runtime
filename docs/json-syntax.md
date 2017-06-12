# Some rules about JSON syntax

All you have to know is that JSON is an open-standard data file format, and that there is some rules about writing data:

  - to access an object, you have to hold it between two braces __{ }__ and write inside the object name enclosed by quotes __" "__,
  - once you have select an object, you want to highlight some of its parameters. So after _"objectName"_, add a colon and two braces __: { }__, and write inside the parameter name enclosed by quotes __" "__:

```javascript
{
  "myObjectToTweak":
  {
    "myParamToTweak": "myValue"
  }
}
```
  - if you have multiple params, they must end with a comma but not the last:

```javascript
{
  "myObjectToTweak":
  {
    "myParamToTweak": "myValue",
    "myOtherParamToTweak": "myValue2",
    "myAnotherParamToTweak": "myValue3" /* no comma here */
  }
}
```
  - same if multiple objects. Notice that comma is between objects, so last parameter of first object doesn't have to end by comma:

```javascript
{
  "myObjectToTweak":
  {
    "myParamToTweak": "myValue",
    "myOtherParamToTweak": "myValue2" /* no comma here */
  } /* nope, no comma here neither */
}, /* here it is ! */
{
  "myOtherObjectToTweak":
  {
    "myParamToTweak": "myValue",
    "myOtherParamToTweak": "myValue2"
  }
}
```
  - parameters value not have to be bound to quotes if they're number or boolean values ; other must be quoted:

```javascript
{
  "myObjectToTweak":
  {
    "myParamToTweak": "myStringValue",
    "myOtherParamToNumberTweak": 42,
    "myAnotherParamToBooleanTweak": false
  }
}
```
  - level up: suppose a param is composed of params, like a color in red, green & blue. Too easy, same rules:

```javascript
{
  "myObjectToTweak":
  {
    "myOvercomplicatedColor":
    {
      "r": 0.123,
      "g": 0.666,
      "b": 1 /* that's right, no comma */
    }, /* don't forget this one */
    "myEasyParam":true,
    "myOtherParam": "#FF8EF0"
  }
},
{
  "myOtherObject":
  {
    "myParamToTweak": 1
  }
}
```
  - if a param appears multiple time, it is the last which is taken into account:
```javascript
{
  "myObjectToTweak":
  {
    "myParamToTweak": 1, /* this is finally ignored... */
    "myParamToTweak": 42, /* ...'cause of this line */
    "coolThing": "#ffffff" /* this is finally ignored... */
  }
},
{
  "myObjectToTweak":
  {
    "coolThing": "#000000" /* ...'cause of this line */
  }
}
```

Depends of your text editor, but surely their is an option or plugin: 

-   to help format JSON data (e.g. for notepad++ : [JSToolNpp](http://www.sunjw.us/jstoolnpp/)),
-   to open/closed quotes automatically (e.g. in notepad++ : settings > autocompletion).



Bad pratice but pratical: comments are in theory __not allowed in JSON!__ But if you work in team this may be helpful anyway, so close our eyes...



Hooray, you're now a JSON master !