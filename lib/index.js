'use strict'

function getCompilerFactory(options, webpack) {
	if (typeof options === 'function') {
		return async ctx => {
			const compiler = await options(ctx)
			return compiler instanceof webpack.Compiler ? compiler : webpack(compiler)
		}
	}
	if (options instanceof webpack.Compiler) {
		return () => options
	}
	if (options === null || typeof options !== 'object') {
		throw new TypeError('options.compiler must be a webpack compiler, an object or a function.')
	}
	return () => webpack(options)
}

module.exports = (options, webpack = require('webpack')) => {
	const compilerFactory = getCompilerFactory(options, webpack)
	return async ctx => {
		const compiler = await compilerFactory(ctx)
		return new Promise((resolve, reject) => {
			let handler = (err, stats) => {
				handler = (err, stats) => {
					if (err) {
						ctx.push(Promise.reject(err))
					} else {
						ctx.push(stats)
					}
				}
				if (err) {
					reject(err)
				} else {
					resolve(stats)
				}
			}

			if (compiler.options.watch) {
				const watcher = compiler.watch(compiler.options.watchOptions || {}, (e, s) => handler(e, s))
				ctx.on('dispose', () => new Promise(resolve => watcher.close(resolve)))
			} else {
				compiler.run(handler)
			}
		})
	}
}
