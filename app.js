const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const flash = require('connect-flash')
const dotenv = require('dotenv')
const morgan = require('morgan')
const sanitizeHTML = require('sanitize-html')
const markdown = require('marked')
const csrf = require('csurf')

const router = require('./router')

const app = express()

// req object have body property
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use('/api', require('./router-api'))

dotenv.config()
// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'))
}

const sessionMiddleware = session({
	secret: 'random charset',
	store: MongoStore.create({ client: require('./db') }),
	resave: false,
	saveUninitialized: false,
	cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true },
})

// register middleware in Express, req object have session property
app.use(sessionMiddleware)
app.use(flash())

// Middle: run this function for every request
app.use((req, res, next) => {
	// make our markdown function available from within ejs templates
	res.locals.filterUserHTML = content => {
		return sanitizeHTML(markdown(content), {
			allowedTags: [
				'p',
				'br',
				'ul',
				'ol',
				'li',
				'strong',
				'bold',
				'i',
				'em',
				'h1',
				'h2',
				'h3',
				'h4',
				'h5',
				'h6',
			],
			allowedAttributes: {},
		})
	}

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

// It serves static files and is based on serve-static.
app.use(express.static('public'))
// A directory or an array of directories for the application's views.
app.set('views', 'views')
// Set template engine
app.set('view engine', 'ejs')

// Cookie Security, Cross site request forgery (csrf)
app.use(csrf())

app.use((req, res, next) => {
	res.locals.csrfToken = req.csrfToken()
	next()
})

app.use('/', router)

app.use((err, req, res, next) => {
	if (err) {
		if (err.code == 'EBADCSRFTOKEN') {
			req.flash('errors', 'Cross site request forgery detected.')
			req.session.save(() => res.redirect('/'))
		} else {
			res.render('404')
		}
	}
})

const server = require('http').createServer(app)
const io = require('socket.io')(server)

// register middleware in Socket.IO
io.use((socket, next) => {
	sessionMiddleware(socket.request, {}, next)
	// sessionMiddleware(socket.request, socket.request.res, next);
	// will not work with websocket-only connections, as 'socket.request.res'
	// will be undefined in that case
})

// the parameter socket represents the connection between server and browser
io.on('connection', socket => {
	if (socket.request.session.user) {
		const user = socket.request.session.user

		socket.emit('welcome', { username: user.username, avatar: user.avatar })

		// the chatMessageFromBrowser event are created in fontend,
		// we can create as many different types of events as we want
		socket.on('chatMessageFromBrowser', data => {
			socket.broadcast.emit('chatMessageFromServer', {
				message: sanitizeHTML(data.message, {
					allowedTags: [],
					allowedAttributes: {},
				}),
				username: user.username,
				avatar: user.avatar,
			})
		})
	}
})

module.exports = server
