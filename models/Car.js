const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment');

const BookingSchema = new Schema({bookingId: String});

const CarSchema = new Schema({
	brandMod: String,
	price: Number,
	modYear: Number,
	bodyType: String,
	transmission: String,
	engine: Number,
	fuelType: String,
	seats: Number,
	plateNum: String,
	image: String,
	isActive: Boolean,
	bookings: [BookingSchema],
	created_at: {
		type: Date, 
		default: moment()
	},
	updated_at: {
		type: Date, 
		default: moment()
	}
});

module.exports = mongoose.model('Car', CarSchema);