'use strict';

const helpers = require('../helpers');
const AlternateType = require('../../lib/types/alternative');
const AnyType = require('../../lib/types/any');

describe('AlternateType', function() {

  helpers.inheritsAnyTypeBy(AlternateType);

  describe('try()', function() {
    it ('should pass if one schema is passed', function() {
      let any1 = (new AnyType).required().valid(1, 2);
      let any2 = (new AnyType).required().valid(3, 4);
      let any3 = (new AnyType).required().valid('pass1', 'pass2');
      let schema = (new AlternateType()).required().try(any1, any2, any3);

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
  });
});
