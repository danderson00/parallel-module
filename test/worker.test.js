var stub = require('../src/worker').stub
var host = require('../src/host')

test("an object client is returned for modules that export an API", () => {
  return host(stub({ hello: () => 'world' }))
    .then(api => {
      expect(Object.keys(api)).toEqual(['hello', 'terminate'])
      return api.hello()
    })
    .then(result => expect(result).toBe('world'))
})

test("a function client is returned for modules that export a function", () => {
  return host(stub(() => 'world' ))
    .then(api => api())
    .then(result => expect(result).toBe('world'))
})

test("initialisation is expected for an API worker when a parameter is supplied", () => {
  return host(stub(param => ({ hello: () => param + ' world' })), { parameter: 'hello' })
    .then(api => {
      expect(Object.keys(api)).toEqual(['hello', 'terminate'])
      return api.hello()
    })
    .then(result => expect(result).toBe('hello world'))
})

test("initialisation is expected for a function worker when a parameter is supplied", () => {
  return host(stub(param => () => param + ' world'), { parameter: 'hello' })
    .then(api => api())
    .then(result => expect(result).toBe('hello world'))
})

test("initialisation is expected for an API worker when includeEmit is specified", () => {
  return host(stub(emit => ({ hello: () => 'world' })), { includeEmit: true })
    .then(api => {
      expect(Object.keys(api)).toEqual(['hello', 'terminate'])
      return api.hello()
    })
    .then(result => expect(result).toBe('world'))
})

test("initialisation is expected for a function worker when includeEmit is specified", () => {
  return host(stub(emit => () => 'world'), { includeEmit: true })
    .then(api => api())
    .then(result => expect(result).toBe('world'))
})

test("parameter is the first initialisation argument when both parameter and includeEmit are specified", () => {
  return host(stub((param, emit) => ({ hello: () => param + ' world' })), { parameter: 'hello', includeEmit: true })
    .then(api => {
      expect(Object.keys(api)).toEqual(['hello', 'terminate'])
      return api.hello()
    })
    .then(result => expect(result).toBe('hello world'))
})

test("function workers can be invoked with multiple parameters", () => {
  return host(stub({ concat: (p1, p2) => p1 + p2 }))
    .then(api => api.concat('hello', 'world'))
    .then(result => expect(result).toBe('helloworld'))
})

test("function workers can be invoked with multiple parameters", () => {
  return host(stub((p1, p2) => p1 + p2 ))
    .then(api => api('hello', 'world'))
    .then(result => expect(result).toBe('helloworld'))
})