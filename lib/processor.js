'use strict';

const magico = require('magico');
const Errors = require('./errors');
const utils = require('./utils');

class BaseProcessor {
  constructor(value, schema, state, options) {
    // data source
    this.value = value;
    this.state = state || {};
    this.schema = schema;
    this.type = this.schema._type;
    this.methods = schema._methods;
    this.options = utils.merge(utils.merge({}, options || {}), schema._options || {});
    this.errors = new Errors();

    this.path = this.buildPath(this.state.path, this.state.key);
  }

  buildPath(path, key) {
    path = path || '';
    if (key == null || key !== key || key === '') return path;
    return path ? path + '.' + key : key;
  }

  // create error by priority
  // 1. schema._error
  // 2. name by label or key name
  createError(key, e, label) {
    let locale = this.options.locale || 'en';
    let name = label ? label : this.buildPath(this.path, key || '');
    let errorMsg = magico.get(this.schema._error, locale);
    e = e || new Error('validation failed');

    if (errorMsg) {
      this.errors = this.errors.reset().add(name, errorMsg);
    } else {
      this.errors.add(name, e);
    }
  }

  concatErrors(errors) {
    this.errors = this.errors.concat(errors);
  }

  isErrored() {
    if (this._isErrored) return this._isErrored;
    this._isErrored = this.state.hasErrors || this.errors.any();
    return this._isErrored;
  }

  canAbortEarly() {
    if (this.isAborted) return this.isAborted;
    this.isAborted = this.options.abortEarly && this.isErrored();
    return this.isAborted;
  }

  result(value) {

    return {
      value: value,
      errors: this.errors.any() ? this.errors : null
    };
  }

  execute() { /* Overwrite */ }
}

class ArrayInnerProcessor extends BaseProcessor {
  constructor(value, schema, state, options) {
    super(value, schema, state, options);
  }

  stateBuilder(index) {
    let path = this.state.path;
    let key = this.state.key;
    if (index) {
      path = this.buildPath(this.state.path, key);
      key = index;
    }
    return {
      origin: this.state.origin,
      key: key,
      value: this.state.value,
      path: path,
      hasErrors: this.isErrored()
    };
  }

  execute() {
    let value = this.value.slice();

    if (this.canAbortEarly()) return this.result(value);

    let exclusions = this.schema._inner.exclusions;
    let requireds = utils.cloneArray(this.schema._inner.requireds);
    let inclusions = utils.cloneArray(this.schema._inner.inclusions).concat(requireds);
    let ordereds = this.schema._inner.ordereds;
    let orderedExclusions = this.schema._inner.orderedExclusions;

    let self = this;

    value = (value || []).map(function(item, vi) {
      let index = vi + '';

      if (self.canAbortEarly()) return item;

      // Validate exclusions
      for (let ei = 0; ei < exclusions.length; ei++) {
        if (self.canAbortEarly()) break;

        let exclusion = exclusions[ei];

        let res = Processor.execute(item, exclusion, self.stateBuilder(index), self.options);

        if (!res.errors) {
          self.createError(
            vi,
            utils.t('array.forbidden') || new Error('forbidden value can\'t be included'),
            self.schema._label
          );
        }
      }

      if (self.canAbortEarly()) return item;

      // Validate ordereds
      let ordered = ordereds[vi];
      if (ordered) {
        let res = Processor.execute(item, ordered, self.stateBuilder(index), self.options);
        item = res.value;
        self.concatErrors(res.errors);
      }

      if (self.canAbortEarly()) return item;

      // Validate exclusion with orders
      let orderedExclusion = orderedExclusions[vi];
      if (orderedExclusion) {
        let res = Processor.execute(item, orderedExclusion, self.stateBuilder(index), self.options);

        if (!res.errors) {
          self.createError(
            vi,
            utils.t('array.forbidden') || new Error('forbidden value can\'t be included'),
            self.schema._label
          );
        }
      }

      if (self.canAbortEarly()) return item;

      // Validate requireds
      let matchRequiredIndex = null;
      for (let ri = 0; ri < requireds.length; ri++) {
        let required = requireds[ri];
        let res = Processor.execute(item, required, self.stateBuilder(index), self.options);
        if (res.errors) continue;
        item = res.value;
        matchRequiredIndex = ri;
        break;
      }
      if (matchRequiredIndex !== null) requireds.splice(matchRequiredIndex, 1);

      if (self.canAbortEarly()) return item;

      // Validate inclusions
      let isIncluded = null;
      for (let ii = 0; ii < inclusions.length; ii++) {
        if (self.canAbortEarly()) break;
        if (isIncluded) break;

        let inclusion = inclusions[ii];
        let res = Processor.execute(item, inclusion, self.stateBuilder(index), self.options);

        if (!res.errors) {
          isIncluded = res;
        }
      }

      if (isIncluded) {
        item = isIncluded.value;
      } else {
        if (inclusions.length) {
          self.createError(
            '',
            utils.t('array.inclusions') || new Error('no valid schema matches'),
            self.schema._label
          );
        }
      }

      return item;
    });

    if (this.canAbortEarly()) return this.result(value);

    if (requireds.length) {
      let preferedLength = self.schema._inner.requireds.length;
      let currentLength = preferedLength - requireds.length;
      this.createError(
        '',
        utils.t(
          'array.requireds',
          { currentLength, preferedLength, locale: this.options.locale }
        ) ||
        new Error(`${preferedLength} elements are required, now is ${currentLength}`),
        this.schema._label
      );
    }

    if (this.canAbortEarly()) return this.result(value);

    // validate additional ordereds
    if (ordereds.length > value.length) {
      for (let oi = value.length; oi < ordereds.length; oi++) {
        let ordered = ordereds[oi];
        let index = oi + '';
        if (ordered) {
          let res = Processor.execute(undefined, ordered, this.stateBuilder(index), self.options);
          this.concatErrors(res.errors);
        }
      }
    }

    return this.result(value);
  }
}

class ObjectInnerProcessor extends BaseProcessor {
  constructor(value, schema, state, options) {
    super(value, schema, state, options);
  }

  rename(name) {
    return this.schema._inner.renames[name] || name;
  }

  execute() {
    let source = utils.cloneObject(this.value || {});
    let value = this.options.stripUnknown ? {} : source;

    // Get unprocessed keys
    let unprocessed = {};
    Object.keys(source).forEach(function(key) {
      unprocessed[key] = true;
    });

    if (this.canAbortEarly()) return this.result(value);

    let children = this.schema._inner.children;

    // Validate inners
    for (let name in children) {
      if (this.canAbortEarly()) break;

      // delete processed key
      delete unprocessed[name];

      let res = Processor.execute(
        magico.get(source, name),
        children[name],
        {
          origin: this.state.origin,
          value: source,
          path: this.path,
          key: name,
          hasErrors: this.isErrored()
        },
        this.options
      );

      magico.set(value, name, res.value);

      this.concatErrors(res.errors);
    }

    // Check unknown if not allow unknown keys and can't abort early
    if (!this.options.allowUnknown && !this.canAbortEarly()) {
      let unprocessedKeys = Object.keys(unprocessed);
      if (unprocessedKeys.length) {
        this.createError(
          unprocessedKeys[0],
          new Error(
            utils.t(
              'any.allowUnknown',
              { args: unprocessedKeys[0], locale: this.options.locale }
            )
          ),
          this.schema._label
        );
      }
    }

    return this.result(value);
  }
}

class Processor extends BaseProcessor {
  static execute(value, schema, state, options) {
    return (new Processor(value, schema, state, options)).execute();
  }

  constructor(value, schema, state, options) {
    super(value, schema, state, options);
  }

  applyDefault() {
    if (!this.options.noDefaults && utils.isUndefined(this.value)) {
      let defaultValue = this.schema._defaultValue;
      if (utils.isUndefined(defaultValue)) return;
      if (utils.isFunction(defaultValue)) {
        this.value = defaultValue(this.state.value);
      } else {
        this.value = defaultValue;
      }
    }
  }

  canBeBypassed() {
    // If value is required, then no value can be bypassed
    if (this.methods.required) return false;

    // If value is forbidden, then only undefined value can be bypassed
    if (this.methods.forbidden) return utils.isUndefined(this.value);

    // If value is optional, then only empty value can be bypassed
    return this.schema.isEmpty(this.value);
  }

  applyConvert() {
    // convert value to specific type
    if (this.options.convert) {
      let value = this.value;
      try {
        value = utils.isUndefined(value) ? value : this.schema.convert(value);
      } catch (e) {
        value = null;
        this.createError('convertError', e, this.schema._label);
      }

      this.value = value;
    }
  }

  execRenames() {
    // Perform renames
    let value = this.value;

    if (value && this.schema._type === 'object') {
      let renames = this.schema._inner.renames;

      value = utils.cloneObject(value);

      for (let oldName in renames) {
        let newName = renames[oldName];
        if (oldName in value) {
          value[newName] = value[oldName];
          delete value[oldName];
        }
      }
    }

    this.value = value;
  }

  canSkipMethodBy(type) {
    if (type === 'validator' && this.options.skipValidators) return true;
    if (type === 'sanitizer' && this.options.skipSantizers) return true;
    if (type !== 'validator' && type !== 'sanitizer') return true;
    return false;
  }

  execInners(value) {
    let calc;
    let state = {
      origin: this.state.origin,
      key: '',
      path: this.path,
      value: value,
      hasErrors: this.isErrored()
    };

    if (this.type === 'object') {
      calc = new ObjectInnerProcessor(value, this.schema, state, this.options);
    } else if (this.type === 'array') {
      calc = new ArrayInnerProcessor(value, this.schema, state, this.options);
    }

    if (!calc) return;

    let res = calc.execute();

    this.concatErrors(res.errors);
    return res.value;
  }

  execMethods() {
    let value = this.value;

    // loop methods and apply one by one
    for (let name in this.methods) {
      // check all validators under `strict` mode
      if (this.canAbortEarly()) break;

      let method = this.methods[name];

      // check if need to validate inners
      if (name === '__inners_flag__' && method) {
        value = this.execInners(value);
      } else {
        if (method.canBeBypassed(this.options)) continue;

        let state = {
          origin: this.state.origin,
          value: value,
          path: this.path,
          key: name,
          hasErrors: this.isErrored(),
          args: []
        };

        let _res = method.invoke(value, state, this.schema, this.options);

        // Result handle policy:
        // Sanitizer: if error returned, handle error, else change value coorespondingly
        // Validator: only handle error
        if (utils.isError(_res)) {
          let msg = method.message(_res, state.args, this.options.locale);
          this.createError(name, msg, this.schema._label);
        } else {
          // if is not
          if (method.type === 'sanitizer') value = _res;
        }
      }
    }

    this.value = value;
  }

  execute() {
    if (this.canAbortEarly()) return this.result(this.value);

    this.applyDefault();

    if (this.canBeBypassed()) return this.result(this.value);

    this.applyConvert();
    this.execMethods();
    this.execRenames();

    return this.result(this.value);
  }
}

Processor.BaseProcessor = BaseProcessor;
Processor.ArrayInnerProcessor = ArrayInnerProcessor;
Processor.ObjectInnerProcessor = ObjectInnerProcessor;

module.exports = Processor;
