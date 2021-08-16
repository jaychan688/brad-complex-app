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
	// make all error and success flash messages available from all templates
	res.locals.errors = req.flash('errors')
	res.locals.success = req.flash('success')

	// make current user id available on the req object
	if (req.session.user) {
		req.visitorId = req.session.user._id
	} else {
		req.visitorId = 0
	}
	// res.locals make user session data available from within view templates
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
