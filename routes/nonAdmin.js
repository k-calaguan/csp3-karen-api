const express = require('express');
const router = express.Router();
const moment = require('moment');
const CarModel = require('../models/Car');
const BookingModel = require('../models/Booking');

const stripe = require('stripe')('sk_test_aRV6ULEAIhoxM9SNavifHdJt00pwYDuIAX');

// CARS CRUD --------------------------------------------------------
/* Index */
router.get('/cars', (req, res, next) => {
	CarModel.find({isActive: true})
	.then(cars => {
		return res.json(cars);
	})
	.catch(next)
})

router.get('/cars/:id', (req, res, next) => {
	CarModel.findById(req.params.id)
	.then(car => {
		return res.status(200).json({
			"data": car
		});
	})
	.catch(next)
})


// BOOKINGS CRUD --------------------------------------------------------
/* Index */
router.get('/bookings', (req, res, next) => {
	BookingModel.find({customerId: req.user._id})
	.then(bookings => {
		return res.json(bookings);
	})
	.catch(next)
});

/* Create */
router.post('/bookings', (req, res, next) => {
	let carId = req.body.carId;
	let startDate = moment(req.body.schedDate.startDate, "MM-DD-YYYY", true);
	let endDate = moment(req.body.schedDate.endDate, "MM-DD-YYYY", true);

	let rentedDays = (moment.duration(endDate.diff(startDate)).asDays());

	if(!carId || !startDate || !endDate) {
		return res.status(500).json({
			"error": "Need to fill all fields"
		});
	}

	if(startDate.isBefore(moment()) || startDate.isBefore(moment())) {
		return res.status(500).json({
			"error": "Cannot book on past dates"
		})
	}

	BookingModel.find({carId: carId})
	.then(bookings => {
		let count = 0;

		bookings.forEach(booking => {
			if(startDate.isSameOrAfter(booking.schedDate.startDate) && endDate.isSameOrBefore(booking.schedDate.endDate)) {
				count++;
			}

			if(startDate.isSame(booking.schedDate.endDate) || endDate.isSame(booking.schedDate.endDate)) {
				count++;
			}
		});

		if(count == 0) {
			CarModel.findById(carId)
			.then(car => {
				let pricePerDay = car.price;
				let totalPrice = (pricePerDay * rentedDays) * 100;

				stripe.customers.create({
					name: req.user.name,
					email: req.user.email,
					description: `Karen customer`,
					source:"tok_mastercard"
				})
				.then(customer => {
					stripe.charges.create({
						amount: totalPrice,
						currency: "php",
						source: "tok_mastercard",
						description: `Charge for ${car.brandMod}, rented for ${rentedDays} day(s)`,
					})
					.then(charges => {
						BookingModel.create({
							customerId: req.user._id,
							carId: carId,
							schedDate: {
								startDate: startDate,
								endDate: endDate
							},
							transactionDate: moment(),
							totalCharge: totalPrice,
							transactionType: "booking",
							chargeId: charges.id
						})
						.then(booking => {
							CarModel.findById(carId)
							.then(car => {
								car.bookings.push({carId: car._id});
								car.save();

								return res.status(200).json({
									"message": "Successfully rented a car",
									"data": booking
								});
							})
							.catch(next)
						})
						.catch(next)
					})
					.catch(next)
				})
				.catch(next)
			})
			.catch(next)
		} else {
			return res.status(500).json({
				"message": `Found conflict with selected dates`
			});
		}
	})
	.catch(next)
});

/* Show */
router.get('/bookings/:id', (req, res, next) => {
	BookingModel.findById(req.params.id)
	.then(booking => {
		return res.json(booking);
	})
	.catch(next)
});

/* Delete */
router.delete('/bookings/:id', (req, res, next) => {
	BookingModel.findById(req.params.id)
	.then(booking => {
		stripe.charges.retrieve(booking.chargeId)
		.then(charge => {
			stripe.refunds.create({
				charge: charge.id,
				reason: "Cancelled booking"
			})
			.then(refund => {
				return res.json(refund)
				BookingModel.create({
					customerId: req.user._id,
					carId: carId,
					schedDate: {
						startDate: startDate,
						endDate: endDate
					},
					transactionDate: moment(),
					totalCharge: totalPrice,
					transactionType: "cancellation",
					chargeId: charges.id
				})
				.then(booking => {
					CarModel.findById(booking.carId)
					.then(car => {
						car.bookings.pull({carId: car._id});
						car.save();

						return res.status(200).json({
							"message": "Successfully cancelled booking",
							"data": booking
						});
					})
					.catch(next)
				})
				.catch(next)
			})
			.catch(next)
		})
		.catch(next)
	})
	.catch(next)
});


/* Error Handling Middleware */
router.use((err, req, res, next) => {
	res.status(422).send({
		"error": err.message
	})
});

module.exports = router;