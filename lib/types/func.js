'use strict';

const ObjectType = require('./object');
const utils = require('../utils');

class FuncType extends ObjectType {
  constructor() {
    super();

    this._type = 'func';
    this._defaultValidator = 'isFunction';
  }

  convert(val) {
    return utils.isFunction(val) ? val : new Function(val);
  }
}

const chainable = utils.chainable(FuncType.prototype);

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

module.exports = FuncType;
