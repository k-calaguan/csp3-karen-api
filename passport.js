const passport = require('passport');
const passportJWT = require('passport-jwt');
const ExtractJWT = passportJWT.ExtractJwt;
const LocalStrategy = require('passport-local').Strategy;
const JWTStrategy = passportJWT.Strategy;

const UserModel = require('./models/User');
const bcrypt = require('bcrypt-nodejs');

passport.serializeUser((user, done) => {
	done(null, user._id)
});

passport.deserializeUser((user, done) => {
	done(null, user._id)
});

passport.use(new LocalStrategy({usernameField:"email"}, (email, password, done) => {
	UserModel.findOne({"email":email})
	.then((user) => {
		if (!user) {
			return done(null, false, {"message": "no match found"});
		}

		if (email == user.email) {
			if (!bcrypt.compareSync(password, user.password)) {
				return done(null, false, {"message": "Wrong password"});
			} else {
				return done(null, user);
			}
		}

		return done(null, false, {"message": "Something went wrong"});
	})
}))

passport.use(new JWTStrategy({
	jwtFromRequest:ExtractJWT.fromAuthHeaderAsBearerToken(), 
	secretOrKey: "secret"
},
(jwtPayload, cb) => {
	if (jwtPayload) {
		return cb(null, jwtPayload);
	}
}
))