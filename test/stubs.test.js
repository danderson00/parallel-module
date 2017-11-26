var client = require('../src/client')
var api = require('../src/api')
var stubs = require('./workers/stubs')

// these things really shouldn't exist
// they will likely be removed

test("stubbed process returns result", () => 
  client(api.stub(stubs.process))
    .then(execute => execute(2))
    .then(result => expect(result).toBe(6))
)

test("stubbed api returns result", () =>
  client(api.stub(stubs.api), { parameter: 2 })
    .then(api => api.multiply(6))
    .then(result => expect(result).toBe(12))
)