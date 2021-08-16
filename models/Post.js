const postsCollection = require('../db').db().collection('posts')
const ObjectId = require('mongodb').ObjectId
const sanitizeHTML = require('sanitize-html')
const User = require('./User')

const Post = function (data, userId) {
	this.data = data
	this.errors = []
	this.userId = userId
}

Post.prototype.cleanUp = function () {
	const { title, body } = this.data
	if (typeof title != 'string') title = ''
	if (typeof body != 'string') body = ''

	// get rid of any bogus properties
	this.data = {
		title: sanitizeHTML(title.trim(), {
			allowedTags: [],
			allowedAttributes: {},
		}),
		body: sanitizeHTML(body.trim(), { allowedTags: [], allowedAttributes: {} }),
		createdDate: new Date(),
		author: ObjectId(this.userId),
	}
}

Post.prototype.validate = function () {
	const { title, body } = this.data
	if (title == '') this.errors.push('You must provide a title.')
	if (body == '') this.errors.push('You must provide post content.')
}

Post.prototype.create = function () {
	return new Promise((resolve, reject) => {
		try {
			this.cleanUp()
			this.validate()
			if (!this.errors.length) {
				// save post into database
				postsCollection
					.insertOne(this.data)
					.then(() => {
						resolve()
					})
					.catch(() => {
						// some sort of db or server problems
						this.errors.push('Please try again later.')
						reject(this.errors)
					})
			} else {
				reject(this.errors)
			}
		} catch (error) {
			console.log(error)
		}
	})
}

Post.reusablePostQuery = function (uniqueOperations, visitorId) {
	return new Promise(async (resolve, reject) => {
		try {
			const aggOperations = uniqueOperations.concat([
				{
					$lookup: {
						// from users collection
						// match posts.author and users._id
						// output as a virtual field authorDocument
						// attach to posts collection
						from: 'users',
						localField: 'author',
						foreignField: '_id',
						as: 'authorDocument',
					},
				},
				{
					$project: {
						// spell out exactly what fields we want
						title: 1,
						body: 1,
						createdDate: 1,
						author: { $arrayElemAt: ['$authorDocument', 0] },
					},
				},
			])

			// aggregate let us run multiple operation
			// passing aggregate an array to perform database operation
			let posts = await postsCollection.aggregate(aggOperations).toArray()

			// clean up author property in each post object
			posts = posts.map(post => {
				post.author = {
					username: post.author.username,
					avatar: new User(post.author, true).avatar,
				}

				return post
			})

			resolve(posts)
		} catch (error) {
			console.log(error)
		}
	})
}

Post.findSingleById = function (id) {
	return new Promise(async (resolve, reject) => {
		try {
			if (typeof id != 'string' || !ObjectId.isValid(id)) {
				reject()
				return
			}

			const posts = await Post.reusablePostQuery([
				{ $match: { _id: new ObjectId(id) } },
			])

			if (posts.length) {
				// console.log(posts[0])
				// return first item th that array
				resolve(posts[0])
			} else {
				reject()
			}
		} catch (error) {
			console.log(error)
		}
	})
}

Post.findByAuthorId = function (authorId) {
	return Post.reusablePostQuery([
		{ $match: { author: authorId } },
		{ $sort: { createdDate: -1 } },
	])
}

module.exports = Post
