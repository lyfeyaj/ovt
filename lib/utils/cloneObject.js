'use strict';

const isObject = require('./isObject');
const isArray = require('./isArray');
const cloneArray = require('./cloneArray');

module.exports = function cloneObject(val) {
  if (isObject(val)) {
    let Ctor = val.constructor || Object;
    let obj = new Ctor();
    for (let key in val) {
      if (isArray(val[key])) {
        obj[key] = cloneArray(val[key]);
      } else {
        obj[key] = val[key];
      }
    }
    return obj;
  } else {
    return val;
  }
};
