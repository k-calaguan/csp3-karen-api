const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const passport = require('passport');

const keyPublishable = process.env.PUBLISHABLE_KEY;
const keySecret = process.env.SECRET_KEY;

mongoose.connect("mongodb+srv://admin_tan:tan1234@cluster0-jnmeg.mongodb.net/ipapamoveDB?retryWrites=true", { useNewUrlParser: true });

const app = express();

require("./passport");

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const port = process.env.PORT || 3000;

app.listen(port, () => {
	console.log(`Server running at port ${port}`);
})

const reg = require('./routes/register');
app.use('/', reg);

const auth = require('./routes/auth');
app.use('/auth', auth);

// middleware for verifying if authenticated user is admin
function verifyAdmin(req, res, next){
	const isAdmin = req.user.isAdmin;

	if (isAdmin == true) {
		next();
	} else {
		res.redirect(403, '/');
	}
};

// middleware for verifying if authenticated user is non-admin
function verifyNonAdmin(req, res, next){
	const isAdmin = req.user.isAdmin;

	if (isAdmin == false) {
		next();
	} else {
		res.redirect(403, '/');
	}
};

// admin users
const admin = require('./routes/admin');
app.use('/admin', [passport.authenticate("jwt", {session: false}), verifyAdmin], admin);

// non-admin users
const nonAdmin = require('./routes/nonAdmin');
app.use('/', [passport.authenticate("jwt", {session: false}), verifyNonAdmin], nonAdmin);
