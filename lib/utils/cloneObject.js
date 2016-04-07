'use strict';

const isObject = require('./isObject');

module.exports = function cloneObject(val) {
  if (isObject(val)) {
    let Ctor = val.constructor;
    let obj = new Ctor();
    for (let key in val) {
      obj[key] = val[key];
    }
    return val;
  } else {
    return val;
  }
};
