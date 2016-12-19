'use strict';

const utils = require('./utils');
const Calculator = require('./calculator');
const config = require('./config');

class Schema {
  constructor() {
    this._type = undefined;
    this._defaultValidator = undefined;
    this._defaultValue = undefined;
    this._emptySchema = undefined;
    this.isOvt = true;
    this._label = undefined;
    this._description = undefined;
    this._error = undefined;
    this._notes = [];
    this._tags = [];
    this._methods = Object.create(null);
    this._options = Object.create(null);
    this._inner = {
      // array inners
      inclusions: [],
      requireds: [],
      ordereds: [],
      exclusions: [],
      orderedExclusions: [],

      // object inners
      children: Object.create(null),
      renames: Object.create(null)
    };

    this._virtuals = Object.create(null);
  }

  initialize() {
    return this._defaultValidator ? this[this._defaultValidator]() : this;
  }

  convert(val) { return val; }

  clone() {
    const obj = new this.constructor();

    obj._error = this._error;
    obj._defaultValidator = this._defaultValidator;
    obj._defaultValue = this._defaultValue;
    obj._emptySchema = this._emptySchema;
    obj._methods = utils.merge({}, this._methods);
    obj._options = utils.merge({}, this._options);

    obj._label = this._label;
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

  concat(schema) {
    utils.assert(schema && schema.isOvt, `${utils.obj2Str(schema)} is not a valid ovt schema`);
    utils.assert(
      this._type === 'any' || schema._type === 'any' || this._type === schema._type,
      `${this._type} schema is not allowed to concat ${schema._type} schema`
    );
    let source, target;
    if (this._type === 'any' || this._type === schema._type) {
      source = schema.clone();
      target = this;
    } else if (schema._type === 'any') {
      source = this.clone();
      target = schema;
    }

    source._defaultValidator = target._defaultValidator;
    source._error = target._error;
    source._defaultValue = target._defaultValue;
    source._emptySchema = target._emptySchema;
    source._description = target._description;
    source._label = target._label;
    source._notes = source._notes.concat(target._notes);
    source._tags = source._tags.concat(target._tags);

    utils.merge(source._methods, target._methods);
    utils.merge(source._inner.inclusions, target._inner.inclusions);
    utils.merge(source._inner.requireds, target._inner.requireds);
    utils.merge(source._inner.ordereds, target._inner.ordereds);
    utils.merge(source._inner.orderedExclusions, target._inner.orderedExclusions);
    utils.merge(source._inner.exclusions, target._inner.exclusions);
    utils.merge(source._inner.children, target._inner.children);
    utils.merge(source._inner.renames, target._inner.renames);
    utils.merge(source._virtuals, target._virtuals);

    return source;
  }

  validate(value, options, state) {
    state = state || {};
    state = {
      origin: state.origin === undefined ? value : state.origin,
      path: state.path,
      key: state.key,
      value: value,
      hasErrors: state.hasErrors || false
    };

    options = utils.merge(options || {}, this._options);
    return Calculator.execute(value, this, state, options);
  }

  error(msg) {
    let locale = config.defaultLocale || 'en';
    if (utils.isString(msg)) {
      this._error = { [locale]: msg };
    } else if (utils.isObject(msg)) {
      this._error = msg;
    } else {
      throw new Error('invalid custom error');
    }

    return this;
  }
}

const chainable = utils.chainable(Schema.prototype);

chainable('empty', {
  chainingBehaviour: function addDescription(schema) {
    this._emptySchema = schema;
    return this;
  }
});

chainable('options', {
  chainingBehaviour: function(opts) {
    opts = opts || {};
    utils.merge(this._options, opts);
    return this;
  }
});

chainable('desc', 'description', {
  chainingBehaviour: function addDescription(desc) {
    if (utils.isUndefined(desc)) return this;

    utils.assert(utils.isString(desc), 'Description must be a non-empty string');

    this._description = desc;

    // set label
    if (utils.isUndefined(this._label)) this._label = desc;

    return this;
  }
});

chainable('label', {
  chainingBehaviour: function addLabel(label) {
    if (utils.isUndefined(label)) return this;

    utils.assert(utils.isString(label), 'Label must be a non-empty string');

    this._label = label;

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
