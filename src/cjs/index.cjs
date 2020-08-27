/*
* src/cjs-tools/index.cjs
*/
const clearFirestoreData = require('./clearFirestoreData.cjs');
const prime = require('./prime.cjs');

const jestResolver = require('./jestResolver.cjs');

module.exports = {
  clearFirestoreData,
  prime,
  jestResolver
}
