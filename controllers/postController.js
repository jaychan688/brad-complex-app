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
		const post = await Post.findSingleById(req.params.id)

		const {
			title,
			body,
			createdDate,
			author: { username, avatar },
		} = post

		res.render('single-post-screen', {
			title,
			body,
			createdDate,
			username,
			avatar,
		})
	} catch {
		res.render('404')
	}
}
