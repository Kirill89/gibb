import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path'

const dataDir = join(dirname(fileURLToPath(import.meta.url)), 'data');

const acceptedChars = 'abcdefghijklmnopqrstuvwxyz ';
const pos = [...acceptedChars].reduce((acc, char, idx) => {
  acc[char] = idx;
  return acc;
}, {});

// Return only the subset of chars from acceptedChars.
// This helps keep the  model relatively small by ignoring punctuation,
// infrequenty symbols, etc.
function normalize(line) {
  return [...line.toLowerCase()].filter((c) => acceptedChars.includes(c));
}

// Return all n grams from l after normalizing
function* ngram(n, l) {
  const filtered = normalize(l);
  for (let start = 0; start < filtered.length - n + 1; start++) {
    yield filtered.slice(start, start + n);
  }
}

// Return the average transition prob from l through log_prob_mat.
export function avgTransitionProb(l, logProbMat) {
  let logProb = 0;
  let transitionCt = 0;
  for (const [a, b] of ngram(2, l)) {
    logProb += logProbMat[pos[a]][pos[b]];
    transitionCt += 1
  }
  // The exponentiation translates from log probs to probs.
  return Math.exp(logProb / (transitionCt || 1))
}

// Write a simple model as a JSON file
export function train(
  modelPath = join(dataDir, 'model.json'),
  datasetPath = join(dataDir, 'big.txt'),
  goodProbesPath = join(dataDir, 'good.txt'),
  badProbesPath = join(dataDir, 'bad.txt')) {
  const k = acceptedChars.length;
  // Assume we have seen 10 of each character pair.  This acts as a kind of
  // prior or smoothing factor.  This way, if we see a character transition
  // live that we've never observed in the past, we won't assume the entire
  // string has 0 probability.
  const counts = (new Array(k)).fill('').map(() => new Array(k).fill(10));

  // Count transitions from big text file, taken
  // from http://norvig.com/spell-correct.html
  const datasetFileData = readFileSync(datasetPath, 'utf-8');
  for (const line of datasetFileData.trim().split('\n')) {
    for (const [a, b] of ngram(2, line)) {
      counts[pos[a]][pos[b]] += 1;
    }
  }

  // Normalize the counts so that they become log probabilities.
  // We use log probabilities rather than straight probabilities to avoid
  // numeric underflow issues with long texts.
  // This contains a justification:
  // http://squarecog.wordpress.com/2009/01/10/dealing-with-underflow-in-joint-probability-calculations/
  for (let i = 0; i < counts.length; i++) {
    const row = counts[i];
    const s = row.reduce((acc, c) => acc + c, 0);
    for (let j = 0; j < row.length; j++) {
      row[j] = Math.log(row[j] / s);
    }
  }

  // Find the probability of generating a few arbitrarily choosen good and
  // bad phrases.
  const goodFileData = readFileSync(goodProbesPath, 'utf-8');
  const badFileData = readFileSync(badProbesPath, 'utf-8');
  const goodProbes = goodFileData.trim().split('\n').map((l) => avgTransitionProb(l, counts));
  const badProbes = badFileData.trim().split('\n').map((l) => avgTransitionProb(l, counts));

  // Assert that we actually are capable of detecting the junk.
  console.assert(Math.min(...goodProbes) > Math.max(...badProbes));

  // And pick a threshold halfway between the worst good and best bad inputs.
  const thresh = (Math.min(...goodProbes) + Math.max(...badProbes)) / 2;
  writeFileSync(modelPath, JSON.stringify({mat: counts, thresh}));
}

const modelsCache = new Map();

function loadModelCached(modelPath) {
  let model;

  if (modelsCache.has(modelPath)) {
    model = modelsCache.get(modelPath);
  } else {
    model = JSON.parse(readFileSync(modelPath, 'utf-8'));
    modelsCache.set(modelPath, model);
  }
  return model;
}

export function isGibberish(text, modelPath = join(dataDir, 'model.json')) {
  const model = loadModelCached(modelPath);

  return avgTransitionProb(text, model.mat) <= model.thresh;
}
