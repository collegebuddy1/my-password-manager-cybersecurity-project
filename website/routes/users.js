var express = require('express');
var router = express.Router();
var forms = require('../forms');
var CryptoJS = require("crypto-js");


router.get('/sign-up', function(req, res, next) {
	if (req.session.user_id) {
		req.flash("warning", "You are already signed in");
		return res.redirect("/");
	}
	var form = forms.form_sign_up;

	res.render('user/sign-up', {
		title: 'Sign up',
		myForm: form,
		uikitFieldHorizontal: forms.uikitFieldHorizontal
	});
});

router.post('/sign-up', function(req, res, next) {
	if (req.session.user_id) {
		req.flash("warning", "You are already signed in");
		return res.redirect("/");
	}
	var form = forms.form_sign_up;
	form.handle(req, {
		success: function(form) {
			req.models.User.findOne({
				email: form.data.email
			}, function(err, user) {
				if (err) return console.error(err);
				if (user === null) {
					var new_user = new req.models.User({
						first_name: form.data.first_name,
						last_name: form.data.last_name,
						email: form.data.email,
						password: CryptoJS.SHA1(form.data.password).toString(),
						status: req.user_status.mustCreateMainPassword.value,
						dateLastAction: Date.now(),
						main_password: ""
					});
					new_user.save(function(err) {
						if (err) return console.error(err);
						req.session.user_id = new_user._id;
						req.flash("success", "Your account has been created");
						res.redirect("/user/sign-up-step-2");
					});
				} else {
					req.flash("danger", "This email is already used");
					res.render('user/sign-up', {
						title: 'Sign up',
						myForm: form,
						uikitFieldHorizontal: forms.uikitFieldHorizontal
					});
				}
			})
		},
		error: function(form) {
			req.flash("danger", "The form contains errors");
			res.render('user/sign-up', {
				title: 'Sign up',
				myForm: form,
				uikitFieldHorizontal: forms.uikitFieldHorizontal
			});
		},
		empty: function(form) {
			res.render('user/sign-up', {
				title: 'Sign up',
				myForm: form,
				uikitFieldHorizontal: forms.uikitFieldHorizontal
			});
		}
	});
});

router.get('/sign-up-step-2', function(req, res, next) {
	if (!req.session.user_id) {
		req.flash("danger", "You must be logged in to access this page");
		return res.redirect("/user/sign-in");
	} else {
		if (res.locals.user_infos.status != req.user_status.mustCreateMainPassword.value) {
			req.flash("warning", "You do not have the permission to access this page");
			return res.redirect("/");
		}
	}
	var form = forms.form_create_main_password;

	res.render('user/sign-up-step-2', {
		title: 'Create your main password',
		myForm: form,
		uikitFieldHorizontal: forms.uikitFieldHorizontal
	});
});

router.post('/sign-up-step-2', function(req, res, next) {
	if (!req.session.user_id) {
		req.flash("danger", "You must be logged in to access this page");
		return res.redirect("/user/sign-in");
	} else {
		if (res.locals.user_infos.status != req.user_status.mustCreateMainPassword.value) {
			req.flash("warning", "You do not have the permission to access this page");
			return res.redirect("/");
		}
	}
	var form = forms.form_create_main_password;
	form.handle(req, {
		success: function(form) {
			var generatePassword = require("password-maker");

			// Private key, never known
			var private_key = generatePassword(32);

			var main_password = CryptoJS.AES.encrypt(private_key, form.data.password);
			var unlocked_token = CryptoJS.AES.encrypt('unlocked', private_key);

			req.models.User.findOne({
				_id: req.session.user_id
			}, function(err, user) {
				if (err) return console.error(err);
				user.main_password = main_password;
				user.unlocked_token = unlocked_token;
				user.status = req.user_status.active.value;
				user.save(function(err) {
					if (err) return console.error(err);
					req.flash("success", "Your main password has been set");
					res.redirect("/user/sign-up-step-3");
				});
			});
		},
		error: function(form) {
			req.flash("danger", "The form contains errors");
			res.render('user/sign-up-step-2', {
				title: 'Create your main password',
				myForm: form,
				uikitFieldHorizontal: forms.uikitFieldHorizontal
			});
		},
		empty: function(form) {
			res.render('user/sign-up-step-2', {
				title: 'Create your main password',
				myForm: form,
				uikitFieldHorizontal: forms.uikitFieldHorizontal
			});
		}
	});
});

router.get('/sign-up-step-3', function(req, res, next) {
	if (!req.session.user_id) {
		req.flash("danger", "You must be logged in to access this page");
		return res.redirect("/user/sign-in");
	}
	res.render('user/sign-up-step-3', {
		title: 'Welcome!'
	});
});

router.get('/sign-out', function(req, res, next) {
	req.session.user_id = undefined;
	req.flash("info", "You are now logged out");
	res.redirect("/");
});

router.get('/sign-in', function(req, res, next) {
	if (req.session.user_id) {
		req.flash("warning", "You are already signed in");
		return res.redirect("/");
	}
	var form = forms.form_sign_in;

	res.render('user/sign-in', {
		title: 'Sign in',
		myForm: form,
		uikitFieldHorizontal: forms.uikitFieldHorizontal
	});
});

router.post('/sign-in', function(req, res, next) {
	if (req.session.user_id) {
		req.flash("warning", "You are already signed in");
		return res.redirect("/");
	}
	var form = forms.form_sign_in;
	form.handle(req, {
		success: function(form) {
			req.models.User.findOne({
				email: form.data.email,
				password: CryptoJS.SHA1(form.data.password).toString()
			}, function(err, user) {
				if (err) return console.error(err);
				if (user !== null) {
					req.session.user_id = user._id;
					user.dateLastAction = 0;
					user.save(function(err) {});
					req.flash("success", "Your are now logged in");
					res.redirect("/unlock");
				} else {
					req.flash("warning", "No account found with these credentials");
					res.render('user/sign-in', {
						title: 'Sign in',
						myForm: form,
						uikitFieldHorizontal: forms.uikitFieldHorizontal
					});
				}
			});
		},
		error: function(form) {
			req.flash("danger", "The form contains errors");
			res.render('user/sign-in', {
				title: 'Sign in',
				myForm: form,
				uikitFieldHorizontal: forms.uikitFieldHorizontal
			});
		},
		empty: function(form) {
			res.render('user/sign-in', {
				title: 'Sign in',
				myForm: form,
				uikitFieldHorizontal: forms.uikitFieldHorizontal
			});
		}
	});
});

module.exports = router;