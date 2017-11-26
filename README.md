# parallel-module

This package makes offloading Javascript workloads to multiple CPU cores a breeze on Node.js and in the browser.

Simply write your modules as you normally would and the parallel-module loader creates a promise based version that
is automatically scaled across the available CPU cores. 