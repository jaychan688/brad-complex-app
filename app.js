const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const flash = require('connect-flash')
const dotenv = require('dotenv')
const morgan = require('morgan')
const router = require('./router')

const app = express()

dotenv.config()
// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'))
}

const sessionOption = session({
	secret: 'random charset',
	store: MongoStore.create({ client: require('./db') }),
	resave: false,
	saveUninitialized: false,
	cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true },
})

// req object have session property
app.use(sessionOption)
app.use(flash())

// Middle: run this function for every request
app.use((req, res, next) => {
	// res.locals avaliable for ejs engine
	res.locals.user = req.session.user
	next()
})
// req object have body property
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// It serves static files and is based on serve-static.
app.use(express.static('public'))
// A directory or an array of directories for the application's views.
app.set('views', 'views')
// Set template engine
app.set('view engine', 'ejs')

app.use('/', router)

module.exports = app
