import {strictEqual} from 'node:assert'
import {isGibberish} from './index.mjs';

const testCases = [
  ['my name is rob and i like to hack', false],
  ['is this thing working?', false],
  ['i hope so', false],
  ['t2 chhsdfitoixcv', true],
  ['ytjkacvzw', true],
  ['yutthasxcvqer', true],
  ['seems okay', false],
  ['yay!', false],
];

for (const [text, result] of testCases) {
  strictEqual(isGibberish(text), result, text);
}
