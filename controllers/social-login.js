
fb = function() {
	var FacebookStrategy = require('passport-facebook').Strategy;
	var passport = require('passport');
	var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
	var googleapis = require('googleapis');
	var plus = googleapis.plus('v1');
	var configAuth = require('./social-login-auth');
	var bcrypt;
	if (/^win/.test(process.platform)) {
		bcrypt = require('bcryptjs');
	} else {
		bcrypt = require('bcrypt');
	}
	var async = require('async');
	var facebook = require('./social-friend-list');
	var express = require('express');
	var app = express();
	var UserModel = require('../models/users');
	var UpdateModel = require('../models/updates');
	var LogModel = require('../models/logs');

	
	// Passport session setup.
	//   To support persistent login sessions, Passport needs to be able to
	//   serialize users into and deserialize users out of the session.  Typically,
	//   this will be as simple as storing the user ID when serializing, and finding
	//   the user by ID when deserializing.  However, since this example does not
	//   have a database of user records, the complete Facebook profile is serialized
	//   and deserialized.
	passport.serializeUser(function(user, done) {
	  done(null, user);
	});

	passport.deserializeUser(function(obj, done) {
	  done(null, obj);
	});


	// Use the FacebookStrategy within Passport.
	//   Strategies in Passport require a `verify` function, which accept
	//   credentials (in this case, an accessToken, refreshToken, and Facebook
	//   profile), and invoke a callback with a user object.
	
	passport.use(new FacebookStrategy({
		clientID: configAuth.facebookAuth.clientID,
		clientSecret: configAuth.facebookAuth.clientSecret,
		callbackURL: configAuth.facebookAuth.callbackURL,
		profileFields: ['id', 'displayName', 'picture.type(large)', 'email'],
		auth_type: "reauthenticate"
	  },
	  
	  
	  // facebook will send back the token and profile
	function(accessToken, refreshToken, profile, done) {
		
		
		// asynchronous
		process.nextTick(function() {
			profile.accessToken = accessToken;
			profile.picture = profile.photos[0].value;
					
			/*facebook.get(accessToken, '/' + profile.id + '/permissions', function(data){
					console.log('FACEBOOK DATA');
					console.log(data);
			});*/
			facebook.get(accessToken, '/' + profile.id + '/permissions', function(data){
					console.log('FACEBOOK DATA');
					console.log(data);
			});
			console.log('PROFILE PICTURE');
			console.log(profile.picture);
			return done(null, profile);
			
		});

	}
	));

	
	
	// Authentication with google
	// =========================================================================
    // GOOGLE ==================================================================
    // =========================================================================
        passport.use(new GoogleStrategy({

        clientID: configAuth.googleAuth.clientID,
		clientSecret: configAuth.googleAuth.clientSecret,
		callbackURL: configAuth.googleAuth.callbackURL,
		profileFields: ['id', 'displayName', 'picture.type(large)', 'email'],

    },
	function(accessToken, refreshToken, profile, done) {
		// asynchronous verification, for effect...
		process.nextTick(function() {
			profile.accessToken = accessToken;
			profile.refreshToken = refreshToken;
			 console.log('PROFILE PICTURE');
			 console.log(profile);
			 return done(null, profile);
           
		});
	}));
	
}();
module.exports = fb;
