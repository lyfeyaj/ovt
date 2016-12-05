'use strict';

const utils = require('../utils');
const Schema = require('../schema');

function AnyType() {
  Schema.call(this);

  this._type = 'any';
}

utils.inherits(AnyType, Schema);

const proto = AnyType.prototype;
const chainable = utils.chainable(proto);

proto.convert = function(val) { return val; };

chainable('required', {
  method: function(val) {
    return !utils.isUndefined(val);
  },
  chainableBehaviour: function() {
    let obj = this.clone();
    delete obj._methods.optional;
    delete obj._methods.forbidden;
    return obj;
  }
});

chainable('optional', {
  method: utils.noop,
  chainableBehaviour: function() {
    let obj = this.clone();
    delete obj._methods.required;
    delete obj._methods.forbidden;
    return obj;
  },
  onlyChainable: true
});

chainable('forbidden', {
  method: function(val) {
    return utils.isUndefined(val);
  },
  chainableBehaviour: function() {
    let obj = this.clone();
    delete obj._methods.required;
    delete obj._methods.optional;
    return obj;
  }
});

const validateWhitelist = function() {
  let args = utils.cloneArray(arguments);
  let val = args.shift();
  args = utils.parseArg(args);
  return !!~args.indexOf(val);
};

chainable('valid', { method: validateWhitelist });
chainable('only', { method: validateWhitelist });
chainable('whitelist', { method: validateWhitelist });
chainable('oneOf', { method: validateWhitelist });

const validateEqual = function(value, other) {
  return value === other || (value !== value && other !== other);
};

chainable('equals', { method: validateEqual });
chainable('eq', { method: validateEqual });
chainable('equal', { method: validateEqual });

const validateInvalid = function() {
  return !validateWhitelist.apply(this, arguments);
};

chainable('invalid', { method: validateInvalid });
chainable('not', { method: validateInvalid });
chainable('disallow', { method: validateInvalid });
chainable('blacklist', { method: validateInvalid });

module.exports = AnyType;
