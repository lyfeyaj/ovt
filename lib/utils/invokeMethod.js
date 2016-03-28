module.exports = function(method, val) {
  var args = (method.args || []).slice();

  args.unshift(val);

  return method.fn.apply(method, args);
};
