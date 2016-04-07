const expect = require('chai').expect;
const Ovt = require('../');

module.exports = {
  validate: function(schema, samples) {
    samples = samples || [];
    samples.forEach(function(sample) {
      var value = sample[0];
      var result = sample[1];
      if (result) {
        expect(function() {
          Ovt.assert(value, schema);
        }).to.not.throw(Error);
      } else {
        expect(function() {
          Ovt.assert(value, schema);
        }).to.throw(Error);
      }
    });
  }
};
