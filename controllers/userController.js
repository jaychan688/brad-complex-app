const User = require('../models/User')
const Post = require('../models/Post')
const Follow = require('../models/Follow')

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

exports.home = async (req, res) => {
	if (req.session.user) {
		// fetch feed of posts for current user
		const posts = await Post.getFeed(req.session.user._id)

		res.render('home-dashboard', { posts })
	} else {
		res.render('home-guest', { regErrors: req.flash('regErrors') })
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

exports.sharedProfileData = async (req, res, next) => {
	let isVisitorsProfile = false
	let isFollowing = false

	// if the current visitor is login in
	if (req.session.user) {
		isVisitorsProfile = req.profileUser._id.equals(req.session.user._id)
		// check to see is this visitor follwing the current profile
		isFollowing = await Follow.isVisitorFollowing(
			req.profileUser._id,
			req.visitorId
		)
	}

	req.isVisitorsProfile = isVisitorsProfile
	// store isVisitorsProfile(boolean) to the req object
	// so we can use it within next function for this route
	req.isFollowing = isFollowing

	// retrieve post, follower, and following counts
	let postCountPromise = Post.countPostsByAuthor(req.profileUser._id)
	let followerCountPromise = Follow.countFollowersById(req.profileUser._id)
	let followingCountPromise = Follow.countFollowingById(req.profileUser._id)

	const [postCount, followerCount, followingCount] = await Promise.all([
		postCountPromise,
		followerCountPromise,
		followingCountPromise,
	])

	req.postCount = postCount
	req.followerCount = followerCount
	req.followingCount = followingCount

	next()
}

exports.profilePostsScreen = (req, res) => {
	// ask our post model for posts by a certain author id
	Post.findByAuthorId(req.profileUser._id)
		.then(posts => {
			res.render('profile', {
				title: `Profile for ${req.profileUser.username}`,
				currentPage: 'posts',
				posts,
				profileUsername: req.profileUser.username,
				profileAvatar: req.profileUser.avatar,
				isFollowing: req.isFollowing,
				isVisitorsProfile: req.isVisitorsProfile,
				counts: {
					postCount: req.postCount,
					followerCount: req.followerCount,
					followingCount: req.followingCount,
				},
			})
		})
		.catch(() => {
			res.render('404')
		})
}

exports.profileFollowersScreen = async (req, res) => {
	try {
		const followers = await Follow.getFollowersById(req.profileUser._id)

		res.render('profile-followers', {
			currentPage: 'followers',
			followers,
			profileUsername: req.profileUser.username,
			profileAvatar: req.profileUser.avatar,
			isFollowing: req.isFollowing,
			isVisitorsProfile: req.isVisitorsProfile,
			counts: {
				postCount: req.postCount,
				followerCount: req.followerCount,
				followingCount: req.followingCount,
			},
		})
	} catch (error) {
		console.log('Error ', error)
		res.render('404')
	}
}

exports.profileFollowingScreen = async (req, res) => {
	try {
		const following = await Follow.getFollowingById(req.profileUser._id)

		res.render('profile-following', {
			currentPage: 'following',
			following: following,
			profileUsername: req.profileUser.username,
			profileAvatar: req.profileUser.avatar,
			isFollowing: req.isFollowing,
			isVisitorsProfile: req.isVisitorsProfile,
			counts: {
				postCount: req.postCount,
				followerCount: req.followerCount,
				followingCount: req.followingCount,
			},
		})
	} catch (error) {
		console.log(error)
		res.render('404')
	}
}
