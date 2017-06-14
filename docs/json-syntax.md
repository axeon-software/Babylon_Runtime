# Some rules about JSON syntax

All you have to know is that JSON is an open-standard data file format, and that there is some rules about writing data:
  - all your patches must be contained between two square brackets __[ ]__
  - to access an object, you have to hold it between two braces __{ }__ and write inside the object name enclosed by quotes __" "__,
  - once you have select an object, you want to highlight some of its properties. So after _"objectName"_, add a colon and two braces __: { }__, and write inside the property name enclosed by quotes __" "__:

```javascript
[
  {
    "myObjectToTweak":
    {
      "myPropertyToTweak": "myValue"
    }
  }
]
```
  - if you have multiple properties, they must end with a comma but not the last:

```javascript
[
  {
    "myObjectToTweak":
    {
      "myPropertyToTweak": "myValue",
      "myOtherPropertyToTweak": "myValue2",
      "myAnotherPropertyToTweak": "myValue3" /* no comma here */
    }
  }
]
```
  - same if multiple objects. Notice that comma is between objects, so last property of first object doesn't have to end by comma:

```javascript
[
  {
    "myObjectToTweak":
    {
      "myPropertyToTweak": "myValue",
      "myOtherPropertyToTweak": "myValue2" /* no comma here */
    } /* nope, no comma here neither */
  }, /* here it is ! */
  {
    "myOtherObjectToTweak":
    {
      "myPropertyToTweak": "myValue",
      "myOtherPropertyToTweak": "myValue2"
    }
  }
]
```
  - properties value not have to be bound to quotes if they're number or boolean values ; other must be quoted:

```javascript
{
  "myObjectToTweak":
  {
    "myPropertyToTweak": "myStringValue",
    "myOtherPropertyToNumberTweak": 42,
    "myAnotherPropertyToBooleanTweak": false
  }
}
```
  - level up: suppose a property is composed of properties, like a color in red, green & blue. Too easy, same rules:

```javascript
[
  {
    "myObjectToTweak":
    {
      "myOvercomplicatedColor":
      {
        "r": 0.123,
        "g": 0.666,
        "b": 1 /* that's right, no comma */
      }, /* don't forget this one */
      "myEasyProperty":true,
      "myOtherProperty": "#FF8EF0"
    }
  },
  {
    "myOtherObject":
    {
      "myPropertyToTweak": 1
    }
  }
]
```
  - if a property appears multiple time, it is the last which is taken into account:
```javascript
[
  {
    "myObjectToTweak":
    {
      "myPropertyToTweak": 1, /* this is finally ignored... */
      "myPropertyToTweak": 42, /* ...'cause of this line */
      "coolThing": "#ffffff" /* this is finally ignored... */
    }
  },
  {
    "myObjectToTweak":
    {
      "coolThing": "#000000" /* ...'cause of this line */
    }
  }
]
```

To resume, a patch is just a list, which can be represented by this scheme:

__[ , , , ]__ : list.

__[ { "object": {  } } , { "object": {  } }  ]__ : elements in list.

__[ { "object": { "property":"value" } } , { "object": { "property":"value",  "property":"value" } }  ]__ : elements with properties in list.



Depends of your text editor, but surely their is an option or plugin: 

-   to help format JSON data (e.g. for notepad++ : [JSToolNpp](http://www.sunjw.us/jstoolnpp/)),
-   to open/closed quotes automatically (e.g. in notepad++ : settings > autocompletion).



Bad pratice but pratical: comments are in theory __not allowed in JSON!__ But if you work in team this may be helpful anyway, so close our eyes...



Hooray, you're now a JSON master !