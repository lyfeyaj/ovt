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
   * add a new error
   * {
   *   isEmail: ['not a valid email']
   * }
   */
  add(name, msg) {
    this.hasErrors = true;
    msg = msg || this.defaultMessage(name);
    let messages = this._errors[name] || [];
    messages = messages.concat(msg);
    this._errors[name] = messages;
    return this;
  }

  concat(errors) {
    let self = this;
    let newErrors = new Errors();
    errors = errors || new Errors();

    if (self.any()) {
      newErrors = newErrors.concat(self);
    }

    if (errors.any()) {
      for (let key in errors._errors) {
        newErrors.hasErrors = true;

        let messages = errors._errors[key];
        newErrors._errors[key] = newErrors._errors[key] || [];
        newErrors._errors[key] = newErrors._errors[key].concat(messages);
      }
    }

    return newErrors;
  }

  /**
   * To human readable format
   *   example:  email is not a valid; name is required
   */
  toHuman() {
    return this.flatten().join('; ');
  }

  /**
   * Flatten Error Message
   *   example:  ['email is not a valid', 'name is required']
   */

  flatten() {
    let self = this;
    let errors = [];
    for (let name in self._errors) {
      let messages = self._errors[name] || [];
      messages.forEach(function(msg) {
        msg = msg || self.defaultMessage(name);
        if (msg instanceof Error) msg = msg.message;
        errors.push(`${name}${msg}`);
      });
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
    return 'Validation ' + name + 'failed';
  }

  /**
   * Check if there exists any error
   */
  any() {
    return this.hasErrors;
  }
}

module.exports = Errors;
