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
  let obj = this.clone();
  delete obj._methods.optional;
  delete obj._methods.forbidden;
  return obj;
});

utils.addChainableMethod(proto, 'optional', function() {}, function() {
  let obj = this.clone();
  delete obj._methods.required;
  delete obj._methods.forbidden;
  return obj;
});

utils.addChainableMethod(proto, 'forbidden', function(val) {
  return _.isUndefined(val);
}, function() {
  let obj = this.clone();
  delete obj._methods.required;
  delete obj._methods.optional;
  return obj;
});

const validateWhitelist = function() {
  let args = Array.from(arguments);
  let val = args.shift();
  args = utils.parseArg(args);
  return _.includes(args, val);
};

utils.addChainableMethod(proto, 'valid', validateWhitelist);
utils.addChainableMethod(proto, 'only', validateWhitelist);
utils.addChainableMethod(proto, 'whitelist', validateWhitelist);
utils.addChainableMethod(proto, 'oneOf', validateWhitelist);

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

module.exports = AnyType;
