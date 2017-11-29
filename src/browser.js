var pool = require('./pool')

module.exports = function (options) {
  return pool(Object.assign({
    poolSize: (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 2,
    workerPath: 'parallel-module.js',
    workerConstructor: (typeof Worker !== 'undefined' && Worker),
  }, options))
}