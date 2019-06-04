const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const appPassport = require('../passport');

router.post('/login', (req, res, next) => {
	passport.authenticate('local', {session:false}, (err, user, info) => {
		if (err) {
			// Throw Bad Request error
			return res.status(400).json({
				"error": "Something went wrong."
			});
		}

		if (!user) {
			// Throw Bad Request error
			return res.status(400).json({
				"error": "Incorrect email address or password."
			});
		}

		req.login(user, {session:false}, (err) => {
			if (err) {
				res.send(err);
			}
		})

		const token = jwt.sign(user.toJSON(), "secret", {expiresIn:"300m"});

		return res.status(200).json({
			"data": {
				"user": user,
				"token": token
			}
		})
	}) (req, res)
})

router.get('/logout', (req, res) => {
	req.logout();
	res.status(200).json({
		"status": "logout",
		"message": "You have been successfully logged out"
	})
})

module.exports = router;