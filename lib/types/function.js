'use strict';

const AnyType = require('./any');
const utils = require('../utils');

class FunctionType extends AnyType {
  constructor() {
    super();

    this._type = 'function';
    this._defaultValidator = 'isFunction';
  }

  convert(val) {
    return utils.isFunction(val) ? val : new Function(val);
  }
}

const chainable = utils.chainable(FunctionType.prototype);

chainable('isFunction', { method: utils.isFunction });

chainable('arity', {
  method: function(length) {
    return length === (arguments.length - 1);
  }
});

chainable('minArity', {
  method: function(length) {
    return length >= (arguments.length - 1);
  }
});

chainable('maxArity', {
  method: function(length) {
    return length <= (arguments.length - 1);
  }
});

module.exports = FunctionType;
