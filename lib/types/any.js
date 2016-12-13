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

module.exports = AnyType;

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

const AlternativesType = require('./alternatives');
chainable('when', {
  // Check and parse ref and condition
  parseArgs: function(ref, condition) {
    condition = condition || {};

    utils.assert(
      condition.then || condition.otherwise ,
      'one of condition.then or condition.otherwise must be existed'
    );
    utils.assert(
      !condition.then || (condition.then && condition.then.isOvt),
      'condition.then must be a valid ovt schema'
    );
    utils.assert(
      !condition.otherwise || (condition.otherwise && condition.otherwise.isOvt),
      'condition.otherwise must be a valid ovt schema'
    );

    if (utils.isString(ref)) ref = utils.ref(ref);

    utils.assert(utils.isRef(ref), 'ref must be a valid string or ref object');

    return [ref, condition];
  },

  method: function(val, refValue, condition) {
    condition = condition || {};
    let res = {};
    let is = condition.is;
    let then = condition.then;
    let otherwise = condition.otherwise;

    let matched = false;
    if (is && is.isOvt) {
      matched = is.validate(refValue, this.options, this.state);
      matched = !matched.errors;
    } else {
      matched = is === refValue;
    }

    if (matched) {
      if (then && then.isOvt) res = then.validate(val, this.options, this.state);
    } else {
      if (otherwise && otherwise.isOvt) res = otherwise.validate(val, this.options);
    }

    return res.errors ? new Error('validation failed') : res.value;
  },

  // Convert type into alternatives
  chainingBehaviour: function() {
    let self = (new AlternativesType()).initialize(this);
    return self;
  },

  type: 'sanitizer'
});
