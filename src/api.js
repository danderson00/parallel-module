/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
var commonFactory = require('./worker.common')
var stub = require('./stub')

module.exports = function(workerModule, host) {
  host = host || self

  var resolvedModule

  host.onmessage = function(e) {
    var common = commonFactory(host || self)
    var emit = common.emit(e.data.id)
    var emitError = common.emitError(emit)
    var userEmit = common.userEmit(emit)

    try {
      switch(e.data.type) {
        case 'init':
        var options = e.data.options || {}
          var initPromise
          if(options.parameter || options.includeEmit) {
            initPromise = Promise.resolve(workerModule(options.parameter, userEmit))
          } else {
            initPromise = Promise.resolve(workerModule)
          }

          initPromise
            .then(function(result) {
              resolvedModule = result
              if(typeof result === 'object')
                emit({ result: { type: 'api', operations: Object.keys(result) } })
              else if (typeof result === 'function')
                emit({ result: { type: 'function' } })
              else
                emitError(new Error('Module exports must either be a function or an object'))
            })
            .catch(function(error) {
              emitError(error)
              host.close()
            })
          break;

        case 'invoke':
          if(typeof resolvedModule === 'object') {
            if(!resolvedModule[e.data.operation])
              emitError(new Error('Unknown operation: ' + e.data.operation))
            
            Promise.resolve(resolvedModule[e.data.operation](e.data.param, userEmit))
              .then(function(result) { emit({ result: result }) })
              .catch(emitError)
          } else if (typeof resolvedModule === 'function') {
            Promise.resolve(resolvedModule(e.data.param, userEmit))
              .then(function(result) { emit({ result: result }) })
              .catch(emitError)
          } else {
            emitError(new Error('Module exports must either be a function or an object'))
          }
          break;

        default:
          emitError(new Error('Unknown internal operation: ' + e.data.type))
      }
    } catch(error) {
      emitError(error)
      host.close()
    }
  }
}

module.exports.stub = function(worker) {
  return stub(worker, module.exports)
}