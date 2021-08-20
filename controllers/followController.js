const Follow = require('../models/Follow')

exports.addFollow = async (req, res) => {
	const follow = new Follow(req.params.username, req.visitorId)

	const results = await follow.create()

	if (results.insertedId) {
		req.flash('success', `Successfully followed ${req.params.username}`)
		req.session.save(() => res.redirect(`/profile/${req.params.username}`))
	} else {
		results.forEach(error => {
			req.flash('errors', error)
		})
		req.session.save(() => res.redirect('/'))
	}
}

exports.removeFollow = async (req, res) => {
	const follow = new Follow(req.params.username, req.visitorId)

	const results = await follow.delete()

	if (results.deletedCount) {
		req.flash(
			'success',
			`Successfully stopped following ${req.params.username}`
		)
		req.session.save(() => res.redirect(`/profile/${req.params.username}`))
	} else {
		results.forEach(error => {
			req.flash('errors', error)
		})
		req.session.save(() => res.redirect('/'))
	}
}
