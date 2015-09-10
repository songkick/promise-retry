var tap = require('tap');
var retryPromise = require('./index');

tap.test('resolves a successful promise right away', function(t){

  t.plan(1);

  function success() {
    return Promise.resolve('success');
  }

  retryPromise({retries: 100})(success).then(function(result){
    t.equal(result, 'success', 'result should be original promise result');
  }).catch(function(err){
    t.bailout('the promise was unexpectedly rejected');
  });

});

tap.test('resolves by retrying until it succeeds', function(t){

  t.plan(2);

  var callsBeforeSuccess = 3;
  var calls = 0;

  function tryOnce() {
    if (++calls < callsBeforeSuccess) {
      return Promise.reject('Try again');
    } else {
      return Promise.resolve('success');
    }
  }

  retryPromise({retries: 100})(tryOnce).then(function(result){
    t.equal(result, 'success', 'result should be original promise result');
    t.equal(calls, 3, 'it kept calling the library');
  }).catch(function(err){
    console.log(err);
    t.bailout('the promise was unexpectedly rejected');
  });

});

tap.test('rejects after maximum retries is reached', function(t){

  t.plan(5);

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

  retryPromise({retries: 10})(nope).then(function(err){
    t.bailout('the promise was unexpectedly resolved');
  }).catch(function(error){
    t.equal(error.fn, nope, 'initial functon was not returned');
    t.equal(error.message, 'Maximum retries count reached', 'wrong error message');
    t.equal(error.retries, 10, 'retries count should be retries + 1');
    t.similar(error.errors, elevenRejections, 'result should be original function rejections');
    t.equal(calls, 11, 'did not retry the right amount of time');
  });

});
