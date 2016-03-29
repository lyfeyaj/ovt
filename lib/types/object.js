'use strict';

const _ = require('lodash');
const inherits = require('util').inherits;
const utils = require('../utils');
const AnyType = require('./any');

function ObjectType() {
  AnyType.call(this);

  this._type = 'object';
}

inherits(ObjectType, AnyType);

let proto = ObjectType.prototype;

utils.addChainableMethod(proto, 'isObject', function(val) {
  return _.isObject(val);
});

// Sanitizers from `lodash`
[
  // Collection sanitizers
  'countBy',
  'each',
  'forEach',
  'eachRight',
  'forEachRight',
  'every',
  'filter',
  'find',
  'findLast',
  'flatMap',
  'forEach',
  'forEachRight',
  'groupBy',
  'includes',
  'invokeMap',
  'keyBy',
  'map',
  'orderBy',
  'partition',
  'reduce',
  'reduceRight',
  'reject',
  'sample',
  'sampleSize',
  'shuffle',
  'size',
  'some',
  'sortBy'
].forEach(function(name) {
  utils.addChainableMethod(proto, name, function() {
    return _[name].apply(_, arguments);
  }, { type: 'sanitizer' });
});

module.exports = ObjectType;
