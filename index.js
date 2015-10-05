var factory = function (createExecutor) {
    return function (settings) {
        return function (fn) {
            return function () {
                return new Promise(createExecutor(fn, settings));
            };
        };
    };
};

var OutOfRetriesError = function (settings, fn, errors) {
    this.message = 'Maximum retries count reached';
    this.settings = settings;
    this.fn = fn;
    this.errors = errors;
};
OutOfRetriesError.prototype = Object.create(Error.prototype);

var promiseRetry = factory(function (fn, settings) {
    var failureCount = 0,
        errors = [];

    if (!settings || typeof settings.retries !== 'number') {
        throw new Error("settings.retries must be a number");
    }

    var getDelay = typeof settings.delay === 'function' ? settings.delay : function(){
        return settings.delay;
    };

    function executor(resolve, reject) {
        return fn()
            .then(resolve)
            .catch(function (err) {
                errors = errors.concat([err]);
                failureCount++;
                if (failureCount > settings.retries) {
                    reject(new OutOfRetriesError(settings, fn, errors));
                } else {
                    setTimeout(function () {
                        executor(resolve, reject);
                    }, getDelay(failureCount));
                }
            });
    }

    return executor;
});


promiseRetry.OutOfRetriesError = OutOfRetriesError;

module.exports = promiseRetry;
