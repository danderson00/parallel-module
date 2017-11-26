var Worker = require('tiny-worker')
var client = require('../src/client')
var setup = require('./setup')
var path = require('path')
var worker

beforeAll(setup)
afterEach(() => worker.terminate())
var createWorker = name => worker = new Worker(path.join(__dirname, `build/${name}.js`))

test("synchronous function returns result", () =>
  client(createWorker('sync'))
    .then(getResult => getResult(2))
    .then(result => expect(result).toBe(4))
)

test("asynchronous function returns result", () =>
  client(createWorker('async'))
    .then(getResult => getResult(2))
    .then(result => expect(result).toBe(6))
)

test("thrown errors are flowed", () => 
  client(createWorker('error'))
    .then(getResult => getResult('error'))
    .then(() => { throw new Error('Error did not flow') })
    .catch(error => expect(error.message).toBe('test'))
)

test("promise rejections are flowed", () =>
  client(createWorker('error'))
    .then(getResult => getResult())
    .then(() => { throw new Error('Promise rejection did not flow') })
    .catch(error => expect(error).toEqual({ code: 'test' }))
)

test("emit from function can be subscribed to", () => {
  var emits = []
  return client(createWorker('emit'))
    .then(getResult => getResult().subscribe(data => emits.push(data)))
    .then(result => {
      expect(emits).toEqual(['stage 1', { stage: 2 }])
      expect(result).toBe('complete')
    })
})