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

          Promise.resolve(initialiseWorkerModule(resolveWorkerModule()))
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

            function resolveWorkerModule() {
              if(workerModule)
                return workerModule

              if(options.workerPath)
                return require(options.workerPath)

              throw new Error('No worker module provided')
            }

            function initialiseWorkerModule(resolvedModule) {
              var moduleParameters = []
              if(options.parameter !== undefined)
                moduleParameters.push(options.parameter)
              if(options.includeEmit)
                moduleParameters.push(userEmit)

              return moduleParameters.length === 0
                ? resolvedModule
                : resolvedModule.apply(resolvedModule, moduleParameters)
            }
          break;

        case 'invoke':
          var parameters = (e.data.parameters || []).concat(userEmit)
          var invokePromise

          if(typeof resolvedModule === 'object') {
            if(!resolvedModule[e.data.operation])
              emitError(new Error('Unknown operation: ' + e.data.operation))
            
            invokePromise = Promise.resolve(resolvedModule[e.data.operation].apply(resolvedModule, parameters))
          } else if (typeof resolvedModule === 'function') {
            invokePromise = Promise.resolve(resolvedModule.apply(resolvedModule, parameters))
          } else {
            emitError(new Error('Module exports must either be a function or an object'))
          }

          invokePromise
            .then(function(result) { emit({ result: result }) })
            .catch(emitError)

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