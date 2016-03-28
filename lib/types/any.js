'use strict';

const _ = require('lodash');
const inherits = require('util').inherits;
const utils = require('../utils');
const Schema = require('../schema');

function AnyType() {
  Schema.call(this);

  this._type = 'any';
}

inherits(AnyType, Schema);

let proto = AnyType.prototype;

utils.addChainableMethod(proto, 'isAny', function() {});

utils.addChainableMethod(proto, 'required', function(val) {
  return !_.isUndefined(val);
}, function() {
  delete this._methods.optional;
});

utils.addChainableMethod(proto, 'optional', function() {}, function() {
  delete this._methods.required;
});

utils.addChainableMethod(proto, 'forbidden', function(val) {
  return _.isUndefined(val);
});

const validateWhitelist = function() {
  let args = Array.from(arguments);
  let val = args.unshift();
  args = utils.parseArg(args);
  return _.includes(args, val);
};

utils.addChainableMethod(proto, 'valid', validateWhitelist);
utils.addChainableMethod(proto, 'only', validateWhitelist);
utils.addChainableMethod(proto, 'whitelist', validateWhitelist);

const validateEqual = function() {
  return _.eq.apply(_, arguments);
};

utils.addChainableMethod(proto, 'equals', validateEqual);
utils.addChainableMethod(proto, 'eq', validateEqual);
utils.addChainableMethod(proto, 'equal', validateEqual);

const validateNotEqual = function() {
  return !_.eq.apply(_, arguments);
};

utils.addChainableMethod(proto, 'invalid', validateNotEqual);
utils.addChainableMethod(proto, 'not', validateNotEqual);
utils.addChainableMethod(proto, 'disallow', validateNotEqual);
utils.addChainableMethod(proto, 'blacklist', validateNotEqual);

const validateOneOf = function(val, array) {
  array = array || [];
  array = _.isArray(array) ? array : [array];
  return array.indexOf(val) > -1;
};

utils.addChainableMethod(proto, 'oneOf', validateOneOf);

module.exports = AnyType;
