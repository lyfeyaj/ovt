'use strict';

const expect = require('chai').expect;
const helpers = require('../helpers');
const FuncType = require('../../lib/types/func');

describe('FuncType', function() {
  let schema;

  beforeEach(function() {
    schema = (new FuncType()).isFunction();
  });

  helpers.inheritsAnyTypeBy(FuncType);

  describe('convert()', function() {
    it('should convert the value to function', function() {
      expect(schema.convert('2016-01-01')).to.be.a('function');
      expect(schema.convert(function() {})).to.be.a('function');
      expect(function() {
        schema.convert({});
      }).to.throw(Error);
    });
  });

  describe('isFunction()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema, [
        [null, false],
        [0, false],
        [[], false],
        [{}, false],
        [new Function(), true],
        [function() {}, true]
      ], { convert: false });
    });
  });

  describe('arity()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema.arity(1), [
        [null, false],
        [0, false],
        [[], false],
        [{}, false],
        [new Function(), false],
        [function(a) { return a; }, true],
        [function(a, b) { return [a, b]; }, false]
      ], { convert: false });
    });
  });

  describe('minArity()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema.minArity(1), [
        [null, false],
        [0, false],
        [[], false],
        [{}, false],
        [new Function(), false],
        [function(a) { return a; }, true],
        [function(a, b) { return [a, b]; }, true]
      ], { convert: false });
    });
  });

  describe('maxArity()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema.maxArity(3), [
        [null, false],
        [0, false],
        [[], false],
        [{}, false],
        [new Function(), true],
        [function(a) { return a; }, true],
        [function(a, b) { return [a, b]; }, true],
        [function(a, b, c) { return [a, b, c]; }, true],
        [function(a, b, c, d) { return [a, b, c, d]; }, false]
      ], { convert: false });
    });
  });
});
