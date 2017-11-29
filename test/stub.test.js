var host = require('../src/host')
var worker = require('../src/worker')
var stubs = require('./workers/stubs')

// these things really shouldn't exist
// they will likely be removed

test("stubbed process returns result", () => 
  host(worker.stub(stubs.process))
    .then(execute => execute(2))
    .then(result => expect(result).toBe(6))
)

test("stubbed api returns result", () =>
  host(worker.stub(stubs.api), { parameter: 2 })
    .then(api => api.multiply(6))
    .then(result => expect(result).toBe(12))
)

test("stubs can be created from worker paths", () => {
  return host(worker.stub(), { workerPath: require.resolve('./workers/standalone') })
    .then(api => api.multiply(6, 2))
    .then(result => expect(result).toBe(12))
})