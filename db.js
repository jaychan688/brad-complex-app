const dotenv = require('dotenv')
dotenv.config()
const colors = require('colors')
const { MongoClient } = require('mongodb')

// const dbName = 'complexApp'

MongoClient.connect(process.env.connectionString, function (err, client) {
	module.exports = client

	console.log(
		`MongoDB connected: ${client.options.srvHost}`.cyan.bold.underline
	)

	const app = require('./app')
	app.listen(
		process.env.PORT,
		console.log(
			`Server running in ${process.env.NODE_ENV} mode on port ${process.env.PORT}`
				.yellow.bold.underline
		)
	)
})
