'use strict';

const utils = require('../utils');
const Schema = require('../schema');

class AnyType extends Schema {
  constructor() {
    super();

    this._type = 'any';
  }

  convert(val) {
    return val;
  }
}

const chainable = utils.chainable(AnyType.prototype);

chainable('required', {
  method: function(val) {
    return !utils.isUndefined(val);
  },
  chainingBehaviour: function() {
    let obj = this.clone();
    delete obj._methods.optional;
    delete obj._methods.forbidden;
    return obj;
  }
});

chainable('optional', {
  chainingBehaviour: function() {
    let obj = this.clone();
    delete obj._methods.required;
    delete obj._methods.forbidden;
    return obj;
  }
});

chainable('forbidden', {
  method: function(val) {
    return utils.isUndefined(val);
  },
  chainingBehaviour: function() {
    let obj = this.clone();
    delete obj._methods.required;
    delete obj._methods.optional;
    return obj;
  }
});

function validateWhitelist() {
  let args = utils.cloneArray(arguments);
  let val = args.shift();
  args = utils.parseArg(args);
  return !!~args.indexOf(val);
}

chainable('valid', 'only', 'whitelist', 'oneOf', { method: validateWhitelist });

chainable('equals', 'eq', 'equal', {
  method: function validateEqual(value, other) {
    return value === other || (value !== value && other !== other);
  }
});

chainable('invalid', 'not', 'disallow', 'blacklist', {
  method: function validateInvalid() {
    return !validateWhitelist.apply(this, arguments);
  }
});

module.exports = AnyType;
