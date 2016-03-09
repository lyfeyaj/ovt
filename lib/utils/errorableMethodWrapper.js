// Wrapper method with proper error message
module.exports = function errorableMethodWrapper(type, name, method) {
  return function() {
    var message = `${type} '${name} failed'`;
    var result = method.apply(this, arguments) || message;
    if (result instanceof Error) {
      return result;
    } else {
      new Error(result);
    }
  };
};
