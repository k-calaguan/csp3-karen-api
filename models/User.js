const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment');

const UserSchema = new Schema({
	name: String,
	email: String,
	password: String,
	dob: {type: Date, max: moment()},
	gender: String,
	contactNum: Number,
	homeAddress: String,
	isActive: {type: Boolean, default: true},
	isAdmin: {type: Boolean, default: false},
	created_at: {type: Date, default: moment()},
	updated_at: {type: Date, default: moment()}
});

module.exports = mongoose.model('User', UserSchema);