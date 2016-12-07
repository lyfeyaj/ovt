'use strict';

const AnyType = require('./any');
const Errors = require('../errors');
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

  _validateInner(val, state, options) {
    options = options || {};
    let errors = new Errors();
    let value = val.slice();
    let self = this;

    let isErrored = function() {
      return state.hasErrors || errors.any();
    };

    let canAbortEarly = function() {
      return options.abortEarly && isErrored();
    };

    let handleResult = function() {
      return { errors: errors.any() ? errors : null, value };
    };

    if (canAbortEarly()) return handleResult();

    let stateBuilder = function() {
      return {
        key: state.key,
        value: state.value,
        path: state.path,

        // changed state
        hasErrors: isErrored()
      };
    };

    let exclusions = self._inner.exclusions;
    let requireds = utils.cloneArray(self._inner.requireds);
    let inclusions = utils.cloneArray(self._inner.inclusions).concat(requireds);
    let ordereds = self._inner.ordereds;
    let orderedExclusions = self._inner.orderedExclusions;

    let parentPath = utils.buildPath(state.path, state.key);

    value = (value || []).map(function(item, vi) {

      if (canAbortEarly()) return item;

      let currentPath = utils.buildPath(parentPath, vi);

      // Validate exclusions
      for (let ei = 0; ei < exclusions.length; ei++) {
        if (canAbortEarly()) break;

        let exclusion = exclusions[ei];

        let res = exclusion._validate(item, stateBuilder(), options);

        if (!res.errors) {
          errors.add(
            utils.buildPath(currentPath, 'forbidden'),
            utils.t('array.forbidden') || new Error('Forbidden value can\'t be included')
          );
        }
      }

      if (canAbortEarly()) return item;

      // Validate ordereds
      let ordered = ordereds[vi];
      if (ordered) {
        let res = ordered._validate(item, stateBuilder(), options);
        item = res.value;
        errors = errors.concat(res.errors);
      }

      // Validate exclusion with orders
      let orderedExclusion = orderedExclusions[vi];
      if (orderedExclusion) {
        let res = orderedExclusion._validate(item, stateBuilder(), options);

        if (!res.errors) {
          errors.add(
            utils.buildPath(currentPath, 'forbidden'),
            utils.t('array.forbidden') || new Error('Forbidden value can\'t be included')
          );
        }
      }

      if (canAbortEarly()) return item;

      // Validate requireds
      let matchRequiredIndex = null;
      for (let ri = 0; ri < requireds.length; ri++) {
        let required = requireds[ri];
        let res = required._validate(item, stateBuilder(), options);
        if (res.errors) continue;
        item = res.value;
        matchRequiredIndex = ri;
        break;
      }
      if (matchRequiredIndex !== null) requireds.splice(matchRequiredIndex, 1);

      if (canAbortEarly()) return item;

      // Validate inclusions
      let isIncluded = null;
      for (let ii = 0; ii < inclusions.length; ii++) {
        if (canAbortEarly()) break;
        if (isIncluded) break;

        let inclusion = inclusions[ii];
        let res = inclusion._validate(item, stateBuilder(), options);

        if (!res.errors) {
          isIncluded = res;
        }
      }

      if (isIncluded) {
        item = isIncluded.value;
      } else {
        if (inclusions.length) {
          errors.add(
            utils.buildPath(parentPath, 'inclusions'),
            utils.t('array.inclusions') || new Error('No valid schema matches')
          );
        }
      }

      return item;
    });

    if (canAbortEarly()) return handleResult();

    if (requireds.length) {
      let preferedLength = self._inner.requireds.length;
      let currentLength = preferedLength - requireds.length;
      errors.add(
        utils.buildPath(parentPath, 'requireds'),
        utils.t('array.forbidden', { currentLength, preferedLength }) || new Error(`${preferedLength} elements are required, now is ${currentLength}`)
      );
    }

    if (canAbortEarly()) return handleResult();

    // validate additional ordereds
    if (ordereds.length > value.length) {
      for (let oi = value.length; oi < ordereds.length; oi++) {
        let ordered = ordereds[oi];
        if (ordered) {
          let res = ordered._validate(undefined, stateBuilder(), options);
          errors = errors.concat(res.errors);
        }
      }
    }

    return handleResult();
  }
}


const chainable = utils.chainable(ArrayType.prototype);

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

chainable('isLength', {
  method: function(val, length) {
    return val.length === length;
  }
});

chainable('maxLength', {
  method: function(val, maxLength) {
    return val.length <= maxLength;
  }
});

chainable('minLength', {
  method: function(val, minLength) {
    return val.length >= minLength;
  }
});

module.exports = ArrayType;
