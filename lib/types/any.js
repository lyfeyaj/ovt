'use strict';

const utils = require('../utils');
const addChainableMethod = utils.addChainableMethod;
const Schema = require('../schema');

function AnyType() {
  Schema.call(this);

  this._type = 'any';
}

utils.inherits(AnyType, Schema);

let proto = AnyType.prototype;

proto.convert = function(val) { return val; };

addChainableMethod(proto, 'required', function(val) {
  return !utils.isUndefined(val);
}, function() {
  let obj = this.clone();
  delete obj._methods.optional;
  delete obj._methods.forbidden;
  return obj;
});

addChainableMethod(proto, 'optional', utils.noop, function() {
  let obj = this.clone();
  delete obj._methods.required;
  delete obj._methods.forbidden;
  return obj;
});

addChainableMethod(proto, 'forbidden', function(val) {
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

addChainableMethod(proto, 'valid', validateWhitelist);
addChainableMethod(proto, 'only', validateWhitelist);
addChainableMethod(proto, 'whitelist', validateWhitelist);
addChainableMethod(proto, 'oneOf', validateWhitelist);

const validateEqual = function(value, other) {
  return value === other || (value !== value && other !== other);
};

addChainableMethod(proto, 'equals', validateEqual);
addChainableMethod(proto, 'eq', validateEqual);
addChainableMethod(proto, 'equal', validateEqual);

const validateInvalid = function() {
  return !validateWhitelist.apply(this, arguments);
};

addChainableMethod(proto, 'invalid', validateInvalid);
addChainableMethod(proto, 'not', validateInvalid);
addChainableMethod(proto, 'disallow', validateInvalid);
addChainableMethod(proto, 'blacklist', validateInvalid);

module.exports = AnyType;
