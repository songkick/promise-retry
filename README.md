# promise-retry [![Build Status](https://travis-ci.org/songkick/promise-retry.svg)](https://travis-ci.org/songkick/promise-retry) [![Code Climate](https://codeclimate.com/github/songkick/promise-retry/badges/gpa.svg)](https://codeclimate.com/github/songkick/promise-retry) [![Test Coverage](https://codeclimate.com/github/songkick/promise-retry/badges/coverage.svg)](https://codeclimate.com/github/songkick/promise-retry/coverage)

Retry a function until its returned promise succeeds

```js
var retryPromise = require('@songkick/promise-retry');
var retryTwiceEveryHundredMil = retryPromise({ retries: 2, delay: 100 });

retryTwiceEveryHundredMil(resolvesTheThirdTime)()
  .then(function(result){
    // never called here,
    // but if `retries` was >= 3,
    // result would be === 'yay!'
  }).catch(function(err){
    // err instanceof retryPromise.OutOfRetriesError === true
    // err === {
    //   message: 'Maximum retries count reached',
    //   settings: {
    //     retries: 2,
    //   },
    //   fn: resolvesTheThirdTime,
    //   errors: ['nope', 'nope', 'nope']
    // }
  });

var calls = 0;
function resolvesTheThirdTime() {
  if (++calls < 3) {
    return Promise.reject('nope');
  } else {
    return Promise.resolve('yay!');
  }
}
```

## Options

`retries`: positive (>= 0) number. The initial call doesn't count as a retry. If you set it to `3`, then your function might be called up to 4 times.

`delay`: the delay between retries or a `function(retryIndex){}` returning the delay. Does not apply on initial call. If a function is passed, it will receive the retry index as first argument (`1, 2, 3 ...`).

### Example:

```js
var retryWithIncreasingDelay = retryPromise({ retries: 10, delay: function(retryIndex) {
    return 100 * retryIndex;
});

/* time line:

0 > initial fail
0 + 100 > first retry
100 + 200 > second retry
300 + 300 > third retry
600 + 400 > fourth...

```

## Composition

As `promise-retry` input and output is a function returning a promise, you can compose them easily:

```js
var retryTwice = retryPromise({ retries: 2 });
var retryAterTwoSeconds = retryPromise({ retries: 1, delay: 2000 });
var getRejected = function(){
  return Promise.reject('nope');
};

retryOnceAterTwoSeconds(retryTwice(getRejected))().then(function(){
  // no way here
}).catch(function(){
  // at this point, `getRejected` will have been called 6 times
});
```

In the above exemple, the `getRejected`, this will happen:

1. Initial nest retry call
  1. initial `getRejected` call - callcount: 1
  1. first of two retries - callcount: 2
  1. second of two retries - callcount: 3
1. wait 2000ms
1. first and only retry
  1. initial `getRejected` call - callcount: 4
  1. first of two retries - callcount: 5
  1. second of two retries - callcount: 6
1. final rejection

# See also

`promise-retry` composes really well with the following promise helper:

* [`promise-timeout`](https://github.com/songkick/promise-timeout):
