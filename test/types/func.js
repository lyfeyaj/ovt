'use strict';

const helpers = require('../helpers');
const FuncType = require('../../lib/types/func');

describe('FuncType', function() {
  let schema;

  beforeEach(function() {
    schema = (new FuncType()).isFunction();
  });

  helpers.inheritsAnyTypeBy(FuncType);

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
