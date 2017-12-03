var host = require('./host')

module.exports = function (options) {
  var workers = []
  var availableWorkers = []
  var queuedRequests = []

  return createWorker().then(function (workerApi) {
    if(typeof workerApi === 'function')
      return createInvoker()
    else
      return Object.keys(workerApi).reduce(function (api, property) {
        api[property] = createInvoker(property)
        return api
      }, {})
      
    function createInvoker(property) {
      return function () {
        var args = Array.prototype.slice.apply(arguments)

        if(availableWorkers.length > 0) {
          return invokeApiFunction()
        } else if (workers.length < (options.poolSize || 2)) {
          return createWorker().then(invokeApiFunction)
        } else {
          return queueRequest()
        }

        function invokeApiFunction() {
          var worker = availableWorkers.shift()
          var workerFunction = property ? worker.api[property] : worker.api

          return workerFunction.apply(worker, args)
            .then(result => {
              availableWorkers.push(worker)
              executeQueuedRequest()
              return result
            })
            // need .finally...
            .catch(error => {
              availableWorkers.push(worker)
              executeQueuedRequest()
              throw error
            })
        }

        function executeQueuedRequest() {
          if(queuedRequests.length > 0 && availableWorkers.length > 0) {
            queuedRequests.shift()()
          }
        }

        function queueRequest() {
          return new Promise(function (resolve, reject) {
            queuedRequests.push(function () {
              invokeApiFunction().then(resolve).catch(reject)
            })
          })
        }
      }
    }
  })

  function createWorker() {
    var container = {
      worker: options.workerFactory
        ? options.workerFactory(options.workerPath)
        : new (options.workerConstructor)(options.workerPath)
    }
    workers.push(container)

    return host(container.worker, { parameter: options.parameter, includeEmit: options.includeEmit })
      .then(api => {
        container.api = api
        availableWorkers.push(container)
        return api
      })
  }
}
