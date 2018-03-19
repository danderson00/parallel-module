module.exports = function(worker, options) {
  var nextId = (function(id) {
    return function() { 
      return ++id
    }
  })(0)

  var operations = {}

  worker.onmessage = function(e) {
    operations[e.data.id].messageHandler(e.data)
  }

  var initId = nextId()

  return attachSubscribeFunction(initId,
    execute(initId, { type: 'init', options: options })
      .then(function(result) {
        if(result.type === 'api') {
          var api = result.operations.reduce(function(api, operation) {
            api[operation] = function() {
              return execute(nextId(), { type: 'invoke', parameters: Array.prototype.slice.apply(arguments), operation: operation })
            }
            return api
          }, {})
          api.terminate = function() {
            worker.terminate() 
          }
          return api

        } else if (result.type === 'function') {
          var executeFunction = function() {
            return execute(nextId(), { type: 'invoke', parameters: Array.prototype.slice.apply(arguments) })            
          }
          executeFunction.terminate = function() {
            worker.terminate()
          }
          return executeFunction

        } else {
          throw new Error("Unrecognised response from server")
        }
      })
  )

  function execute(id, payload) {
    return attachSubscribeFunction(id, new Promise(function(resolve, reject) {
      operations[id] = {
        listeners: [],
        messageHandler: function(response) {
          // if the message has user content, we want to broadcast this to any registered listeners
          if(response.user) {
            operations[id].listeners.forEach(function(listener) { listener(response.user) })
          } else {
            // otherwise, assume the operation completed and resolve or reject the promise accordingly
            delete operations[id]
            if(response.error)
              reject(response.error)
            else
              resolve(response.result)
          }
        }
      }
      worker.postMessage(Object.assign({ id: id }, payload), extractArrayBuffers(payload.param))
    }))
  }

  function attachSubscribeFunction(id, target) {
    target.subscribe = function(callback) {
      operations[id].listeners.push(callback)
      return target
    }
    return target
  }

  function extractArrayBuffers(param) {
    if(!param)
      return

    if(param.constructor === ArrayBuffer)
      return [param]

    return Object.keys(param).reduce(function(buffers, property) {
      if(param[property] && param[property].constructor === ArrayBuffer) 
        buffers.push(param[property])
      return buffers
    }, [])
  }
}