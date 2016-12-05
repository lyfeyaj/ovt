'use strict';

const magico = require('magico');
const AnyType = require('./any');
const Errors = require('../errors');
const utils = require('../utils');

const ArrayType = require('./array');

function ObjectType() {
  AnyType.call(this);

  this._type = 'object';
  this._defaultValidator = 'isObject';

  this._inner.renames = {};
  this._inner.children = {};
}

utils.inherits(ObjectType, AnyType);

const proto = ObjectType.prototype;
const chainable = utils.chainable(proto);

proto.convert = function(val) {
  return utils.isObject(val) ? val : new Object(val);
};

proto._validateInner = function(obj, state, options) {
  options = options || {};
  let errors = new Errors();

  let isErrored = function() {
    return state.hasErrors || errors.any();
  };

  let canAbortEarly = function() {
    return options.abortEarly && isErrored();
  };

  let handleResult = function() {
    return { errors: errors.any() ? errors : null, value: obj };
  };

  if (canAbortEarly()) return handleResult();

  let children = this._inner.children;
  let renames = this._inner.renames;

  // Validate inners
  for (let name in children) {
    if (canAbortEarly()) break;

    let type = children[name];
    name = renames[name] ? renames[name] : name;

    let val = magico.get(obj, name);
    let currentPath = utils.buildPath(state);
    let res = type._validate(val, {
      // original state
      original: state.original,
      parentObj: obj,

      // changed state
      parentType: type._type,
      parentPath: currentPath,
      key: name,
      hasErrors: isErrored()
    }, options);

    magico.set(obj, name, res.value);
    errors = errors.concat(res.errors);
  }

  return handleResult();
};

chainable('isObject', {
  method: function(val) {
    return utils.isObject(val);
  }
});

chainable('add', {
  method: utils.noop,
  chainableBehaviour: function(name, schema) {
    utils.assert(utils.isString(name), `${utils.obj2Str(name)} is not a valid string`);
    utils.assert(schema.isOvt || utils.isObject(schema), `${utils.obj2Str(schema)} is not a valid object or schema`);

    let obj = this.clone();

    obj._inner.children[name] = schema;
    obj._methods.__validateInnerFlag__ = true;

    return obj;
  },
  onlyChainable: true
});

chainable('keys', {
  method: utils.noop,
  chainableBehaviour: function(schemas) {
    schemas = schemas || {};

    utils.assert(utils.isObject(schemas), `${utils.obj2Str(schemas)} is not a valid objecet`);
    utils.assert(!schemas.isOvt, `${utils.obj2Str(schemas)} can not be an ovt schema`);

    let obj = this.clone();

    for (let name in schemas) {
      let schema = schemas[name] || {};
      utils.assert(schema.isOvt, `${utils.obj2Str(schema)} can must be an ovt schema`);

      if (schema.isOvt) {
        obj._inner.children[name] = schema;
      }
      // check array type
      else if (utils.isArray(schema)) {
        let arraySchema = utils.applyType('array', ArrayType);
        arraySchema = arraySchema.items.apply(arraySchema, schema);
        obj._inner.children[name] = arraySchema;
      }
      // check plain object type
      else if (utils.isObject(schema)) {
        let objectSchema = utils.applyType('object', ObjectType);
        objectSchema = objectSchema.keys.apply(objectSchema, schema);
        obj._inner.children[name] = objectSchema;
      }
    }

    obj._methods.__validateInnerFlag__ = true;

    return obj;
  },
  onlyChainable: true
});

chainable('rename', {
  method: utils.noop,
  chainableBehaviour: function(oldName, newName) {
    let obj = this.clone();
    if (utils.isString(newName)) {
      utils.assert(utils.isString(oldName), `${utils.obj2Str(oldName)} is not a valid string`);
    }
    if (utils.isString(oldName)) {
      obj._inner.renames[oldName] = newName;
    } else {
      if (utils.isObject(oldName)) {
        obj._inner.renames = Object.assign(obj._inner.renames, oldName);
      }
    }
    return obj;
  },
  onlyChainable: true
});

module.exports = ObjectType;
