const expect = require('chai').expect;
const Ovt = require('../');

module.exports = {
  validate: function(schema, samples, options) {
    options = options || {};
    samples = samples || [];
    samples.forEach(function(sample) {
      var value = sample[0];
      var result = sample[1];
      if (result === true) {
        expect(function() {
          Ovt.assert(value, schema, options);
        }).to.not.throw(Error);
      } else if (result === false) {
        expect(function() {
          Ovt.assert(value, schema, options);
        }).to.throw(Error);
      } else {
        expect(Ovt.validate(value, schema, options)).to.have.deep.property('value').to.eql(result);
      }
    });
  }
};
