'use strict';

const helpers = require('../helpers');
const RegExpType = require('../../lib/types/regexp');

describe('RegExpType', function() {
  let schema;

  beforeEach(function() {
    schema = (new RegExpType()).isRegExp();
  });

  helpers.inheritsAnyTypeBy(RegExpType);

  describe('isRegExp()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema, [
        [null, false],
        [0, false],
        [{}, false],
        [[], false],
        [new RegExp(), true],
        [/1/, true]
      ], { convert: false });
    });
  });
});
