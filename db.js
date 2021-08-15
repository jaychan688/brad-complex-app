const dotenv = require('dotenv')
dotenv.config()

const { MongoClient } = require('mongodb')

// const dbName = 'complexApp'

MongoClient.connect(process.env.connectionString, function (err, client) {
	module.exports = client

	const app = require('./app')
	app.listen(process.env.PORT)
})
