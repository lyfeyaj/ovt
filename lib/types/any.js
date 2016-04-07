'use strict';

const utils = require('../utils');
const Schema = require('../schema');

function AnyType() {
  Schema.call(this);

  this._type = 'any';
}

utils.inherits(AnyType, Schema);

let proto = AnyType.prototype;

proto.convert = function(val) { return val; };

utils.addChainableMethod(proto, 'required', function(val) {
  return !utils.isUndefined(val);
}, function() {
  let obj = this.clone();
  delete obj._methods.optional;
  delete obj._methods.forbidden;
  return obj;
});

utils.addChainableMethod(proto, 'optional', utils.noop, function() {
  let obj = this.clone();
  delete obj._methods.required;
  delete obj._methods.forbidden;
  return obj;
});

utils.addChainableMethod(proto, 'forbidden', function(val) {
  return utils.isUndefined(val);
}, function() {
  let obj = this.clone();
  delete obj._methods.required;
  delete obj._methods.optional;
  return obj;
});

const validateWhitelist = function() {
  let args = utils.cloneArray(arguments);
  let val = args.shift();
  args = utils.parseArg(args);
  return !!~args.indexOf(val);
};

utils.addChainableMethod(proto, 'valid', validateWhitelist);
utils.addChainableMethod(proto, 'only', validateWhitelist);
utils.addChainableMethod(proto, 'whitelist', validateWhitelist);
utils.addChainableMethod(proto, 'oneOf', validateWhitelist);

const validateEqual = function(value, other) {
  return value === other || (value !== value && other !== other);
};

utils.addChainableMethod(proto, 'equals', validateEqual);
utils.addChainableMethod(proto, 'eq', validateEqual);
utils.addChainableMethod(proto, 'equal', validateEqual);

const validateNotEqual = function(value, other) {
  return !validateEqual(value, other);
};

utils.addChainableMethod(proto, 'invalid', validateNotEqual);
utils.addChainableMethod(proto, 'not', validateNotEqual);
utils.addChainableMethod(proto, 'disallow', validateNotEqual);
utils.addChainableMethod(proto, 'blacklist', validateNotEqual);

module.exports = AnyType;
