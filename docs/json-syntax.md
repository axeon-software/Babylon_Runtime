# Some rules about JSON syntax

All you have to know is that's an open-standard data file format, and some rules about writing data in JSON for babylon-runtime :

  - to access an object, you have to hold it between __{ }__ and write inside object name enclosed by __" "__,
  - once you have select an object, you want to highlight some of its parameters. So after _"objectName"_, add __: { }__, and write inside parameter name enclosed by __" "__ :

```javascript
{
  "myObjectToTweak":
  {
    "myParamToTweak" : "myValue"
  }
}
```
  - if you have multiple params, they must end with a comma but not the last :

```javascript
{
  "myObjectToTweak":
  {
    "myParamToTweak" : "myValue",
    "myOtherParamToTweak" : "myValue2",
    "myAnotherParamToTweak" : "myValue3" /* no comma here */
  }
}
```
  - same if multiple objects. Notice that comma is between objects, so last parameter of first object doesn't have to end by comma) :

```javascript
{
  "myObjectToTweak":
  {
    "myParamToTweak" : "myValue",
    "myOtherParamToTweak" : "myValue2" /* no comma here */
  } /* nope, no comma here neither */
}, /* here it is ! */
{
  "myOtherObjectToTweak":
  {
    "myParamToTweak" : "myValue",
    "myOtherParamToTweak" : "myValue2"
  }
}
```
  - parameters value not have to be bound to quotes if they're number or boolean values ; other must be quoted :

```javascript
{
  "myObjectToTweak":
  {
    "myParamToTweak" : "myStringValue",
    "myOtherParamToNumberTweak" : 42,
    "myAnotherParamToBooleanTweak" : false
  }
}
```
  - level up : suppose a param is composed of params, like a color in red, green & blue. Too easy, same rules :

```javascript
{
  "myObjectToTweak":
  {
    "myOvercomplicatedColor" :
    {
      "r": 0.123,
      "g": 0.666,
      "b": 1 /* that's right, no comma */
    }, /* don't forget this one */
    "myEasyParam" :true,
    "myOtherParam" : "#FF8EF0"
  }
},
{
  "myOtherObject":
  {
    "myParamToTweak" : 1
  }
}
```

Depends of your text editor, but surely their is an option or plugin : 

-   to help format JSON data (e.g. for notepad++ : [JSToolNpp](http://www.sunjw.us/jstoolnpp/)),
-   to open/closed quotes automatically (e.g. in notepad++ : settings > autocompletion).

You're now a JSON master.