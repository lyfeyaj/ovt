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

  this._inner.inclusions = [];
  this._inner.requireds = [];
  this._inner.ordereds = [];
  this._inner.exclusions = [];
}

inherits(ArrayType, AnyType);

let proto = ArrayType.prototype;

proto.convert = function(val) {
  return _.isArray(val) ? val : _.toArray(val);
};

proto._validateInner = function(val, state, options) {
  options = options || {};
  let errors = state.errors;
  let value = val;

  let canAbortEarly = function() {
    return options.abortEarly && errors && errors.any();
  };

  let handleResult = function() {
    return { errors: errors && errors.any() ? errors : null, value };
  };

  if (canAbortEarly()) return handleResult();

  errors = new Errors();

  let exclusions = this._inner.exclusions.slice();
  let requireds = this._inner.requireds.slice();
  let inclusions = this._inner.inclusions.slice().concat(requireds);
  let ordereds = this._inner.ordereds.slice();

  value = _.map(value, function(item, ii) {

    if (canAbortEarly()) return item;

    // Validate exclusions
    _.each(exclusions, function(exclusion) {
      let res = exclusion._validate(item, { path: ii, errors }, options);
      if (!res.errors) {
        errors.add('array.forbidden');
      }
    });

    // Validate ordereds
    let ordered = ordereds[ii];
    if (ordered) {
      let res = ordered._validate(item, { path: ii, errors }, options);
      item = res.value;
      errors.concat(res.errors);
    }

    // Validate requireds
    _.some(requireds.slice(), function(required, ri) {
      let res = required._validate(item, { path: ii, errors }, options);
      if (!res.errors) {
        item = res.value;
        requireds.splice(ri, 1);
        return true;
      }
    });

    // Validate inclusions
    let isIncluded = null;
    _.some(inclusions, function(inclusion) {
      if (isIncluded) return true;
      let res = inclusion._validate(item, { path: ii, errors }, options);

      if (!res.errors) {
        isIncluded = res;
      }
    });
    if (isIncluded) {
      item = isIncluded.value;
      errors.concat(isIncluded.errors);
    } else {
      errors.add('array.inclusions');
    }

    return item;
  });

  if (requireds.length) {
    errors.add('array.required');
  }

  return handleResult();
};

utils.addChainableMethod(proto, 'isArray', function(val) {
  return _.isArray(val);
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
