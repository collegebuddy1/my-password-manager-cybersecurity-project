var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var partials = require('express-partials');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var mongoose = require('mongoose');
var connection = mongoose.createConnection('mongodb://@localhost:27017/mypasswordmanager');
var models = require('./models');
var flash = require("flash");
var Enum = require('enum');

var routes = require('./routes/index');
var users = require('./routes/users');
var users_settings = require('./routes/users-settings');
var items = require('./routes/items');
var totp = require('./routes/totp');
var ajax = require('./routes/ajax');
var ajaxtotp = require('./routes/ajax-totp');

var app = express();

/*
 * Database
 */
connection.on('error', console.error.bind(console, 'connection error:'));
app.use(function(req, res, next) {
	req.models = {
		User: connection.model('User', models.User, 'users'),
		Item: connection.model('Item', models.Item, 'items'),
		Category: connection.model('Category', models.Category, 'categories'),
		Totp: connection.model('Totp', models.Totp, 'totps')
	};
	next();
});

/*
 * Sessions
 */
app.use(session({
	store: new FileStore(),
	secret: 'f8aYv9T1vb1749L',
	resave: true,
	saveUninitialized: false
}));

/*
 * Flash messages (must be after Sessions)
 */
app.use(flash());

/*
 * Enum
 */
app.use(function(req, res, next) {
	req.user_status = new Enum(["mustCreateMainPassword", "active"]);
	next();
});

// view engine setup
app.use(partials());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/*
 * CSS/JS
 */
app.use('/uikit', express.static(__dirname + '/bower_components/uikit/'));
app.use('/jquery', express.static(__dirname + '/bower_components/jquery/dist/'));
app.use('/angular', express.static(__dirname + '/bower_components/angular/'));
app.use('/clipboard', express.static(__dirname + '/bower_components/clipboard/dist/'));
app.use('/password-generator.min.js', express.static(__dirname + '/node_modules/jquery-password-generator-plugin/dist/jquery.jquery-password-generator-plugin.min.js'));

/*
 * User infos if connected
 */
app.use(function(req, res, next) {
	req.isTimeOver = false;
	res.locals.user_infos = null;
	if (req.session.user_id) {
		req.models.User.findOne({
				_id: req.session.user_id
			},
			'first_name _id status dateLastAction',
			function(err, user) {
				if (err) return console.error(err);
				res.locals.user_infos = user;
				res.locals.userIsActive = (user.status == req.user_status.active.value ? true : false);
				if (res.locals.userIsActive) {
					if (req.path == "/user/sign-up-step-3" || req.path == "/unlock") {
						user.dateLastAction = 0;
						user.save(function(err) {});
						next();
					} else {
						var difference = Date.now() - user.dateLastAction.getTime();
						var resultInMinutes = Math.round(difference / 60000);
						if (resultInMinutes >= 5) {
							req.isTimeOver = true;
							if (req.path.substring(0, 5) == "/ajax") {
								return res.send({
									"error": true,
									"message": "Your app is locked due to inactivity"
								});
							}
							if (req.path != "/unlock" && req.path != "/user/sign-out" && req.path != "/user/sign-up-step-3")
								return res.redirect("/unlock");
							next();
						} else {
							user.dateLastAction = Date.now();
							user.save(function(err) {});
							next();
						}
					}
				} else {
					if (res.locals.user_infos.status == req.user_status.mustCreateMainPassword.value && req.path != "/user/sign-up-step-2" && req.path != "/user/sign-out") {
						req.flash("warning", "You must set your main password to use this app");
						return res.redirect("/user/sign-up-step-2");
					}
					next();
				}
			});
	} else {
		if (req.path.substring(0, 5) == "/ajax") {
			return res.send({
				"error": true,
				"message": "You must be logged in to do this action"
			});
		}
		next();
	}
});

app.use('/', routes);
app.use('/item', items);
app.use('/totp', totp);
app.use('/user', users);
app.use('/user/settings', users_settings);
app.use('/ajax', ajax);
app.use('/ajax/totp', ajaxtotp);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});


module.exports = app;