'use strict';

const AnyType = require('./any');
const utils = require('../utils');

class AlternativesType extends AnyType {
  constructor() {
    super();

    this._type = 'alternatives';
  }

  initialize() {
    let self = super.initialize();
    return self.try.apply(self, arguments);
  }
}

const chainable = utils.chainable(AlternativesType.prototype, 'alternatives');

chainable('try', {
  method: function() {
    let args = utils.cloneArray(arguments);
    let val = args.shift();

    // parse args to support [[schema1, schema2]] syntax
    args = utils.parseArg(args);

    let errors;
    let value;

    // Loop all schemas
    // If any one is matched without errors, then return value
    // If no one is matched, then return errors of the last result
    for (let i = 0; i < args.length; i++) {
      let schema = args[i];
      let res = schema.validate(val, this.options);
      errors = res.errors;
      if (!errors) {
        value = res.value;
        break;
      }
    }

    return errors ? errors : value;
  },

  // Using chainingBehaviour to check whether schemas are valid
  chainingBehaviour: function() {
    let schemas = utils.parseArg(arguments);
    schemas.forEach(function(schema) {
      utils.assert(schema.isOvt, `${utils.obj2Str(schema)} is not a valid ovt schema`);
    });
  },
  type: 'sanitizer'
});

module.exports = AlternativesType;
