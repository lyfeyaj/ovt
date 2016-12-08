'use strict';

const AnyType = require('./any');
const utils = require('../utils');

class AlternativeType extends AnyType {
  constructor() {
    super();

    this._type = 'alternative';
  }
}

const chainable = utils.chainable(AnyType.prototype, 'alternative');

chainable('try', {
  method: function() {
    let args = utils.parseArg(arguments);
    let val = args.shift();
    let matched;

    // Loop all schemas
    // If any one is matched without errors, then return value
    // If no one is matched, then return errors of the first result
    for (let i = 0; i < args.length; i++) {
      let schema = args[i];
      let res = schema.validate(val, this.options);
      if (!res.errors) {
        matched = res.value;
        break;
      }
    }

    return matched || new Error('validation failed');
  },
  type: 'sanitizer'
});

module.exports = AlternativeType;
