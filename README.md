# Webpack Task
[![Coverage Status](https://coveralls.io/repos/github/phylumjs/webpack-task/badge.svg?branch=master)](https://coveralls.io/github/phylumjs/webpack-task?branch=master)
[![Build Status](https://travis-ci.org/phylumjs/webpack-task.svg?branch=master)](https://travis-ci.org/phylumjs/webpack-task)
![Version](https://img.shields.io/npm/v/@phylum/webpack-task.svg)
![License](https://img.shields.io/npm/l/@phylum/webpack-task.svg)

A pipeline task that bundles code using webpack.

## Installation
```bash
npm i @phylum/webpack-task webpack
```
*Supported webpack versions range from 3.11.0 to 4.x.x*

## Usage
```js
const createWebpackTask = require('@phylum/webpack-task')

// Create a new pipeline task:
const webpackTask = createWebpackTask(config[, webpack])
```
+ config `<webpack.Compiler> | <object> | <function>` - This can be a webpack compiler, a webpack config or a function that creates one of these.
	+ ctx `<Context>` - The pipeline context of the webpack task is passed with the first argument.
	+ return `<webpack.Compiler> | <object> | <Promise>` - Return a webpack compiler, config or a promise that resolves to one of these.
+ webpack `<webpack>` - Optional. Specify a specific webpack module to use instead of the default installed one.

### Integration
The webpack task can be used like a pipeline task.<br/>
It will resolve to the webpack stats emitted by the compiler. In case of a critical compiler error, the task will reject with that error.
```js
const webpackTask = createWebpackTask({
	// Webpack config...
})

async function myTask(ctx) {
	const stats = await ctx.use(webpackTask)
}
```

### Passing custom options
To customize the webpack configuration based on pipeline data, pass a function with the config argument:
```js
// For instance, set the mode:
const webpackTask = createWebpackTask(async ctx => {
	return {
		mode: ctx.pipeline.data.mode,
		watch: ctx.pipeline.data.watch
		// webpack config...
	}
})

const pipeline = new Pipeline(webpackTask)
pipeline.data.mode = 'development'
pipeline.data.watch = true
```

### Watch mode
To enable watch mode use [webpack's watch options](https://webpack.js.org/configuration/watch/). Each time, an updates is emitted, the task will push a new state.
