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

const chainable = utils.chainable(AnyType.prototype, 'any');

chainable('required', {
  method: function(val) {
    let schema = this.schema._emptySchema;
    let isEmpty = utils.isUndefined(val);

    if (isEmpty) return !isEmpty;

    if (schema && schema.isOvt) {
      let res = schema.validate(val, { abortEarly: true });
      isEmpty = isEmpty || !res.errors;
    } else if (!utils.isUndefined(schema)) {
      isEmpty = isEmpty || val === schema;
    }

    return !isEmpty;
  },
  chainingBehaviour: function() {
    delete this._methods.optional;
    delete this._methods.forbidden;
    return this;
  }
});

chainable('optional', {
  chainingBehaviour: function() {
    delete this._methods.required;
    delete this._methods.forbidden;
    return this;
  }
});

chainable('forbidden', {
  method: function(val) {
    return utils.isUndefined(val);
  },
  chainingBehaviour: function() {
    delete this._methods.required;
    delete this._methods.optional;
    return this;
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
