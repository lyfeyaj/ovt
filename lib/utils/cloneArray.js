'use strict';

module.exports = function cloneArray(array) {
  array = array || [];
  let newArray = new Array(array.length);
  let i = array.length;
  while(i--) { newArray[i] = array[i]; }
  return newArray;
};
