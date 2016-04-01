module.exports = function(fn) {
  fn = fn || function() {};
  var counter = Date.now() % 1e9;
  if (fn.name) return fn.name;
  return '__ovt' + (Math.random() * 1e9 >>> 0) + (counter++ + '__');
};
