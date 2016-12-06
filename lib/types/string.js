'use strict';

const utils = require('../utils');
const AnyType = require('./any');

class StringType extends AnyType {
  constructor() {
    super();

    this._type = 'string';
    this._defaultValidator = 'isString';
  }

  convert(val) {
    return utils.isString(val) ? val : String(val);
  }
}

const chainable = utils.chainable(StringType.prototype);

chainable('required', {
  method: function(val) {
    return !(val == null || val == '');
  },
  chainingBehaviour: function() {
    let obj = this.clone();
    delete obj._methods.optional;
    delete obj._methods.forbidden;
    return obj;
  }
});

chainable('isString', { method: utils.isString });

module.exports = StringType;
