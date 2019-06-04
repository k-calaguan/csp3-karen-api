const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt-nodejs');

const UserModel = require('../models/User');


router.post('/register', (req, res) => {
	let name = req.body.name;
	let email = req.body.email;
	let password = req.body.password;
	let dob = req.body.dob;
	let gender = req.body.gender;
	let contactNum = req.body.contactNum;
	let homeAddress = req.body.homeAddress;

	if (!name || !email || !password || !dob || !gender || !contactNum || !homeAddress) {
		return res.status(500).json({
			"error": "Need to fill all fields"
		});
	}

	UserModel.find({"email":email})
	.then((user, err) => {
		if (err) {
			return res.status(500).json({
				"error": "Something went wrong while validating user's existence"
			});
		}

		if (user.length > 0) {
			return res.status(500).json({
				"error": "Email address already registered"
			});
		}

		UserModel.find({"contactNum":contactNum})
		.then((user, err) => {
			if (err) {
				return res.status(500).json({
					"error": "Something went wrong while validating user's existence"
				});
			}

			if (user.length > 0) {
				return res.status(500).json({
					"error": "Phone number already registered"
				});
			}

			bcrypt.genSalt(10, (err, salt) => {
				bcrypt.hash(password, salt, null, (err, hash) => {
					let newUser = UserModel({
						"name": name,
						"email": email,
						"password": hash,
						"dob": dob,
						"gender": gender,
						"contactNum": contactNum,
						"homeAddress": homeAddress
					});

					newUser.save((err) => {
						if (!err) {
							return res.json({
								"message": "Successfully registered",
								"data": newUser.email
							})
						} else {
							return res.json({
								"message": "Unable to save new user",
								"error": err
							})
						}
					})
				})
			})
		})
	})
});

module.exports = router;