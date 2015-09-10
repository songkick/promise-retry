# promise-retry [![Build Status](https://travis-ci.org/songkick/promise-retry.svg)](https://travis-ci.org/songkick/promise-retry)

Retry a function until its returned promise succeeds

```js
var retryPromise = require('promise-retry');

retryPromise({ retries: 2 })(resolvesTheThirdTime).then(function(result){
  // never called here,
  // but if `retries` was >= 3,
  // result would be === 'yay!'
}).catch(function(err){
  // err === {
  //   message: 'Maximum retries count reached',
  //   retries: 2,
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
