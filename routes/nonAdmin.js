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
	let startDate = moment(req.body.startDate);
	let endDate = moment(req.body.endDate);
	let rentedDays = req.body.rentedDays;
	let excessHours = req.body.excessHours;
	let stripeToken = req.body.stripeToken;
	let stripeTokenType = req.body.stripeTokenType;
	let stripeEmail = req.body.stripeEmail;
	let user = req.user.name;

	if(!carId || !startDate || !endDate) {
		return res.status(500).json({
			"error": "Need to fill all fields"
		});
	}

	if(startDate.isBefore(moment()) || endDate.isBefore(moment())) {
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
				let proratedPrice = (pricePerDay / 24) * excessHours;
				let totalPrice = (((pricePerDay * rentedDays)) + proratedPrice) * 100;

				stripe.customers.create({
					name: user,
					email: stripeEmail,
					description: "KAREN customer",
					source: "tok_visa"
				})

				.then(customer => {
					stripe.charges.create({
						amount: totalPrice,
						currency: "php",
						source: customer.default_source,
						// description: `Charge for ${car.brandMod}, rented for ${rentedDays} day(s)`,
						customer: customer.id
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
							CarModel.findById(booking.carId)
							.then(car => {
								car.bookings.push(booking._id);
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
				"error": "Found conflict with selected dates."
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
		// Compare date and time now to booked startDate less 3 days
		if(moment().isSameOrAfter(moment(booking.schedDate.startDate).subtract(3, 'd'))) {
			// Throw error 422-Unprocessable Entity if  
			return res.status(422).json({
				"error": "Cannot cancel 3 days before scheduled start date."
			});
		}
		stripe.charges.retrieve(booking.chargeId)
		.then(charge => {
			stripe.refunds.create({
				charge: charge.id,
				reason: "requested_by_customer"
			})
			.then(refund => {
				BookingModel.create({
					customerId: req.user._id,
					carId: booking.carId,
					schedDate: {
						startDate: booking.startDate,
						endDate: booking.endDate
					},
					transactionDate: moment(),
					totalCharge: booking.totalCharge,
					transactionType: "Cancellation",
					chargeId: refund.id
				})
				return res.json(refund)
				.then(cancellation => {
					CarModel.findById(booking.carId)
					.then(car => {
						car.bookings.pull(booking._id);
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