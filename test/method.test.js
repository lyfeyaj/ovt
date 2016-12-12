'use strict';

const expect = require('chai').expect;
const Method = require('../lib/method');
require('./helpers');

describe('Method', function() {

  let validator;
  let sanitizer;

  let validatorOpts = {
    name: 'maxPropertiesLength',
    args: [],
    refs: { 0: { __key: 'length', __isRef: true } },
    type: 'validator',
    path: 'any.forbidden',
    locale: { __msg: { en: 'max properties length exceeded' }, __isLocale: true },
    fn: function(val, length, msg) {
      length = length || 0;
      if (!length) return true;
      let keys = Object.keys(val);
      let res = keys.length <= length;
      if (msg && !res) return msg;
      return res;
    }
  };

  let sanitizerOpts = {
    name: 'removeEmptyPair',
    args: [],
    refs: {},
    type: 'sanitizer',
    path: 'object',
    locale: {},
    fn: function(obj, allowNull) {
      let o = {};
      for (let key in obj) {
        let val = obj[key];
        let isEmpty = allowNull ? val === undefined : val == null;
        if (!isEmpty) o[key] = val;
      }
      return o;
    }
  };

  beforeEach(function() {
    validator = new Method(validatorOpts);
    sanitizer = new Method(sanitizerOpts);
  });

  describe('constructor()', function() {
    it('should have specified properties', function() {
      expect(validator).to.have.property('name').to.eq(validatorOpts.name);
      expect(validator).to.have.property('args').to.deep.eq(validatorOpts.args);
      expect(validator).to.have.property('refs').to.eq(validatorOpts.refs);
      expect(validator).to.have.property('type').to.eq(validatorOpts.type);
      expect(validator).to.have.property('path').to.eq(validatorOpts.path);
      expect(validator).to.have.property('locale').to.eq(validatorOpts.locale);
      expect(validator).to.have.property('fn').to.be.a('function');
    });
  });

  describe('canBeBypassed()', function() {
    it('return true if skipValidators is true', function() {
      // test validator
      expect(validator.canBeBypassed({ skipValidators: false })).to.be.false;
      expect(validator.canBeBypassed({ skipValidators: true })).to.be.true;
      validator.type = 'invalid_type';
      expect(validator.canBeBypassed({ skipValidators: false })).to.be.true;
      expect(validator.canBeBypassed({ skipValidators: true })).to.be.true;

      // test sanitizer
      expect(sanitizer.canBeBypassed({ skipSantizers: false })).to.be.false;
      expect(sanitizer.canBeBypassed({ skipSantizers: true })).to.be.true;
      sanitizer.type = 'invalid_type';
      expect(sanitizer.canBeBypassed({ skipSantizers: false })).to.be.true;
      expect(sanitizer.canBeBypassed({ skipSantizers: true })).to.be.true;
    });
  });

  describe('invoke()', function() {
    describe('validator', function() {
      it('should return error if validation failed', function() {

        let state = { origin: { length: 2 } };
        let schema = {};
        let options = {};

        expect(validator.invoke({ a: 0 }, state, schema, options)).to.be.undefined;
        expect(validator.invoke({ a: 0, b: 1 }, state, schema, options)).to.be.undefined;
        expect(validator.invoke({ a: 0, b: 1, c: 2 }, state, schema, options)).to.be.an.instanceOf(Error);
        expect(validator.invoke({}, state, schema, options)).to.be.undefined;

        validator.refs = {};
        validator.args = [1, 'object properties length exceeded'];
        expect(validator.invoke({ a: 0 }, state, schema, options)).to.be.undefined;
        expect(validator.invoke({ a: 0, b: 1 }, state, schema, options)).to.be.an.instanceOf(Error);
        expect(validator.invoke({ a: 0, b: 1 }, state, schema, options)).to.have.property('message', 'object properties length exceeded');
      });
    });

    describe('sanitizer', function() {
      it('should return sanitized value', function() {
        expect(sanitizer.invoke({ a: undefined, b: 1 })).to.deep.eq({ b: 1 });
        expect(sanitizer.invoke({ a: null, b: 1 })).to.deep.eq({ b: 1 });
        expect(sanitizer.invoke({ a: undefined, b: null })).to.deep.eq({});

        sanitizer.args = [true];
        expect(sanitizer.invoke({ a: undefined, b: 1 })).to.deep.eq({ b: 1 });
        expect(sanitizer.invoke({ a: null, b: 1 })).to.deep.eq({ a: null, b: 1 });
        expect(sanitizer.invoke({ a: undefined, b: null })).to.deep.eq({ b: null });
      });
    });
  });

  describe('message()', function() {
    it('should return message from predefined locale in method', function() {
      expect(validator.message('Invalid', [5])).to.eq('max properties length exceeded');
    });

    it('should return message from general locale', function() {
      validator.locale = null;
      expect(validator.message('Invalid', [5])).to.eq('is forbidden');
    });

    it('should return fallback message from default locale', function() {
      validator.locale = null;
      validator.path = 'object.unknown';
      expect(validator.message('Invalid', [5])).to.eq('validation failed');
    });

    it('should return error message passed in', function() {
      validator.locale = null;
      validator.path = 'object.maxPropertiesLength';
      expect(validator.message('Invalid', [5])).to.eq('Invalid');
    });
  });
});
