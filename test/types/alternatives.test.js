'use strict';

const expect = require('chai').expect;
const helpers = require('../helpers');
const AlternativesType = require('../../lib/types/alternatives');
const AnyType = require('../../lib/types/any');

describe('AlternativesType', function() {

  helpers.inheritsAnyTypeBy(AlternativesType);

  let any1 = (new AnyType).required().valid(1, 2);
  let any2 = (new AnyType).required().valid(3, 4);
  let any3 = (new AnyType).required().valid('pass1', 'pass2');

  describe('try()', function() {
    it ('should pass if one schema is passed - spread', function() {
      let schema = (new AlternativesType()).required().try(any1, any2, any3);

      helpers.validate(schema, [
        [undefined, false],
        [null, false],
        [1, true],
        [2, true],
        [3, true],
        [4, true],
        ['pass1', true],
        ['pass2', true],
        [5, false],
        ['any', false]
      ]);
    });

    it ('should pass if one schema is passed - array', function() {
      let any1 = (new AnyType).required().valid(1, 2);
      let any2 = (new AnyType).required().valid(3, 4);
      let any3 = (new AnyType).required().valid('pass1', 'pass2');
      let schema = (new AlternativesType()).required().try([any1, any2, any3]);

      helpers.validate(schema, [
        [undefined, false],
        [null, false],
        [1, true],
        [2, true],
        [3, true],
        [4, true],
        ['pass1', true],
        ['pass2', true],
        [5, false],
        ['any', false]
      ]);
    });

    it('should raise error if contains invalid schema', function() {
      expect(function() {
        (new AlternativesType()).try(1);
      }).to.throw(Error);
    });
  });

  describe('initialize()', function() {
    it ('should pass if one schema is passed - spread', function() {
      let schema = (new AlternativesType()).initialize(any1, any2, any3).required();

      helpers.validate(schema, [
        [undefined, false],
        [null, false],
        [1, true],
        [2, true],
        [3, true],
        [4, true],
        ['pass1', true],
        ['pass2', true],
        [5, false],
        ['any', false]
      ]);
    });

    it ('should pass if one schema is passed - array', function() {
      let any1 = (new AnyType).required().valid(1, 2);
      let any2 = (new AnyType).required().valid(3, 4);
      let any3 = (new AnyType).required().valid('pass1', 'pass2');
      let schema = (new AlternativesType()).initialize([any1, any2, any3]).required();

      helpers.validate(schema, [
        [undefined, false],
        [null, false],
        [1, true],
        [2, true],
        [3, true],
        [4, true],
        ['pass1', true],
        ['pass2', true],
        [5, false],
        ['any', false]
      ]);
    });

    it('should raise error if contains invalid schema', function() {
      expect(function() {
        (new AlternativesType()).initialize(1);
      }).to.throw(Error);
    });
  });
});
