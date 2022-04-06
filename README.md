# gibb

`gibb` is an NPM package capable to detect gibberish. It uses a 2 character [Markov chain](http://en.wikipedia.org/wiki/Markov_chain).

Ported to JavaScript from Python implementation: https://github.com/rrenaud/Gibberish-Detector 

## How to install

```shell
npm install gibberish
```

## How to use

```javascript
import {isGibberish} from 'gibb';

console.log(isGibberish('my name is rob and i like to hack')); // false
console.log(isGibberish('is this thing working?')); // false
console.log(isGibberish('i hope so')); // false
console.log(isGibberish('t2 chhsdfitoixcv')); // true
console.log(isGibberish('ytjkacvzw')); // true
console.log(isGibberish('yutthasxcvqer')); // true
console.log(isGibberish('seems okay')); // false
console.log(isGibberish('yay!')); // false
```

## Advanced usage

```javascript
import {train, isGibberish} from 'gibb';

train('./my-model.json', './line-separated-dataset.txt', './good-probes.txt', './bad-probes.txt');

console.log(isGibberish('yay!', './my-model.json'));
```
