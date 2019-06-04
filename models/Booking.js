const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment');

const BookingSchema = new Schema({
	customerId: String,
	carId: String,
	schedDate: {
		startDate: {
			type: Date, 
			min: moment()
		},
		endDate: Date,
	},
	totalCharge: Number,
	transactionType: String,
	chargeId: String,
	created_at: {
		type: Date, 
		default: moment()
	},
	updated_at: {
		type: Date, 
		default: moment()
	}
});

module.exports = mongoose.model('Booking', BookingSchema);
