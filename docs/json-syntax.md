# Some rules about JSON syntax



If you don't know anything about JSON, don't be scared. It may seem rough at first glance, but it's not :)



All you have to know is that JSON is an open-standard data file format, and that there is some rules about writing data:

  - all your patches must be contained between two square brackets __[ ]__
  - to access an element (object, material, etc), you have to hold it between two braces __{ }__ and write inside the element name enclosed by quotes __" "__,
  - once you have select an element, you want to highlight some of its properties. So after _"elementName"_, add a colon and two braces __: { }__, and write inside the property name enclosed by quotes __" "__:

```javascript
[
  {
    "myElementToTweak":
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
    "myElementToTweak":
    {
      "myPropertyToTweak": "myValue",
      "myOtherPropertyToTweak": "myValue2",
      "myAnotherPropertyToTweak": "myValue3" /* no comma here */
    }
  }
]
```
  - same if multiple elements. Notice that comma is between elements, so last property of first element doesn't have to end by comma:

```javascript
[
  {
    "myElementToTweak":
    {
      "myPropertyToTweak": "myValue",
      "myOtherPropertyToTweak": "myValue2" /* no comma here */
    } /* nope, no comma here neither */
  }, /* here it is ! */
  {
    "myOtherElementToTweak":
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
  "myElementToTweak":
  {
    "myPropertyToTweak": "myStringValue",
    "myOtherPropertyToNumberTweak": 42,
    "myAnotherPropertyToBooleanTweak": true
  }
}
```
  - level up: suppose a property is composed of properties, like a color containing red, green & blue channels. Too easy, same rules:

```javascript
[
  {
    "myElementToTweak":
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
    "myOtherElement":
    {
      "myPropertyToTweak": 1
    }
  }
]
```
  - if a property appears multiple times, it is the last which is taken into account:
```javascript
[
  {
    "myElementToTweak":
    {
      "myPropertyToTweak": 1, /* this is finally ignored... */
      "myPropertyToTweak": 42, /* ...'cause of this line */
      "coolThing": "#ffffff" /* this is finally ignored... */
    }
  },
  {
    "myElementToTweak":
    {
      "coolThing": "#000000" /* ...'cause of this line */
    }
  }
]
```


To resume, a patch is just a file containing a list, which can be represented by this scheme:

- first level, an array: 
  __[ , , , ]__

- second level, an array with things: 
  __[ { "element" } , { "element" }  ]__

- third level, an array with things which have properties: 
  __[ { "element": { "property":"value" } } , { "element": { "property":"value",  "property":"value" } }  ]__




Depends of your text editor, but surely their is an option or plugin: 

-   to help format JSON data (e.g. for notepad++ : [JSToolNpp](http://www.sunjw.us/jstoolnpp/)),
-   to open/closed quotes automatically (e.g. in notepad++ : settings > autocompletion).



Bad pratice but pratical: comments are in theory not allowed in JSON!
But if you work in team this may be helpful anyway, so close our eyes and help your teammates anyway...



Hooray, you're now a JSON master \o/ ! You can go back to [tutorials](tutorials.html).