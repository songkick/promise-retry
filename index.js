module.exports = function(settings){

  return function(fn){

    function call(resolve, reject, failureCount, passedErrors){

      return fn()
        .then(function(result){ resolve(result) })
        .catch(function(err){
          var errors = passedErrors.concat([err]);
          failureCount++;
          if (failureCount > settings.retries) {
            reject(new OutOfRetriesError(settings, fn, errors));
          } else {
            setTimeout(function(){
              call(resolve, reject, failureCount, errors);
            }, settings.delay);
          }

        });
    }

    return function(){
      return new Promise(function(resolve, reject){
        call(resolve, reject, 0, []);
      });
    };
  };
}

var OutOfRetriesError = module.exports.OutOfRetriesError = function(settings, fn, errors){
    this.message = 'Maximum retries count reached';
    this.settings = settings;
    this.fn = fn;
    this.errors = errors;
};
OutOfRetriesError.prototype = Object.create(Error.prototype);
