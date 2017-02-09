
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var express = require('express');
var middleware = require('./middleware');
var routes = require('./routes');
var routes_socket = require('./routes-socket');
var http = require('http');
//var FacebookStrategy = require('passport-facebook').Strategy;
//var passport = require('passport');
//var customFacebook = require('./controllers/passport-facebook-custom');
var socialLogin = require('./controllers/social-login');
var app = express();
app.locals.fromNow = function(d) {
    var elapsed = Date.now() - new Date(d);

    var temp = {
        milliseconds: elapsed,
        seconds: Math.floor(elapsed / 1000),
        minutes: Math.floor(elapsed / (1000 * 60)),
        hours: Math.floor(elapsed / (1000 * 60 * 60)),
        days: Math.floor(elapsed / (1000 * 60 * 60 * 24))
    };

    if (temp.days >= 1) {
        if (temp.days == 1) {
            return temp.days + ' day ago';
        }
        return temp.days + ' days ago';
    }

    if (temp.hours >= 1) {
        if (temp.hours == 1) {
            return temp.hours + ' hour ago';
        }
        return temp.hours + ' hours ago';
    }

    if (temp.minutes >= 1) {
        if (temp.minutes == 1) {
            return temp.minutes + ' min ago';
        }
        return temp.minutes + ' mins ago';
    }

    return 'Just now';
};
/* Set mongoose debug to true for logs all mongoose operations on console */
//mongoose.set('debug', true);
// all environments
mongoose.connect('mongodb://127.0.0.1:27017/ScienceIsFunDb3', function (err) {
    if (err) throw err;
    /* All Middlewares  are placed in "middleware.js" file */
    middleware(app);
    /* All routes are placed in "routes.js" file */
    routes(app);

    var server = http.createServer(app).listen(app.get('port'), function() {
        console.log('Mongoose demo server listening on port ' + app.get('port'));
    });
	
	routes_socket(server);
});

