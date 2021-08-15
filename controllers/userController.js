const User = require('../models/User')

exports.login = () => {}

exports.logout = () => {}

exports.register = (req, res) => {
	const user = new User(req.body)
	user.register()

	if (user.errors.length) {
		res.send(user.errors)
	} else {
		res.send('ok!')
	}
}

exports.home = (req, res) => {
	res.render('home-guest')
}
