'use strict';

const Errors = require('./errors');
const utils = require('./utils');

class Schema {
  constructor() {
    this._type = undefined;
    this._defaultValidator = undefined;
    this._defaultValue = undefined;
    this.isOvt = true;
    this._description = undefined;
    this._notes = [];
    this._tags = [];
    this._methods = {};
    this._inner = {
      // array inners
      inclusions: [],
      requireds: [],
      ordereds: [],
      exclusions: [],
      orderedExclusions: [],

      // object inners
      children: {},
      renames: {}
    };

    this._virtuals = {};
  }

  initialize() {
    return this._defaultValidator ? this[this._defaultValidator]() : this;
  }

  convert(val) { return val; }

  clone() {
    const obj = new this.constructor();
    const self = this;

    obj._defaultValidator = self._defaultValidator;
    obj._defaultValue = self._defaultValue;
    obj._methods = {};

    for (let methodName in self._methods) {
      obj._methods[methodName] = utils.cloneArray(self._methods[methodName]);
    }

    obj._description = self._description;
    obj._notes = utils.cloneArray(self._notes);
    obj._tags = utils.cloneArray(self._tags);

    obj._inner = {
      inclusions: utils.cloneArray(self._inner.inclusions),
      requireds: utils.cloneArray(self._inner.requireds),
      ordereds: utils.cloneArray(self._inner.ordereds),
      orderedExclusions: utils.cloneArray(self._inner.orderedExclusions),
      exclusions: utils.cloneArray(self._inner.exclusions),
      children: utils.cloneObject(self._inner.children),
      renames: utils.cloneObject(self._inner.renames)
    };

    obj._virtuals = utils.cloneObject(self._virtuals);

    return obj;
  }

  _validate(val, state, options) {
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
        let path = utils.buildPath({
          parentPath: currentPath,
          parentType: currentType,
          key: 'convertError'
        });
        errors.add(path, e);
      }
    }

    // Perform renames
    if (value && self._type === 'object') {
      let renames = self._inner.renames;
      value = utils.cloneObject(value);
      for (let oldName in renames) {
        let newName = renames[oldName];
        if (oldName in value) {
          value[newName] = value[oldName];
          delete value[oldName];
        }
      }
    }

    // loop methods and apply one by one
    for (let name in methods) {
      // check all validators under `strict` mode
      if (canAbortEarly()) break;

      let fns = methods[name];

      // check if need to validate inners
      if (name === '__validateInnerFlag__' && fns) {
        let res = self._validateInner(value, {
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

          let isValidator = fn.type === 'validator';
          let isSanitizer = fn.type === 'sanitizer';

          if (isValidator && options.skipValidators) break;
          if (isSanitizer && options.skipSantizers) break;
          if (!isValidator && !isSanitizer) break;

          let _state = {
            // original state
            parentType: state.parentType,
            parentObj: state.parentObj,
            original: state.original,

            // changed state
            parentPath: currentPath,
            key: name,
            hasErrors: isErrored(),
            args: []
          };

          let _res = utils.invokeMethod(fn, value, _state);

          if (isValidator) {
            if (utils.isError(_res)) {
              let path = utils.buildPath({ parentPath: currentPath, parentType: currentType, key: name });
              let args = utils.cloneArray(_state.args);
              // allow args like [{ min: 1, max: 5 }] can be accessed directly
              if (args.length === 1 && utils.isObject(args)) {
                args = Object.assign(args, args[0]);
              }
              args.flattenedArgs = args.join(', ');
              args.locale = options.locale;
              // generate error message by i18n
              let errorMessage = utils.m(fn, options) ||
                                 utils.t(`${self._type}.${name}`, args) ||
                                 _res;
              errors.add(self._description || path, errorMessage);
            }
          } else {
            value = _res;
          }
        }
      }
    }

    return handleResult();
  }

  _addCustomMethod(type, fn) {
    utils.assert(utils.isFunction(fn), `${utils.obj2Str(fn)} is not a valid function`);

    let name = type === 'validator' ? '_customValidators' : '_customSanitizers';
    let _fn = utils.tryCatch(type, name, fn);
    let args = utils.cloneArray(arguments);
    args.shift();

    // handle custom locale
    let locale;
    if (utils.isLocale(args[args.length - 1])) {
      locale = args.pop();
    }

    const obj = this.clone();

    obj._methods[name] = obj._methods[name] || [];
    obj._methods[name].push({ name, fn: _fn, args, type: type, locale });
    return obj;
  }

  validate(fn) {
    return this._addCustomMethod('validator', fn);
  }

  sanitize(fn) {
    return this._addCustomMethod('sanitizer', fn);
  }
}

const chainable = utils.chainable(Schema.prototype);

chainable('desc', 'description', {
  chainingBehaviour: function addDescription(desc) {
    if (utils.isUndefined(desc)) return this;

    utils.assert(utils.isString(desc), 'Description must be a non-empty string');
    this._description = desc;
    return this;
  }
});

chainable('note', 'notes', {
  chainingBehaviour: function addNotes(notes) {
    if (utils.isUndefined(notes)) return this;

    utils.assert(
      notes && (utils.isString(notes) || Array.isArray(notes)),
      'Notes must be a non-empty string or array'
    );

    this._notes = this._notes.concat(notes);
    return this;
  }
});

chainable('tag', 'tags', {
  chainingBehaviour: function addTags(tags) {
    if (utils.isUndefined(tags)) return this;

    utils.assert(
      tags && (utils.isString(tags) || Array.isArray(tags)),
      'Tags must be a non-empty string or array'
    );

    this._tags = this._tags.concat(tags);
    return this;
  }
});

chainable('virtual', {
  chainingBehaviour: function addVirtual(name, value) {
    if (utils.isUndefined(name)) return this;

    utils.assert(utils.isString(name), `${utils.obj2Str(name)} is not a valid string`);

    this._virtuals[name] = value;
    return this;
  }
});

chainable('default', {
  chainingBehaviour: function addDefault(value) {
    this._defaultValue = value;
    return this;
  }
});

module.exports = Schema;
