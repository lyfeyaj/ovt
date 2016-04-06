'use strict';

const _ = require('lodash');
const inherits = require('util').inherits;
const assert = require('assert');
const utils = require('../utils');
const AnyType = require('./any');
const Errors = require('../errors');

function ArrayType() {
  AnyType.call(this);

  this._type = 'array';
  this._defaultValidator = 'isArray';

  this._inner.inclusions = [];
  this._inner.requireds = [];
  this._inner.ordereds = [];
  this._inner.exclusions = [];
}

inherits(ArrayType, AnyType);

let proto = ArrayType.prototype;

proto.convert = function(val) {
  return _.castArray(val);
};

proto._validateInner = function(val, state, options) {
  options = options || {};
  let errors = new Errors();
  let value = _.clone(val);
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
      // original state
      key: state.key,
      original: state.original,
      parentObj: state.parentObj,
      parentType: state.parentType,
      parentPath: state.parentPath,

      // changed state
      hasErrors: isErrored()
    };
  };

  let exclusions = self._inner.exclusions;
  let requireds = utils.cloneArray(self._inner.requireds);
  let inclusions = utils.cloneArray(self._inner.inclusions).concat(requireds);
  let ordereds = self._inner.ordereds;

  let parentPath = utils.buildPath(state);

  value = _.map(value, function(item, vi) {

    if (canAbortEarly()) return item;

    let currentPath = utils.buildPath({
      parentType: state.parentType,
      parentPath: parentPath,
      key: vi
    });

    // Validate exclusions
    for (let ei = 0; ei < exclusions.length; ei++) {
      if (canAbortEarly()) break;

      let exclusion = exclusions[ei];

      let res = exclusion._validate(item, stateBuilder(), options);

      if (!res.errors) {
        errors.add(utils.buildPath({
          parentPath: currentPath,
          parentType: self._type,
          key: 'forbidden'
        }), new Error('Forbidden value can\'t be included'));
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
      errors = errors.concat(isIncluded.errors);
    } else {
      errors.add(utils.buildPath({
        parentPath: currentPath,
        parentType: self._type,
        key: 'inclusions'
      }), new Error('No valid schema matches'));
    }

    return item;
  });

  if (requireds.length) {
    let preferedLength = self._inner.requireds.length;
    errors.add(utils.buildPath({
      parentPath,
      parentType: self._type,
      key: 'requireds'
    }), new Error(`${preferedLength} elements are required, now is ${ preferedLength - requireds.length }`));
  }

  return handleResult();
};

utils.addChainableMethod(proto, 'isArray', function(val) {
  return Array.isArray(val);
});

utils.addChainableMethod(proto, 'ordered', _.noop, function() {
  let obj = this.clone();

  let types = utils.parseArg(arguments);

  _.each(types, function(type) {
    assert(type.isOvt, `${utils.obj2Str(type)} is not a valid ovt schema`);

    obj._inner.ordereds.push(type);
  });

  obj._methods.__validateInnerFlag__ = true;

  return obj;
}, {
  onlyChainable: true,
  avoidNoArgCall: true
});

const addElements = function() {
  let obj = this.clone();

  let types = utils.parseArg(arguments);

  _.each(types, function(type) {
    assert(type.isOvt, `${utils.obj2Str(type)} is not a valid ovt schema`);

    if ('required' in type._methods) {
      obj._inner.requireds.push(type);
    } else if ('forbidden' in type._methods) {
      obj._inner.exclusions.push(type.optional());
    } else {
      obj._inner.inclusions.push(type);
    }
  });

  obj._methods.__validateInnerFlag__ = true;

  return obj;
};

utils.addChainableMethod(proto, 'elements', _.noop, addElements, {
  onlyChainable: true,
  avoidNoArgCall: true
});
utils.addChainableMethod(proto, 'items', _.noop, addElements, {
  onlyChainable: true,
  avoidNoArgCall: true
});

const validateUnique = function(val) {
  let newVal = _.uniq(val);
  return newVal.length === val.length;
};

utils.addChainableMethod(proto, 'isUnique', validateUnique);

utils.addChainableMethod(proto, 'length', function(val, length) {
  return val.length === length;
});

utils.addChainableMethod(proto, 'maxLength', function(val, maxLength) {
  return val.length <= maxLength;
});

utils.addChainableMethod(proto, 'minLength', function(val, minLength) {
  return val.length >= minLength;
});

// Sanitizers from `lodash`
[
  // Array specific sanitizers
  'chunk',
  'compact',
  'concat',
  'difference',
  'differenceBy',
  'differenceWith',
  'drop',
  'dropRight',
  'dropRightWhile',
  'dropWhile',
  'fill',
  'findIndex',
  'findLastIndex',
  'first',
  'flatten',
  'flattenDeep',
  'flattenDepth',
  'fromPairs',
  'head',
  'indexOf',
  'initial',
  'intersection',
  'intersectionBy',
  'intersectionWith',
  'join',
  'last',
  'lastIndexOf',
  'pull',
  'pullAll',
  'pullAllBy',
  'pullAllWith',
  'pullAt',
  'remove',
  'reverse',
  'slice',
  'sortedIndex',
  'sortedIndexBy',
  'sortedIndexOf',
  'sortedLastIndex',
  'sortedLastIndexBy',
  'sortedLastIndexOf',
  'sortedUniq',
  'sortedUniqBy',
  'tail',
  'take',
  'takeRight',
  'takeRightWhile',
  'takeWhile',
  'union',
  'unionBy',
  'unionWith',
  'uniq',
  'uniqBy',
  'uniqWith',
  'unzip',
  'unzipWith',
  'without',
  'xor',
  'xorBy',
  'xorWith',
  'zip',
  'zipObject',
  'zipObjectDeep',
  'zipWith',

  // Collection sanitizers
  'countBy',
  'each',
  'forEach',
  'eachRight',
  'forEachRight',
  'every',
  'filter',
  'find',
  'findLast',
  'flatMap',
  'forEach',
  'forEachRight',
  'groupBy',
  'includes',
  'invokeMap',
  'keyBy',
  'map',
  'orderBy',
  'partition',
  'reduce',
  'reduceRight',
  'reject',
  'sample',
  'sampleSize',
  'shuffle',
  'size',
  'some',
  'sortBy',

  // Math sanitizers
  'max',
  'mean',
  'min',
  'sum'
].forEach(function(name) {
  utils.addChainableMethod(proto, name, function() {
    return _[name].apply(_, arguments);
  }, { type: 'sanitizer' });
});

module.exports = ArrayType;
