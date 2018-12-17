'use strict'

const tmp = require('tmp')
const fs = require('fs-extra')

module.exports = async cb => {
	const dirname = await new Promise((resolve, reject) => {
		tmp.dir((err, dirname) => {
			if (err) {
				reject(err)
			} else {
				resolve(dirname)
			}
		})
	})
	try {
		await cb(dirname)
	} finally {
		await fs.remove(dirname)
	}
}
