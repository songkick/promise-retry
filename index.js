module.exports = function(settings){

  return function(fn){

    function call(resolve, reject, failureCount, passedErrors){

      return fn()
        .then(function(result){ resolve(result) })
        .catch(function(err){
          var errors = passedErrors.concat([err]);
          failureCount++;
          if (failureCount > settings.retries) {
            reject({
              errors: errors,
              fn: fn,
              retries: settings.retries,
              message: 'Maximum retries count reached'
            });
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
