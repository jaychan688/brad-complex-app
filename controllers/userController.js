const User = require('../models/User')
const Post = require('../models/Post')

exports.mustBeLoggedIn = (req, res, next) => {
	if (req.session.user) {
		next()
	} else {
		req.flash('errors', 'You must Logged in to perform that action.')
		req.session.save(() => {
			res.redirect('/')
		})
	}
}

exports.login = (req, res) => {
	const user = new User(req.body)

	user
		.login()
		.then(() => {
			// After login, set username to session, thus can across multi page and
			// still have persist data
			req.session.user = {
				username: user.data.username,
				avatar: user.avatar,
				_id: user.data._id,
			}
			req.session.save(() => {
				res.redirect('/')
			})
		})
		.catch(err => {
			// Set a flash message by passing the key, followed by the value, to req.flash().
			// req.session.flash.errors = [err]
			req.flash('errors', err)
			req.session.save(() => {
				res.redirect('/')
			})
		})
}

exports.logout = (req, res) => {
	req.session.destroy(() => {
		res.redirect('/')
	})
}

exports.register = (req, res) => {
	const user = new User(req.body)
	user
		.register()
		.then(() => {
			req.session.user = {
				username: user.data.username,
				avatar: user.avatar,
				_id: user.data._id,
			}
			req.session.save(() => {
				res.redirect('/')
			})
		})
		.catch(regErrors => {
			regErrors.forEach(error => {
				req.flash('regErrors', error)
			})
			req.session.save(() => {
				res.redirect('/')
			})
		})
}

exports.home = (req, res) => {
	if (req.session.user) {
		res.render('home-dashboard')
	} else {
		res.render('home-guest', {
			regErrors: req.flash('regErrors'),
		})
	}
}

exports.ifUserExists = (req, res, next) => {
	User.findByUsername(req.params.username)
		.then(userDocument => {
			req.profileUser = userDocument
			next()
		})
		.catch(() => {
			res.render('404')
		})
}

exports.profilePostsScreen = (req, res) => {
	const { _id, username, avatar } = req.profileUser
	// ask our post model for posts by a certain author id
	Post.findByAuthorId(_id)
		.then(posts => {
			res.render('profile', { _id, username, avatar, posts })
		})
		.catch(() => {
			res.render('404')
		})
}
