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

const chainable = utils.chainable(FuncType.prototype, 'func');

chainable('isFunction', { method: utils.isFunction });

chainable('arity', {
  method: function(fn, limit) {
    return limit === fn.length;
  }
});

chainable('minArity', {
  method: function(fn, limit) {
    return fn.length >= limit;
  }
});

chainable('maxArity', {
  method: function(fn, limit) {
    return fn.length <= limit;
  }
});

module.exports = FuncType;
