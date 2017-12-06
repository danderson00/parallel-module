var pool = require('../src/pool')
var stub = require('../src/worker').stub

test("executes single api calls", () => {
  return pool({ workerFactory: () => stub({ echo: value => value }) })
    .then(api => api.echo('test'))
    .then(result => expect(result).toBe('test'))
})

test("executes single function calls", () => {
  return pool({ workerFactory: () => stub(value => value) })
    .then(api => api('test'))
    .then(result => expect(result).toBe('test'))
})

test("executes mutiple async api calls", () => {
  return pool({ workerFactory: () => stub({ echo: value => echoDelayed(value) }) })
    .then(api => Promise.all(['test1', 'test2'].map(api.echo)))
    .then(result => expect(result).toEqual(['test1', 'test2']))
})

test("executes mutiple async function calls", () => {
  return pool({ workerFactory: () => stub(value => echoDelayed(value)) })
    .then(api => Promise.all(['test1', 'test2'].map(api)))
    .then(result => expect(result).toEqual(['test1', 'test2']))
})

test("creates a maximum of poolSize workers", () => {
  var workerCount = 0
  return pool({ 
    poolSize: 2,
    workerFactory: () => {
      workerCount++
      return stub({ echo: value => echoDelayed(value) }) }
    })
    .then(api => {
      expect(workerCount).toBe(1)
      return Promise.all(['test1', 'test2', 'test3'].map(api.echo))
    })
    .then(result => {
      expect(workerCount).toBe(2)
      expect(result).toEqual(['test1', 'test2', 'test3'])
    })
})

test("creates prewarm workers when pool is created", () => {
  var workerCount = 0
  return pool({ 
    poolSize: 3,
    prewarm: 2,
    workerFactory: () => {
      workerCount++
      return stub({ echo: value => echoDelayed(value) }) }
    })
    .then(result => expect(workerCount).toBe(2))
})

test("creates poolSize workers when pool is created if prewarm is set to 'all'", () => {
  var workerCount = 0
  return pool({ 
    poolSize: 2,
    prewarm: 'all',
    workerFactory: () => {
      workerCount++
      return stub({ echo: value => echoDelayed(value) }) }
    })
    .then(result => expect(workerCount).toBe(2))
})

// too flaky...
// test("values resolve in the order expected", () => {
//   var results = []
//   return pool({ 
//     poolSize: 3,
//     prewarm: 1,
//     workerFactory: () => stub({ delay: value => echoDelayed(value, value) })
//   })
//     .then(api => Promise.all([40, 5, 10, 10, 40, 5].map((value, index) => {
//       return api.delay(value).then(result => results.push(index))
//     })))
//     .then(() => expect(results).toEqual([1, 2, 3, 5, 0, 4]))
// })

function echoDelayed(value, delay) {
  return new Promise((resolve) => setTimeout(() => resolve(value), delay || 10))
}