const express = require('express');
const router = express.Router();
const moment = require('moment');
const async = require('async');
const UserModel = require('../models/User');
const CarModel = require('../models/Car');
const BookingModel = require('../models/Booking');


// USERS CRUD --------------------------------------------------------
/* Index */
router.get('/users', (req, res, next) => {
	UserModel.find({})
	.then(users => {
		return res.json(users);
	})
	.catch(next)
});

/* Show */
router.get('/users/:id', (req, res, next) => {
	UserModel.findById(req.params.id)
	.then(user => {
		return res.json(user);
	})
	.catch(next)
});

/* Update */
router.put('/users/:id', (req, res, next) => {
	UserModel.findOneAndUpdate(req.params.id, req.body, {useFindAndModify: false})
	.then(user => {
		UserModel.updateOne({updated_at: moment()})
		.then(() => {
			return res.status(200).json({
				"message": "User details has been updated",
				"data": user
			});
		})
		.catch(next)
	})
	.catch(next)
});

/* Delete */
router.delete('/users/:id', (req, res, next) => {
	UserModel.findOneAndUpdate(req.params.id, {updated_at: moment(), isActive: false}, {useFindAndModify: false})
	.then(user => {
		return res.status(200).json({
			"message": "Account has been disabled",
			"data": user
		});
	})
	.catch(next)
});



// CARS CRUD --------------------------------------------------------
/* Index */
router.get('/cars', (req, res, next) => {
	CarModel.find({})
	.then(cars => {
		return res.json(cars);
	})
});

/* Show */
router.get('/cars/:id', (req, res, next) => {
	CarModel.findById(req.params.id)
	.then(car => {
		return res.json(car);
	})
	.catch(next)
});

/* Store */
router.post('/cars', (req, res, next) => {
	let brandMod = req.body.brandMod;
	let price = req.body.price;
	let modYear = req.body.modYear;
	let bodyType = req.body.bodyType;
	let transmission = req.body.transmission;
	let engine = req.body.engine;
	let fuelType = req.body.fuelType;
	let seats = req.body.seats;
	let plateNum = req.body.plateNum;
	let image = req.body.image;
	let isActive = req.body.isActive;

	if(!brandMod || !price || !modYear || !bodyType || !transmission || !engine || !fuelType || !seats || !plateNum || !image || !isActive) {
		return res.status(500).json({
			"message": "Please fill all fields"
		});
	}

	CarModel.find({"plateNum": plateNum})
	.then((car, err) => {
		if(err) {
			return res.status(500).json({
				"message": "An error occurred when checking for duplicates"
			});
		}

		if(car.length > 0) {
			return res.status(409).json({
				"error": "Plate number already exists"
			})
		}

		CarModel.create(req.body)
		.then(car => {
			return res.status(200).json({
				"message": `Successfully registered ${brandMod} - ${plateNum}`,
				"data": car
			});
		})
		.catch(next)
	})
});

/* Update */
router.put('/cars/:id', (req, res, next) => {
	CarModel.findOneAndUpdate(req.params.id, req.body, {new: true})
	.then(car => {
		CarModel.updateOne({updated_at: moment()})
		.then(() => {
			return res.status(200).json({
				"message": `Vehicle updated successfully`,
				"data": car
			})
		})
		.catch(next)
	})
	.catch(next)
});

/* Delete */
router.delete('/cars/:id', (req, res, next) => {
	CarModel.findOneAndUpdate(req.params.id, {isActive: false, updated_at: moment()}, {new: true})
	.then(car => {
		return res.status(200).json({
			"message": `Vehicle has been disabled`,
			"data": car
		})
	})
	.catch(next)
});



// BOOKINGS CRUD --------------------------------------------------------
/* Index */
router.get('/bookings', (req, res, next) => {
	BookingModel.find({})
	.populate('carId')
	.populate('customerId')
	.then(bookings => {
		return res.status(200).json(bookings)
	})
	.catch(next)
});


/* Error Handling Middleware */
router.use((err, req, res, next) => {
	res.status(422).send({
		error: err.message
	})
});

module.exports = router;
