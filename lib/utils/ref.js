'use strict';

module.exports = function ref(key) {
  return { __key: key, __isRef: true };
};
