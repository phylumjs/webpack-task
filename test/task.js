'use strict'

const test = require('ava')
const path = require('path')
const fs = require('fs-extra')
const webpack = require('webpack')
const Pipeline = require('@phylum/pipeline')
const createTask = require('..')
const tmpdir = require('./_tmpdir')

function createTestConfig(output) {
	return {
		entry: path.join(__dirname, '_entry'),
		output: {
			path: output,
			filename: '[name].js'
		}
	}
}

test('config', t => tmpdir(async output => {
	const pipeline = new Pipeline(createTask(createTestConfig(output)))
	const stats = await pipeline.enable()
	t.true(stats instanceof webpack.Stats)
	t.pass()
}))

test('invalid config', t => {
	t.throws(() => createTask('foo'))
})

test('config with compiler', t => tmpdir(async output => {
	const pipeline = new Pipeline(createTask(webpack(createTestConfig(output))))
	const stats = await pipeline.enable()
	t.true(stats instanceof webpack.Stats)
	t.pass()
}))

test('config with function (return config)', t => tmpdir(async output => {
	const pipeline = new Pipeline(createTask(async ctx => {
		t.true(ctx instanceof Pipeline.Context)
		return createTestConfig(output)
	}))
	const stats = await pipeline.enable()
	t.true(stats instanceof webpack.Stats)
	t.pass()
}))

test('config with function (return compiler)', t => tmpdir(async output => {
	const pipeline = new Pipeline(createTask(async ctx => {
		t.true(ctx instanceof Pipeline.Context)
		return webpack(createTestConfig(output))
	}))
	const stats = await pipeline.enable()
	t.true(stats instanceof webpack.Stats)
	t.pass()
}))

test('watch', t => tmpdir(async output => {
	await tmpdir(async input => {
		const entry = path.join(input, 'entry.js')
		await fs.writeFile(entry, `console.log('a')`)
		await new Promise(resolve => setTimeout(resolve, 1000))

		const config = createTestConfig(output)
		config.entry = entry
		config.watch = true

		const pipeline = new Pipeline(createTask(config))
		pipeline.enable()
		const hashes = new Set()

		await new Promise((resolve, reject) => {
			const timeout = setTimeout(() => reject('Build timed out.'), 30000)
			timeout.unref()
			pipeline.on('resolve', stats => {
				t.true(stats instanceof webpack.Stats)
				hashes.add(stats.hash)
				if (hashes.size === 1) {
					fs.writeFile(entry, `console.log('b')`)
				}
				if (hashes.size === 2) {
					clearTimeout(timeout)
					resolve()
				}
			})
		})
		await pipeline.disable()
	})
	t.pass()
}))

test('custom webpack & watch (with errors)', async t => {
	class Compiler {
		constructor(config) {
			this.options = config
		}
		watch(watchOptions, cb) {
			setImmediate(() => {
				cb(new Error('foo'))
				setImmediate(() => {
					cb(new Error('bar'))
				})
			})
			return {
				close(cb) {
					setImmediate(cb)
				}
			}
		}
	}
	function webpack(config) {
		return new Compiler(config)
	}
	webpack.Compiler = Compiler

	const pipeline = new Pipeline(createTask({watch: true}, webpack))
	const err1 = await t.throwsAsync(pipeline.enable())
	t.is(err1.message, 'foo')
	await new Promise(setImmediate)
	const err2 = await t.throwsAsync(pipeline.enable())
	t.is(err2.message, 'bar')
})
