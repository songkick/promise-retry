var tap = require('tap');
var retryPromise = require('./index');

tap.test('throws when no settings or no retries specified', function (t) {

    t.plan(2);

    function success() {
        return Promise.resolve('success');
    }

    t.throws(retryPromise()(success));
    t.throws(retryPromise({})(success));

});

tap.test('resolves a successful promise right away', function (t) {

    t.plan(1);

    function success() {
        return Promise.resolve('success');
    }

    retryPromise({retries: 100})(success)().then(function (result) {
        t.equal(result, 'success', 'result should be original promise result');
    }).catch(function (err) {
        t.bailout('the promise was unexpectedly rejected');
    });

});

tap.test('resolves by retrying until it succeeds', function (t) {

    t.plan(2);

    var succeedTheThirdTime = succeedAfter(3);

    retryPromise({retries: 100})(succeedTheThirdTime)().then(function (result) {
        t.equal(result, 'success', 'result should be original promise result');
        t.equal(succeedTheThirdTime.calls, 3, 'it kept calling the library');
    }).catch(function (err) {
        console.log(err);
        t.bailout('the promise was unexpectedly rejected');
    });

});

tap.test('rejects after maximum retries is reached', function (t) {

    t.plan(6);

    var calls = 0;

    function nope() {
        ++calls;
        return Promise.reject('nope');
    }

    var elevenRejections = [
        'nope', 'nope', 'nope', 'nope', 'nope',
        'nope', 'nope', 'nope', 'nope', 'nope',
        'nope'
    ];

    retryPromise({retries: 10})(nope)().then(function (err) {
        t.bailout('the promise was unexpectedly resolved');
    }).catch(function (error) {
        t.ok(error instanceof retryPromise.OutOfRetriesError, 'error should be instance of OutOfRetriesError');
        t.equal(error.fn, nope, 'initial functon was not returned');
        t.equal(error.message, 'Maximum retries count reached', 'wrong error message');
        t.equal(error.settings.retries, 10, 'retries count should be retries + 1');
        t.similar(error.errors, elevenRejections, 'result should be original function rejections');
        t.equal(calls, 11, 'did not retry the right amount of time');
    });

});

tap.test('delay option', function (t) {

    t.plan(3);

    var tick = 25;

    var succeedTheSecondTime = succeedAfter(2);

    retryPromise({retries: 3, delay: 2 * tick})(succeedTheSecondTime)().then(function () {
        t.equal(succeedTheSecondTime.calls, 2, 'function should be called after specified delay');
    });

    setTimeout(function () {
        t.equal(succeedTheSecondTime.calls, 1, 'function must be called right away the frst time');
    }, 1 * tick);

    setTimeout(function () {
        t.equal(succeedTheSecondTime.calls, 2, 'function should be called after specified delay');
    }, 3 * tick);

});

tap.test('composition', function (t) {

    t.plan(4);

    var tick = 20;
    var retryTwice = retryPromise({retries: 2});
    var retryAterTwoTicks = retryPromise({retries: 1, delay: 1 * tick});

    var calls = 0;
    var rejectionsLeft = 5;

    var rejectsFiveTimes = function () {
        calls++;
        if (rejectionsLeft--) {
            return Promise.reject('nope');
        } else {
            return Promise.resolve('ok');
        }
    };

    retryAterTwoTicks(retryTwice(rejectsFiveTimes))().then(function (res) {
        t.equal(calls, 6, 'the initial function was called the wrong number of time');
        t.equal(res, 'ok', 'the initial result was not returned');
    }).catch(function (err) {
        t.bailout('the global promise was rejected');
    });

    // before the delayed retry triggers
    setTimeout(function () {
        t.equal(calls, 3, 'the call count before the delay is not right');
    }, 1 * tick);

    // well after the delayed retries
    setTimeout(function () {
        t.equal(calls, 6, 'the call count before the delay is not right');
    }, 5 * tick);

});

function succeedAfter(callsBeforeSuccess) {

    function tryOnce() {
        if (++tryOnce.calls < callsBeforeSuccess) {
            return Promise.reject('Try again');
        } else {
            return Promise.resolve('success');
        }
    }

    tryOnce.calls = 0;

    return tryOnce;
}
