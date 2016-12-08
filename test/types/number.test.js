'use strict';

const helpers = require('../helpers');
const NumberType = require('../../lib/types/number');

describe('NumberType', function() {
  let schema;

  beforeEach(function() {
    schema = (new NumberType()).isNumber();
  });

  helpers.inheritsAnyTypeBy(NumberType);

  describe('isNumber()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema, [
        [null, false],
        [0, true],
        [-1, true],
        [1.5, true],
        [NaN, true],
        [new Number(), true]
      ], { convert: false });
    });
  });

  describe('isInteger()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema.isInteger(), [
        [null, false],
        [0, true],
        [-1, true],
        [1, true],
        [1.5, false],
        [NaN, false],
        [new Number(), false]
      ], { convert: false });
    });
  });

  describe('integer()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema.integer(), [
        [null, false],
        [0, true],
        [-1, true],
        [1, true],
        [1.5, false],
        [NaN, false],
        [new Number(), false]
      ], { convert: false });
    });
  });

  describe('isPositive()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema.isPositive(), [
        [null, false],
        [0, false],
        [-1, false],
        [-1.5, false],
        [1, true],
        [1.5, true],
        [NaN, false],
        [new Number(), false]
      ], { convert: false });
    });
  });

  describe('positive()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema.positive(), [
        [null, false],
        [0, false],
        [-1, false],
        [-1.5, false],
        [1, true],
        [1.5, true],
        [NaN, false],
        [new Number(), false]
      ], { convert: false });
    });
  });

  describe('isNegative()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema.isNegative(), [
        [null, false],
        [0, false],
        [-1, true],
        [-1.5, true],
        [1, false],
        [1.5, false],
        [NaN, false],
        [new Number(), false]
      ], { convert: false });
    });
  });

  describe('negative()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema.negative(), [
        [null, false],
        [0, false],
        [-1, true],
        [-1.5, true],
        [1, false],
        [1.5, false],
        [NaN, false],
        [new Number(), false]
      ], { convert: false });
    });
  });

  describe('min()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema.min(5), [
        [null, false],
        [0, false],
        [-1, false],
        [1, false],
        [4.9, false],
        [5, true],
        [6, true],
        [NaN, false],
        [new Number(), false]
      ], { convert: false });
    });
  });

  describe('max()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema.max(5), [
        [null, false],
        [0, true],
        [-1, true],
        [1, true],
        [4.9, true],
        [5, true],
        [5.1, false],
        [6, false],
        [NaN, false],
        [new Number(), true]
      ], { convert: false });
    });
  });
});
