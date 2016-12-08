'use strict';

const helpers = require('../helpers');
const AnyType = require('../../lib/types/any');
const StringType = require('../../lib/types/string');

describe('StringType', function() {
  let schema;

  beforeEach(function() {
    schema = (new StringType()).isString();
  });

  helpers.inheritsAnyTypeBy(StringType);

  describe('isString()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema, [
        [null, false],
        [0, false],
        [{}, false],
        [[], false],
        [new String(), true],
        ['', true]
      ], { convert: false });
    });
  });

  describe('required()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema.required(), [
        [null, false],
        [0, false],
        [undefined, false],
        [new String(), true],
        ['', true],
        ['a', true]
      ], { convert: false });
    });
  });

  describe('empty()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema.required().empty(''), [
        [null, false],
        [0, false],
        [undefined, false],
        ['', false],
        ['a', true]
      ], { convert: false });

      let empty = (new StringType).isString().valid('', new String);
      helpers.validate(schema.required().empty(empty), [
        [null, false],
        [0, false],
        [undefined, false],
        ['', false],
        ['a', true]
      ], { convert: false });
    });
  });
});
