var pool = require('./pool')
var os = require('os')

module.exports = function (path, options) {
  return pool(Object.assign({
    poolSize: os.cpus().length || 2,
    workerPath: path,
    workerConstructor: (typeof Worker !== 'undefined' && Worker),
  }, options))
}