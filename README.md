ovt
===

Object schema description language and validator for JavaScript objects.


# Introduction

Imagine you run facebook and you want visitors to sign up on the website with real names and not something like `l337_p@nda` in the first name field. How would you define the limitations of what can be inputted and validate it against the set rules?

This is ovt, ovt allows you to create *blueprints* or *schemas* for JavaScript objects (an object that stores information) to ensure *validation* of key information.


# Example

```javascript
var Ovt = require('ovt');

var schema = Ovt.object.keys({
    username: Ovt.string.isLength(3, 30).required,
    password: Ovt.string.matches(/^[a-zA-Z0-9]{3,30}$/),
    access_token: [Ovt.string, Ovt.number],
    birthyear: Ovt.number.isInteger.gt(1900).lt(2013),
    email: Ovt.string.isEmail
});

Ovt.validate({ username: 'abc', birthyear: 1994 }, schema, function (err, value) { });  // err === null -> valid
```
