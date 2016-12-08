'use strict';

const AnyType = require('./any');
const utils = require('../utils');

class ArrayType extends AnyType {
  constructor() {
    super();

    this._type = 'array';
    this._defaultValidator = 'isArray';

    this._inner.inclusions = [];
    this._inner.requireds = [];
    this._inner.ordereds = [];
    this._inner.orderedExclusions = [];
    this._inner.exclusions = [];
  }

  initialize() {
    let self = super.initialize();
    // Initialize items
    return self._addItems.apply(self, arguments);
  }

  convert(val) {
    return utils.castArray(val);
  }

  _addItems() {
    let schemas = utils.parseArg(arguments);
    let self = this;
    if (!schemas.length) return this;
    schemas.forEach(function(schema) {
      utils.assert(schema.isOvt, `${utils.obj2Str(schema)} is invalid`);

      if ('required' in schema._methods) {
        self._inner.requireds.push(schema);
      } else if ('forbidden' in schema._methods) {
        self._inner.exclusions.push(schema.optional());
      } else {
        self._inner.inclusions.push(schema);
      }
    });

    this._methods.__inners_flag__ = true;

    return this;
  }
}


const chainable = utils.chainable(ArrayType.prototype, 'array');

chainable('isArray', { method: utils.isArray });

chainable('ordered', {
  chainingBehaviour: function() {
    let schemas = utils.parseArg(arguments);
    let self = this;
    schemas.forEach(function(schema, i) {
      utils.assert(schema.isOvt, `${utils.obj2Str(schema)} is not a valid ovt schema`);
      if ('forbidden' in schema._methods) {
        self._inner.orderedExclusions[i] = schema.optional();
      } else {
        self._inner.ordereds[i] = schema;
      }
    });

    this._methods.__inners_flag__ = true;

    return this;
  }
});

chainable('elements', 'items', {
  chainingBehaviour: function addElements() {
    return this._addItems.apply(this, arguments);
  }
});

chainable('isLength', 'length', {
  method: function(val, length) {
    return val.length === length;
  }
});

chainable('maxLength', 'max', {
  method: function(val, maxLength) {
    return val.length <= maxLength;
  }
});

chainable('minLength', 'min', {
  method: function(val, minLength) {
    return val.length >= minLength;
  }
});

module.exports = ArrayType;
