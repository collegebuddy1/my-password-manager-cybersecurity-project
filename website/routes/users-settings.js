var express = require('express');
var router = express.Router();
var CryptoJS = require("crypto-js");
var forms = require("../forms");

function reloadPage(res, form, title, layout) {
	return res.render(layout, {
		title: title,
		myForm: form,
		uikitFieldHorizontal: forms.uikitFieldHorizontal
	});
}

router.get('/info', function(req, res, next) {
	if (!req.session.user_id) {
		req.flash("warning", "You must be logged in to access this page");
		return res.redirect("/user/sign-in");
	}
	var form = forms.form_settings_info;

	req.models.User.findOne({
		_id: req.session.user_id
	}, function(err, user) {
		if (err) return console.error(err);
		form = form.bind({
			first_name: user.first_name,
			last_name: user.last_name
		});

		return reloadPage(res, form, "Edit your infos", "user/settings-info");
	});
});

router.post('/info', function(req, res, next) {
	if (!req.session.user_id) {
		req.flash("warning", "You must be logged in to access this page");
		return res.redirect("/user/sign-in");
	}
	var form = forms.form_settings_info;

	form.handle(req, {
		success: function(form) {
			req.models.User.findOne({
				_id: req.session.user_id
			}, function(err, user) {
				if (err) return console.error(err);
				user.first_name = form.data.first_name;
				user.last_name = form.data.last_name;
				res.locals.user_infos.first_name = user.first_name;
				user.save(function(err) {
					if (err) return console.error(err);
					req.flash("success", "Your information has been saved");
					return reloadPage(res, form, "Edit your infos", "user/settings-info");
				});
			});
		},
		error: function(form) {
			req.flash("danger", "The form contains errors");
			return reloadPage(res, form, "Edit your infos", "user/settings-info");
		},
		empty: function(form) {
			return reloadPage(res, form, "Edit your infos", "user/settings-info");
		}
	});
});

router.get('/password', function(req, res, next) {
	if (!req.session.user_id) {
		req.flash("warning", "You must be logged in to access this page");
		return res.redirect("/user/sign-in");
	}
	var form = forms.form_settings_password;

	return reloadPage(res, form, "Edit your password", "user/settings-password");
});

router.post('/password', function(req, res, next) {
	if (!req.session.user_id) {
		req.flash("warning", "You must be logged in to access this page");
		return res.redirect("/user/sign-in");
	}
	var form = forms.form_settings_password;

	form.handle(req, {
		success: function(form) {
			req.models.User.findOne({
				_id: req.session.user_id,
				password: CryptoJS.SHA1(form.data.current_password).toString()
			}, function(err, user) {
				if (user !== null) {
					user.password = CryptoJS.SHA1(form.data.new_password).toString();
					user.save(function(err) {
						if (err) return console.error(err);
						req.flash("success", "Your password has been saved");
						return reloadPage(res, form, "Edit your password", "user/settings-password");
					});
				} else {
					req.flash("danger", "Your current password is incorrect");
					return reloadPage(res, form, "Edit your password", "user/settings-password");
				}
			});
		},
		error: function(form) {
			req.flash("danger", "The form contains errors");
			return reloadPage(res, form, "Edit your password", "user/settings-password");
		},
		empty: function(form) {
			return reloadPage(res, form, "Edit your password", "user/settings-password");
		}
	});
});

router.get('/email', function(req, res, next) {
	if (!req.session.user_id) {
		req.flash("warning", "You must be logged in to access this page");
		return res.redirect("/user/sign-in");
	}
	var form = forms.form_settings_email;

	return reloadPage(res, form, "Edit your email", "user/settings-email");
});

router.post('/email', function(req, res, next) {
	if (!req.session.user_id) {
		req.flash("warning", "You must be logged in to access this page");
		return res.redirect("/user/sign-in");
	}
	var form = forms.form_settings_email;

	form.handle(req, {
		success: function(form) {
			req.models.User.findOne({
				_id: req.session.user_id,
				password: CryptoJS.SHA1(form.data.password).toString()
			}, function(err, user) {
				if (user !== null) {
					user.email = form.data.email;
					user.save(function(err) {
						if (err) return console.error(err);
						form = forms.form_settings_email;
						req.flash("success", "Your email has been saved");
						return reloadPage(res, form, "Edit your email", "user/settings-email");
					});
				} else {
					req.flash("danger", "Your current password is incorrect");
					return reloadPage(res, form, "Edit your email", "user/settings-email");
				}
			});
		},
		error: function(form) {
			req.flash("danger", "The form contains errors");
			return reloadPage(res, form, "Edit your email", "user/settings-email");
		},
		empty: function(form) {
			return reloadPage(res, form, "Edit your email", "user/settings-email");
		}
	});
});

router.get('/main-password', function(req, res, next) {
	if (!req.session.user_id) {
		req.flash("warning", "You must be logged in to access this page");
		return res.redirect("/user/sign-in");
	}
	var form = forms.form_settings_main_password;

	return reloadPage(res, form, "Edit your main password", "user/settings-main-password");
});

router.post('/main-password', function(req, res, next) {
	if (!req.session.user_id) {
		req.flash("warning", "You must be logged in to access this page");
		return res.redirect("/user/sign-in");
	}
	var form = forms.form_settings_main_password;

	form.handle(req, {
		success: function(form) {
			req.models.User.findOne({
				_id: req.session.user_id
			}, function(err, user) {
				if (err) return console.error(err);
				var pv_key = CryptoJS.AES.decrypt(user.main_password.toString(), form.data.current_main_password).toString(CryptoJS.enc.Utf8);
				var is_unlocked = CryptoJS.AES.decrypt(user.unlocked_token.toString(), pv_key).toString(CryptoJS.enc.Utf8);

				if (is_unlocked == "unlocked") {
					user.main_password = CryptoJS.AES.encrypt(pv_key, form.data.new_main_password);
					user.dateLastAction = 0;
					user.save(function(err) {
						if (err) return console.error(err);
						req.flash("success", "Your main password has been saved");
						return res.redirect("/unlock");
					});
				} else {
					req.flash("danger", "Your current main password is incorrect");
					return reloadPage(res, form, "Edit your main password", "user/settings-main-password");
				}
			});
		},
		error: function(form) {
			req.flash("danger", "The form contains errors");
			return reloadPage(res, form, "Edit your main password", "user/settings-main-password");
		},
		empty: function(form) {
			return reloadPage(res, form, "Edit your main password", "user/settings-main-password");
		}
	});
});

module.exports = router;