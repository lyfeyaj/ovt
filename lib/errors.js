'use strict';

/**
 * A wrapper to collect errors
 * @class
 */
class Errors extends Error {
  constructor() {
    super();

    this.isOvt = true;
    this.hasErrors = false;
    this.name = 'ValidationError';
    this._errors = {};
  }

  /**
   * reset errors
   */
  reset() {
    this.hasErrors = false;
    this._errors = {};
    return this;
  }

  /**
   * add a new error
   * {
   *   isEmail: ['not a valid email']
   * }
   */
  add(name, msg) {
    this.hasErrors = true;
    msg = msg || this.defaultMessage(name);
    let messages = this._errors[name] || [];
    this._errors[name] = messages.concat(msg);
    return this;
  }

  get(name) {
    return this._errors[name];
  }

  concat(errors) {
    let newErrors = new Errors();

    if (this.any()) newErrors = newErrors.concat(this);

    if (errors && errors.any()) {
      for (let key in errors._errors) {
        newErrors.add(key, errors.get(key));
      }
    }

    return newErrors;
  }

  /**
   * To human readable format
   *   example:  email is not a valid; name is required
   */
  toHuman(joiner) {
    return this.flatten(joiner).join('; ');
  }

  /**
   * Flatten Error Message
   *   example:  ['email is not a valid', 'name is required']
   */

  flatten(joiner) {
    joiner = joiner || ' ';
    let errors = [];
    for (let name in this._errors) {
      let messages = this._errors[name] || [];
      for(let i = 0; i < messages.length; i++) {
        let msg = messages[i] || this.defaultMessage(name);
        if (msg instanceof Error) msg = msg.message;
        errors.push(`${name}${joiner}${msg}`);
      }
    }
    return errors;
  }

  /**
   * To JSON  format
   */
  asJSON() {
    return this._errors;
  }

  /**
   * Default message format
   */
  defaultMessage(name) {
    return 'Validation ' + name + ' failed';
  }

  /**
   * Check if there exists any error
   */
  any() {
    return this.hasErrors;
  }
}

module.exports = Errors;
