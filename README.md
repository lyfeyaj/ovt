Ovt (Object validation tool)
===

[![Build Status](https://travis-ci.org/lyfeyaj/ovt.svg?branch=master)](https://travis-ci.org/lyfeyaj/ovt)

Object schema description language and validator for JavaScript.

# Introduction

Imagine you run facebook and you want visitors to sign up on the website with real names and not something like `l337_p@nda` in the first name field. How would you define the limitations of what can be inputted and validate it against the set rules?

This is ovt, ovt allows you to create *blueprints* or *schemas* for JavaScript objects (an object that stores information) to ensure *validation* of key information.

# Example

```javascript
const ovt = require('ovt');

const schema = ovt.object().keys({
    username: ovt.string().isLength(3, 30).required(),
    password: ovt.string().matches(/^[a-zA-Z0-9]{3,30}$/),
    access_token: ovt.array().items(ovt.string(), ovt.number()),
    birthyear: ovt.number().isInteger().gt(1900).lt(2013),
    email: ovt.string().isEmail(),
    login: ovt.alternatives().required().try(
      ovt.string().isEmail(),
      ovt.string().isMobilePhone('zh-CN')
    )
});

ovt.validate({
  username: 'abc',
  birthyear: 1994
}, schema, function (err, value) {
  // err === null -> valid
});
```

# Plugins

+ [ovt-plugin-lodash](https://github.com/lyfeyaj/ovt-plugin-lodash)
+ [ovt-plugin-validator](https://github.com/lyfeyaj/ovt-plugin-validator)
+ [ovt-plugin-xss](https://github.com/lyfeyaj/ovt-plugin-xss)
+ [ovt-plugin-baiji](https://github.com/lyfeyaj/ovt-plugin-baiji)
