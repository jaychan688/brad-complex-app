const Post = require('../models/Post')

exports.viewCreateScreen = (req, res) => {
	res.render('create-post')
}

exports.create = (req, res) => {
	const post = new Post(req.body, req.session.user._id)
	post
		.create()
		.then(() => {
			res.send('post ok!')
		})
		.catch(errors => {
			res.send(errors)
		})
}

exports.viewSingle = async (req, res) => {
	try {
		const post = await Post.findSingleById(req.params.id, req.visitorId)
		// console.log(post)
		const {
			_id: id,
			title,
			body,
			createdDate,
			isVisitorOwner,
			author: { username, avatar },
		} = post

		res.render('single-post-screen', {
			id,
			title,
			body,
			createdDate,
			username,
			avatar,
			isVisitorOwner,
		})
	} catch {
		res.render('404')
	}
}

exports.viewEditScreen = async (req, res) => {
	try {
		const post = await Post.findSingleById(req.params.id, req.visitorId)
		const { _id: id, title, body } = post
		res.render('edit-post', { id, title, body })
	} catch {
		res.render('404')
	}
}

exports.edit = (req, res) => {
	const post = new Post(req.body, req.visitorId, req.params.id)
	post
		.update()
		.then(status => {
			// the post was successfully updated in the database
			// or user did have permission, but there were validation errors
			if (status == 'success') {
				// post was updated in db
				req.flash('success', 'Post successfully updated.')
				req.session.save(() => {
					res.redirect(`/post/${req.params.id}/edit`)
				})
			} else {
				post.errors.forEach(error => {
					req.flash('errors', error)
					req.session.save(() => {
						res.redirect(`/post/${req.params.id}/edit`)
					})
				})
			}
		})
		.catch(() => {
			// the post was successfully updated in the database
			// or user did have permission, but there were validation errors
			req.flash('errors', 'You do not have permission to perform that action.')
			req.session.save(() => {
				res.redirect('/')
			})
		})
}
