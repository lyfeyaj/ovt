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

    obj._defaultValidator = this._defaultValidator;
    obj._defaultValue = this._defaultValue;
    obj._methods = {};

    for (let name in this._methods) {
      obj._methods[name] = utils.cloneArray(this._methods[name]);
    }

    obj._description = this._description;
    obj._notes = utils.cloneArray(this._notes);
    obj._tags = utils.cloneArray(this._tags);

    obj._inner = {
      inclusions: utils.cloneArray(this._inner.inclusions),
      requireds: utils.cloneArray(this._inner.requireds),
      ordereds: utils.cloneArray(this._inner.ordereds),
      orderedExclusions: utils.cloneArray(this._inner.orderedExclusions),
      exclusions: utils.cloneArray(this._inner.exclusions),
      children: utils.cloneObject(this._inner.children),
      renames: utils.cloneObject(this._inner.renames)
    };

    obj._virtuals = utils.cloneObject(this._virtuals);

    return obj;
  }

  _validate(value, state, options) {
    state = state || {};
    options = options || {};

    let self = this;
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

    // validate when val is `required` or `forbidden` or not equal to `undefined`
    let validationNeeded = methods.forbidden || methods.required || !utils.isUndefined(value);

    if (!validationNeeded) return handleResult();

    let currentPath = utils.buildPath(state.path, state.key);

    // convert value to specific type
    if (options.convert) {
      try {
        value = utils.isUndefined(value) ? value : self.convert(value);
      } catch (e) {
        value = null;
        let path = utils.buildPath(currentPath, 'convertError');
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
      if (name === '__inners_flag__' && fns) {
        let res = self._validateInner(value, {
          key: '',
          path: currentPath,
          value: value,
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
            value: state.value,

            // changed state
            path: currentPath,
            key: name,
            hasErrors: isErrored(),
            args: []
          };

          let _res = utils.invokeMethod(fn, value, _state);

          if (isValidator) {
            if (utils.isError(_res)) {
              let path = utils.buildPath(currentPath, name);
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
