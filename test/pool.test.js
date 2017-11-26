var pool = require('../src/pool')
var stub = require('../src/api').stub

test("executes single calls", () => {
  return pool({ workerFactory: () => stub(() => ({ echo: value => value })) })
    .then(api => api.echo('test'))
    .then(result => expect(result).toBe('test'))
})

test("executes mutiple async calls", () => {
  return pool({ workerFactory: () => stub(() => ({ echo: value => echoDelayed(value) })) })
    .then(api => Promise.all(['test1', 'test2'].map(api.echo)))
    .then(result => expect(result).toEqual(['test1', 'test2']))
})

test("creates a maximum of poolSize workers", () => {
  var workerCount = 0
  return pool({ 
    poolSize: 2,
    workerFactory: () => {
      workerCount++
      return stub(() => ({ echo: value => echoDelayed(value) })) }
    })
    .then(api => Promise.all(['test1', 'test2', 'test3'].map(api.echo)))
    .then(result => {
      expect(result).toEqual(['test1', 'test2', 'test3'])
      expect(workerCount).toBe(2)
    })
})

test("values resolve in the order expected", () => {
  var results = []
  return pool({ 
    poolSize: 3,
    workerFactory: () => stub(() => ({ delay: value => echoDelayed(value, value) })) })
    .then(api => Promise.all([25, 5, 10, 10, 15, 5].map((value, index) => {
      return api.delay(value).then(result => results.push(index))
    })))
    .then(() => expect(results).toEqual([1, 2, 3, 5, 0, 4]))
})

function echoDelayed(value, delay) {
  return new Promise((resolve) => setTimeout(() => resolve(value), delay || 10))
}