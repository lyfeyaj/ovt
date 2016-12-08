'use strict';

const utils = require('./utils');
const Calculator = require('./calculator');

class Schema {
  constructor() {
    this._type = undefined;
    this._defaultValidator = undefined;
    this._defaultValue = undefined;
    this._emptySchema = undefined;
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
    obj._emptySchema = this._emptySchema;
    obj._methods = {};

    for (let name in this._methods) {
      obj._methods[name] = this._methods[name];
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

  validate(value, options) {
    let state = { path: '',  key: '', value: value, hasErrors: false };
    return Calculator.execute(value, this, state, options);
  }
}

const chainable = utils.chainable(Schema.prototype);

chainable('empty', {
  chainingBehaviour: function addDescription(schema) {
    this._emptySchema = schema;
    return this;
  }
});

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
