'use strict';

const _ = require('lodash');
const inherits = require('util').inherits;
const utils = require('../utils');
const AnyType = require('./any');

function NumberType() {
  AnyType.call(this);

  this._type = 'number';
}

inherits(NumberType, AnyType);

let proto = NumberType.prototype;

proto.convert = function(val) {
  return _.isNumber(val) ? val : _.toNumber(val);
};

utils.addChainableMethod(proto, 'isNumber', function(val) {
  return _.isNumber(val);
});

// Sanitizers from `lodash`
[
  'add',
  'ceil',
  'floor',
  'round',
  'subtract',
  'clamp',
  'random'
].forEach(function(name) {
  utils.addChainableMethod(proto, name, function() {
    return _[name].apply(_, arguments);
  }, { type: 'sanitizer' });
});

// Validators from `lodash`
[
  'inRange',
  'isInteger',
  'gt',
  'gte',
  'lt',
  'lte'
].forEach(function(name) {
  utils.addChainableMethod(proto, name, function() {
    return _[name].apply(_, arguments);
  });
});

module.exports = NumberType;
