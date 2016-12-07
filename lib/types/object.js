'use strict';

const magico = require('magico');
const AnyType = require('./any');
const Errors = require('../errors');
const utils = require('../utils');

const ArrayType = require('./array');

class ObjectType extends AnyType {
  constructor() {
    super();

    this._type = 'object';
    this._defaultValidator = 'isObject';

    this._inner.renames = {};
    this._inner.children = {};
  }

  initialize(schemas) {
    let self = super.initialize();
    return self._addSchemas(schemas);
  }

  convert(val) {
    return utils.isObject(val) ? val : new Object(val);
  }

  _addSchemas(schemas) {
    schemas = schemas || {};

    utils.assert(utils.isObject(schemas) && !schemas.isOvt, `${utils.obj2Str(schemas)} is invalid`);

    for (let name in schemas) {
      let schema = schemas[name] || {};
      this._addSchema(name, schema);
    }

    this._methods.__inners_flag__ = true;

    return this;
  }

  _addSchema(name, schema) {
    utils.assert(utils.isString(name), `${utils.obj2Str(name)} is not a valid key`);

    // check default types
    if (schema.isOvt) {
      this._inner.children[name] = schema;
    }

    // check array type
    else if (utils.isArray(schema)) {
      let arraySchema = new ArrayType();
      arraySchema = arraySchema.initialize.apply(arraySchema, schema);
      this._inner.children[name] = arraySchema;
    }

    // check plain object type
    else if (utils.isObject(schema)) {
      let objectSchema = new ObjectType();
      objectSchema = objectSchema.initialize(schema);
      this._inner.children[name] = objectSchema;
    } else {
      utils.assert(false, `${utils.obj2Str(schema)} is not a valid schema`);
    }

    this._methods.__inners_flag__ = true;

    return this;
  }

  _validateInner(obj, state, options) {
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
      let currentPath = utils.buildPath(state.path, state.key);
      let res = type._validate(val, {
        value: obj,

        // changed state
        path: currentPath,
        key: name,
        hasErrors: isErrored()
      }, options);

      magico.set(obj, name, res.value);
      errors = errors.concat(res.errors);
    }

    return handleResult();
  }
}

const chainable = utils.chainable(ObjectType.prototype);

chainable('isObject', { method: utils.isObject });

chainable('add', {
  chainingBehaviour: function(name, schema) {
    return this._addSchema(name, schema);
  }
});

chainable('keys', {
  chainingBehaviour: function(schemas) {
    return this._addSchemas(schemas);
  }
});

chainable('rename', {
  chainingBehaviour: function(oldName, newName) {
    if (utils.isString(newName)) {
      utils.assert(utils.isString(oldName), `${utils.obj2Str(oldName)} is not a valid string`);
    }
    if (utils.isString(oldName)) {
      this._inner.renames[oldName] = newName;
    } else {
      if (utils.isObject(oldName)) {
        this._inner.renames = Object.assign(this._inner.renames, oldName);
      }
    }
    return this;
  }
});

module.exports = ObjectType;
