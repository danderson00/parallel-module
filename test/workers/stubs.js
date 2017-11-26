module.exports = {
  process: (value, emit) => sleep(emit, 10, value * 3),
  api: multiplier => ({
    multiply: value => multiplier * value
  })
}

function sleep(emit, time, result) {
  emit('test')
  return new Promise((resolve) => setTimeout(() => resolve(result), time));
}