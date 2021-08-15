const User = require('../models/User')

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
		res.render('home-dashboard', {
			username: req.session.user.username,
			avatar: req.session.user.avatar,
		})
	} else {
		res.render('home-guest', {
			errors: req.flash('errors'),
			regErrors: req.flash('regErrors'),
		})
	}
}
