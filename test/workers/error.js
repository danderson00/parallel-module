require('../../src/worker')(type => {
  if(type === 'error')
    throw new Error('test')
  return Promise.reject({ code: 'test' })
})
