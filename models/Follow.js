const usersCollection = require('../db').db().collection('users')
const followsCollection = require('../db').db().collection('follows')
const ObjectId = require('mongodb').ObjectId
const User = require('./User')

const Follow = function (followedUsername, authorId) {
	this.followedUsername = followedUsername
	this.authorId = authorId
	this.errors = []
}

Follow.prototype.cleanUp = function () {
	if (typeof this.followedUsername != 'string') this.followedUsername = ''
}

Follow.prototype.validate = async function (action) {
	// followedUsername must exist in database
	const followedAccount = await usersCollection.findOne({
		username: this.followedUsername,
	})

	if (followedAccount) {
		this.followedId = followedAccount._id
	} else {
		this.errors.push('You cannot follow a user that does not exist.')
	}

	const doesFollowAlreadyExist = await followsCollection.findOne({
		followedId: this.followedId,
		authorId: new ObjectId(this.authorId),
	})

	if (action == 'create') {
		if (doesFollowAlreadyExist) {
			this.errors.push('You are already following this user.')
		}
	}

	if (action == 'delete') {
		if (!doesFollowAlreadyExist) {
			this.errors.push(
				'You cannot stop following someone you do not already follow.'
			)
		}
	}
	// should not be able to follow yourself
	if (this.followedId.equals(this.authorId)) {
		this.errors.push('You cannot follow yourself.')
	}
}

Follow.prototype.create = async function () {
	try {
		this.cleanUp()
		await this.validate('create')

		if (!this.errors.length) {
			return await followsCollection.insertOne({
				followedId: this.followedId,
				authorId: new ObjectId(this.authorId),
			})
		} else {
			return this.errors
		}
	} catch (error) {
		console.log(error)
	}
}

Follow.prototype.delete = async function () {
	try {
		this.cleanUp()
		await this.validate('delete')

		if (!this.errors.length) {
			return await followsCollection.deleteOne({
				followedId: this.followedId,
				authorId: new ObjectId(this.authorId),
			})
		}
		return this.errors
	} catch (error) {
		console.log(error)
	}
}

Follow.isVisitorFollowing = async (followedId, visitorId) => {
	const followDoc = await followsCollection.findOne({
		followedId,
		authorId: new ObjectId(visitorId),
	})

	if (followDoc) {
		return true
	} else {
		return false
	}
}

Follow.getFollowersById = async id => {
	try {
		let followers = await followsCollection
			.aggregate([
				{ $match: { followedId: id } },
				{
					$lookup: {
						from: 'users',
						localField: 'authorId',
						foreignField: '_id',
						as: 'userDoc',
					},
				},
				{
					$project: {
						username: { $arrayElemAt: ['$userDoc.username', 0] },
						email: { $arrayElemAt: ['$userDoc.email', 0] },
					},
				},
			])
			.toArray()

		return followers.map(function (follower) {
			const user = new User(follower, true)
			return { username: follower.username, avatar: user.avatar }
		})
	} catch (error) {
		console.log(error)
		reject()
	}
}

Follow.getFollowingById = async id => {
	try {
		let followers = await followsCollection
			.aggregate([
				{ $match: { authorId: id } },
				{
					$lookup: {
						from: 'users',
						localField: 'followedId',
						foreignField: '_id',
						as: 'userDoc',
					},
				},
				{
					$project: {
						username: { $arrayElemAt: ['$userDoc.username', 0] },
						email: { $arrayElemAt: ['$userDoc.email', 0] },
					},
				},
			])
			.toArray()

		return followers.map(follower => {
			const user = new User(follower, true)
			return { username: follower.username, avatar: user.avatar }
		})
	} catch (error) {
		console.log(error)
		reject()
	}
}

Follow.countFollowersById = async id => {
	try {
		return await followsCollection.countDocuments({
			followedId: id,
		})
	} catch (error) {
		console.log(error)
	}
}

Follow.countFollowingById = async id => {
	try {
		return await followsCollection.countDocuments({
			authorId: id,
		})
	} catch (error) {
		console.log(error)
	}
}

module.exports = Follow
