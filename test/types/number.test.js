'use strict';

const expect = require('chai').expect;
const helpers = require('../helpers');
const NumberType = require('../../lib/types/number');

describe('NumberType', function() {
  let schema;

  beforeEach(function() {
    schema = (new NumberType()).isNumber();
  });

  helpers.inheritsAnyTypeBy(NumberType);

  describe('convert()', function() {
    it('should convert the value to number', function() {
      expect(schema.convert(1)).to.eq(1);
      expect(schema.convert('')).to.eq(0);
      expect(schema.convert(null)).to.eq(0);
      expect(schema.convert(true)).to.eq(1);
      expect(schema.convert(false)).to.eq(0);
      expect(schema.convert({})).to.be.NaN;
      expect(schema.convert(undefined)).to.be.NaN;
    });
  });

  describe('isNumber()', function() {
    describe('validate valid values', function() {
      helpers.validateIt(function() { return schema; }, [
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
    describe('validate valid values', function() {
      helpers.validateIt(function() {
        return schema.isInteger();
      }, [
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
    describe('validate valid values', function() {
      helpers.validateIt(function() {
        return schema.integer();
      }, [
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
    describe('validate valid values', function() {
      helpers.validateIt(function() {
        return schema.isPositive();
      }, [
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
    describe('validate valid values', function() {
      helpers.validateIt(function() {
        return schema.positive();
      }, [
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
    describe('validate valid values', function() {
      helpers.validateIt(function() {
        return schema.isNegative();
      }, [
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
    describe('validate valid values', function() {
      helpers.validateIt(function() {
        return schema.negative();
      }, [
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
    describe('validate valid values', function() {
      helpers.validateIt(function() {
        return schema.min(5);
      }, [
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
    describe('validate valid values', function() {
      helpers.validateIt(function() {
        return schema.max(5);
      }, [
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

  describe('error()', function() {
    describe('with error and label', function() {
      it('should return specific error', function() {
        expect(function() {
          helpers.attempt(schema.integer().min(5).positive().max(100).error('is invalid').label('age'), -2, { abortEarly: false });
        }).to.throw(Error).to.have.property('_errors').deep.eq({ age: [ 'is invalid' ] });
      });
    });

    describe('with label and without error', function() {
      it('should return specific error', function() {
        expect(function() {
          helpers.attempt(schema.integer().min(5).positive().max(100).label('age'), -2, { abortEarly: false });
        }).to.throw(Error).to.have.property('_errors').deep.eq({ age: [ 'can not less than 5', 'is not positive number' ] });
      });
    });

    describe('with label but without error', function() {
      it('should return specific error', function() {
        expect(function() {
          helpers.attempt(schema.integer().min(5).positive().max(100).label('age'), -2, { abortEarly: false });
        }).to.throw(Error).to.have.property('_errors').deep.eq({ age: [ 'can not less than 5', 'is not positive number' ] });
      });
    });

    describe('without label and error', function() {
      it('should return specific error', function() {
        expect(function() {
          helpers.attempt(schema.integer().min(5).positive().max(100), -2, { abortEarly: false });
        }).to.throw(Error).to.have.property('_errors').deep.eq({ min: [ 'can not less than 5' ], positive: [ 'is not positive number' ] });
      });
    });
  });
});
