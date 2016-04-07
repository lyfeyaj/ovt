'use strict';

const assert = require('assert');
const utils = require('./utils');
const Errors = require('./errors');
const config = require('./config');

function Schema() {
  this._type = undefined;
  this._defaultValidator = undefined;
  this._defaultValue = undefined;
  this.isOvt = true;
  this._description = undefined;
  this._notes = [];
  this._tags = [];
  this._methods = {};
  this._inner = {
    inclusions: [],
    requireds: [],
    ordereds: [],
    exclusions: [],
    children: {},
    renames: {}
  };

  this._virtuals = {};
}

Schema.prototype.convert = function(val) { return val; };

Schema.prototype.clone = function() {
  const obj = Object.create(Object.getPrototypeOf(this));
  const self = this;

  obj._type = self._type;
  obj._defaultValidator = self._defaultValidator;
  obj._defaultValue = self._defaultValue;
  obj.isOvt = true;
  obj._methods = {};

  for (let methodName in self._methods) {
    obj._methods[methodName] = utils.cloneObject(self._methods[methodName]);
  }

  obj._description = self._description;
  obj._notes = utils.cloneArray(self._notes);
  obj._tags = utils.cloneArray(self._tags);

  obj._inner = {
    inclusions: utils.cloneArray(self._inner.inclusions),
    requireds: utils.cloneArray(self._inner.requireds),
    ordereds: utils.cloneArray(self._inner.ordereds),
    exclusions: utils.cloneArray(self._inner.exclusions),
    children: utils.cloneObject(self._inner.children),
    renames: utils.cloneObject(self._inner.renames)
  };

  obj._virtuals = utils.cloneObject(self._virtuals);

  return obj;
};

let proto = Schema.prototype;

proto.toObject = function(options) {
  let conf = Object.assign({}, config);
  options = Object.assign(conf, options);

  let obj = this.clone();
  let self = this;

  if (options.includeVirtuals) {
    for (let name in self._virtuals) {
      obj._virtuals[name] = self._virtuals[name];
    }
  }

  return obj;
};

const addCustomMehtod = function addCustomMehtod(ctx, methodName, type) {
  ctx[methodName] = function (fn) {
    assert(utils.isFunction(fn), `${utils.obj2Str(fn)} is not a valid function`);

    let name = utils.getName(fn);
    let _fn = utils.tryCatch(type, name, fn);

    const obj = this.clone();
    obj._methods[name] = obj._methods[name] || [];
    obj._methods[name].push({ fn: _fn, args: [], type: type });
    return obj;
  };
};

addCustomMehtod(proto, 'validate', 'validator');
addCustomMehtod(proto, 'sanitize', 'sanitizer');

proto._validate = function _validate(val, state, options) {
  state = state || {};
  options = options || {};

  let self = this;
  let value = val;
  let errors = new Errors();

  let isErrored = function() {
    return state.hasErrors || errors.any();
  };

  let canAbortEarly = function() {
    return options.abortEarly && isErrored();
  };

  let handleResult = function() {
    return { errors: errors.any() ? errors : null, value: value };
  };

  if (canAbortEarly()) return handleResult();

  let methods = self._methods;

  if (!options.noDefaults && utils.isUndefined(value)) value = this._defaultValue;

  // validate when val is `required` or `forbidden` or equal to `undefined`
  let validationNeeded = methods.forbidden || methods.required || !utils.isUndefined(value);

  if (!validationNeeded) return handleResult();

  let currentPath = utils.buildPath(state);
  let currentType = self._type;

  // convert value to specific type
  if (options.convert) {
    try {
      value = utils.isUndefined(value) ? value : self.convert(value);
    } catch (e) {
      value = null;
      errors.add(utils.buildPath({
        parentPath: currentPath,
        parentType: currentType,
        key: 'convertError'
      }), e);
    }
  }

  for (let name in methods) {
    // check all validators under `strict` mode
    if (canAbortEarly()) break;

    let fns = methods[name];

    // check if need to validate inners
    if (name === '__validateInnerFlag__' && fns) {
      let res = self._validateInner(val, {
        // original state
        original: state.original,

        // changed state
        key: '',
        parentPath: currentPath,
        parentType: currentType,
        parentObj: value,
        hasErrors: isErrored()
      }, options);

      value = res.value;
      errors = errors.concat(res.errors);
    } else {
      for (let mi = 0; mi < fns.length; mi++) {
        if (canAbortEarly()) break;

        let fn = fns[mi];

        // apply all validators
        if (!options.skipValidators && fn.type === 'validator') {

          let error = utils.invokeMethod(fn, value, {
            // original state
            parentType: state.parentType,
            parentObj: state.parentObj,
            original: state.original,

            // changed state
            parentPath: currentPath,
            key: name,
            hasErrors: isErrored()
          });

          if (utils.isError(error)) {
            let path = utils.buildPath({ parentPath: currentPath, parentType: currentType, key: name });
            errors.add(path, error);
          }
        }
        // apply all sanitizers
        else if (!options.skipSantizers && fn.type === 'sanitizer') {
          value = utils.invokeMethod(fn, value, {
            // original state
            parentType: state.parentType,
            parentObj: state.parentObj,
            original: state.original,

            // changed state
            parentPath: currentPath,
            key: name,
            hasErrors: isErrored()
          });
        }
      }
    }
  }

  return handleResult();
};

const addDescription = function(desc) {
  if (utils.isUndefined(desc)) return this;

  assert(utils.isString(desc), 'Description must be a non-empty string');
  const obj = this.clone();
  obj._description = desc;
  return obj;
};

utils.addChainableMethod(proto, 'desc', utils.noop, addDescription, {
  onlyChainable: true,
  avoidNoArgCall: true
});
utils.addChainableMethod(proto, 'description', utils.noop, addDescription, {
  onlyChainable: true,
  avoidNoArgCall: true
});

const addNotes = function(notes) {
  if (utils.isUndefined(notes)) return this;

  assert(
    notes && (utils.isString(notes) || Array.isArray(notes)),
    'Notes must be a non-empty string or array'
  );

  const obj = this.clone();
  obj._notes = obj._notes.concat(notes);
  return obj;
};

utils.addChainableMethod(proto, 'note', utils.noop, addNotes, {
  onlyChainable: true,
  avoidNoArgCall: true
});
utils.addChainableMethod(proto, 'notes', utils.noop, addNotes, {
  onlyChainable: true,
  avoidNoArgCall: true
});

const addTags = function(tags) {
  if (utils.isUndefined(tags)) return this;

  assert(
    tags && (utils.isString(tags) || Array.isArray(tags)),
    'Tags must be a non-empty string or array'
  );

  const obj = this.clone();
  obj._tags = obj._tags.concat(tags);
  return obj;
};

utils.addChainableMethod(proto, 'tag', utils.noop, addTags, {
  onlyChainable: true,
  avoidNoArgCall: true
});
utils.addChainableMethod(proto, 'tags', utils.noop, addTags, {
  onlyChainable: true,
  avoidNoArgCall: true
});

const addVirtual = function(name, value) {
  if (utils.isUndefined(name)) return this;

  assert(utils.isString(name), `${utils.obj2Str(name)} is not a valid string`);

  const obj = this.clone();
  obj._virtuals[name] = value;
  return obj;
};

utils.addChainableMethod(proto, 'virtual', utils.noop, addVirtual, {
  onlyChainable: true,
  avoidNoArgCall: true
});

const addDefault = function(value) {
  const obj = this.clone();
  obj._defaultValue = value;
  return obj;
};

utils.addChainableMethod(proto, 'default', utils.noop, addDefault, {
  onlyChainable: true
});

module.exports = Schema;
