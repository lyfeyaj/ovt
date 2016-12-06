'use strict';

const helpers = require('../helpers');
const FunctionType = require('../../lib/types/function');

describe('FunctionType', function() {
  let schema;

  beforeEach(function() {
    schema = (new FunctionType()).isFunction();
  });

  helpers.inheritsAnyTypeBy(FunctionType);

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
});
