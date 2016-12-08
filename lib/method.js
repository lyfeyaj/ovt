'use strict';

const magico = require('magico');
const utils = require('./utils');

class Method {
  constructor(options) {
    options = options || {};

    this.name = options.name;
    this.fn = options.fn;
    this.args = options.args;
    this.refs = options.refs;
    this.type = options.type;
    this.path = options.path;
    this.locale = options.locale;
  }

  canBeBypassed(options) {
    options = options || {};
    if (this.type === 'validator' && options.skipValidators) return true;
    if (this.type === 'sanitizer' && options.skipSantizers) return true;
    if (this.type !== 'validator' && this.type !== 'sanitizer') return true;
    return false;
  }

  invoke(value, state) {
    state = state || {
      path: '',
      key: '',
      value: undefined,
      hasErrors: false
    };

    let args = utils.cloneArray(this.args);

    // replace reference value
    for (let key in this.refs) {
      args[key] = magico.get(state.value, args[key].__key);
    }

    state.args = args;

    return this.fn.apply(state, [value].concat(args));
  }

  message(error, args, locale) {
    args.args = args;
    args.locale = locale;
    let msg;
    if (this.locale) msg = this.locale.__msg[locale];
    // generate error message by i18n
    if (!msg) {
      msg = utils.t(this.path, args) || error || '';
    }
    return msg;
  }

  is(type) {
    return this.type === type;
  }
}

module.exports = Method;
