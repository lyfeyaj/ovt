'use strict';

const Helper = require('./helpers');
const StringType = require('../lib/types/string');

describe('StringType', function() {
  let schema;

  beforeEach(function() {
    schema = (new StringType()).isString();
  });

  describe('isString()', function() {
    it('should validate valid values', function() {
      Helper.validate(schema, [
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
      Helper.validate(schema.required(), [
        [null, false],
        [0, false],
        [undefined, false],
        [new String(), false],
        ['', false],
        ['a', true]
      ], { convert: false });
    });
  });
});
