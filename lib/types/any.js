'use strict';

const _ = require('lodash');
const utils = require('../utils');
const util = require('util');
const Schema = require('../schema');

function AnyType() {
  Schema.call(this);

  this._type = 'any';
}

util.inherits(AnyType, Schema);

let proto = AnyType.prototype;

utils.addChainableMethod(proto, 'required', function(val) {
  return !_.isUndefined(val);
});

utils.addChainableMethod(proto, 'optional', function() {});

utils.addChainableMethod(proto, 'forbidden', function(val) {
  return _.isUndefined(val);
});

const validateEqual = function() {
  return _.eq.apply(_, arguments);
};

utils.addChainableMethod(proto, 'valid', validateEqual);
utils.addChainableMethod(proto, 'equals', validateEqual);
utils.addChainableMethod(proto, 'eq', validateEqual);
utils.addChainableMethod(proto, 'equal', validateEqual);
utils.addChainableMethod(proto, 'only', validateEqual);

const validateNotEqual = function() {
  return !_.eq.apply(_, arguments);
};

utils.addChainableMethod(proto, 'invalid', validateNotEqual);
utils.addChainableMethod(proto, 'not', validateNotEqual);
utils.addChainableMethod(proto, 'disallow', validateNotEqual);

const validateOneOf = function(val, array) {
  array = array || [];
  array = _.isArray(array) ? array : [array];
  return array.indexOf(val) > -1;
};

utils.addChainableMethod(proto, 'oneOf', validateOneOf);

module.exports = AnyType;
