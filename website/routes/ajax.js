var express = require('express');
var router = express.Router();
var CryptoJS = require("crypto-js");
var forms = require("../forms");
var strength = require('strength');

router.get('/items', function(req, res, next) {
	res.set("Content-type", "application/json");
	var options = {};
	var category = req.query.category + "";
	if (category == "" || category == "all")
		options = {
			user_id: req.session.user_id
		};
	else
		options = {
			category_id: category,
			user_id: req.session.user_id
		};
	req.models.Item.find(options,
		"_id title url username password_hidden category_id",
		function(err, items) {
			if (err) {
				return res.send(JSON.stringify({
					"error": true,
					"message": "No item can be fetched"
				}));
			}
			return res.send(JSON.stringify({
				"error": false,
				"message": "",
				"data": items
			}));
		});
});

router.get('/password', function(req, res, next) {
	res.set("Content-type", "application/json");
	req.models.Item.findOne({
			_id: req.query.item_id,
			user_id: req.session.user_id
		},
		"_id password",
		function(err, item) {
			if (err || item == null) {
				return res.send(JSON.stringify({
					"error": true,
					"message": "The item is not available"
				}));
			}
			req.models.User.findOne({
				_id: req.session.user_id
			}, function(err, user) {
				if (err) return console.error(err);

				var pv_key = CryptoJS.AES.decrypt(req.session.password, user.tmp_pk).toString(CryptoJS.enc.Utf8);
				var is_unlocked = CryptoJS.AES.decrypt(user.unlocked_token, pv_key).toString(CryptoJS.enc.Utf8);

				if (is_unlocked == "unlocked") {
					return res.send(JSON.stringify({
						"error": false,
						"message": "",
						"data": CryptoJS.AES.decrypt(item.password, pv_key).toString(CryptoJS.enc.Utf8)
					}));
				} else {
					return res.send(JSON.stringify({
						"error": true,
						"message": "Your main password is incorrect"
					}));
				}
			});
		});
});

router.get('/item', function(req, res, next) {
	res.set("Content-type", "application/json");
	req.models.Item.findOne({
			_id: req.query.item_id,
			user_id: req.session.user_id
		},
		"_id title url username password_hidden comment password_strength",
		function(err, item) {
			if (err) {
				return res.send(JSON.stringify({
					"error": true,
					"message": "The item is not available"
				}));
			}
			return res.send(JSON.stringify({
				"error": false,
				"message": "",
				"data": item
			}));
		});
});

router.post('/item', function(req, res, next) {
	res.set("Content-type", "application/json");
	req.models.User.findOne({
		_id: req.session.user_id
	}, function(err, user) {
		if (err) return console.error(err);
		req.models.Item.findOne({
				_id: req.body.item_id,
				user_id: req.session.user_id
			},
			function(err, item) {
				if (err || item == null) {
					return res.send(JSON.stringify({
						"error": true,
						"message": "The item is not available"
					}));
				}
				var pwd_hidden = "";
				var max_length = req.body.item_password.length;
				for (var i = 0; i < max_length; i++) {
					pwd_hidden += "*";
				};
				var pv_key = CryptoJS.AES.decrypt(req.session.password, user.tmp_pk).toString(CryptoJS.enc.Utf8);
				var is_unlocked = CryptoJS.AES.decrypt(user.unlocked_token, pv_key).toString(CryptoJS.enc.Utf8);

				if (is_unlocked != "unlocked") {
					return res.send(JSON.stringify({
						"error": true,
						"message": "Your current main password is incorrect"
					}));
				}

				item.title = req.body.item_title;
				item.url = req.body.item_url;
				item.username = req.body.item_username;
				item.password = CryptoJS.AES.encrypt(req.body.item_password, pv_key);
				item.password_hidden = pwd_hidden;
				item.password_strength = strength(req.body.item_password) * 100;
				item.comment = req.body.item_comment;
				item.category_id = req.body.item_category;

				item.save(function(err) {
					if (err) return console.error(err);
					req.models.Item.findOne({
							_id: req.body.item_id,
							user_id: req.session.user_id
						},
						"_id title url username password_hidden comment password_strength category_id",
						function(err, c_item) {
							if (err) {
								return res.send(JSON.stringify({
									"error": true,
									"message": "The item is not available"
								}));
							}
							return res.send(JSON.stringify({
								"error": false,
								"message": "",
								"data": c_item
							}));
						});
				});
			});
	});
});

router.delete('/item', function(req, res, next) {
	res.set("Content-type", "application/json");
	req.models.Item.findOne({
		_id: req.query.item_id,
		user_id: req.session.user_id
	}).remove(function(err) {
		if (err) {
			return res.send(JSON.stringify({
				"error": true,
				"message": "The item is not available"
			}));
		}
		return res.send(JSON.stringify({
			"error": false,
			"message": ""
		}));
	});
});

router.post('/category', function(req, res, next) {
	res.set("Content-type", "application/json");
	req.models.Category.count(
		function(err, count) {
			if (err) return console.error(err);
			var new_category = req.models.Category({
				title: req.body.category,
				position: count
			});

			new_category.save(function(err) {
				if (err) return console.error(err);
				return res.send(JSON.stringify({
					"error": false,
					"message": "",
					"data": {
						_id: new_category._id,
						title: new_category.title
					}
				}));
			});
		});
});

router.put('/category', function(req, res, next) {
	res.set("Content-type", "application/json");
	req.models.Category.findOne({
		_id: req.body.id
	}, function(err, category) {
		if (err || category == null) {
			return res.send(JSON.stringify({
				"error": true,
				"message": "The category is not available"
			}));
		}
		category.title = req.body.title;
		category.save(function(err) {
			if (err) return console.error(err);
			return res.send(JSON.stringify({
				"error": false,
				"message": "",
				"data": {
					_id: category._id,
					title: category.title
				}
			}));
		});
	});
});

router.delete('/category', function(req, res, next) {
	res.set("Content-type", "application/json");
	req.models.Category.findOne({
		_id: req.query.id
	}).remove(function(err) {
		if (err) {
			return res.send(JSON.stringify({
				"error": true,
				"message": "The category is not available"
			}));
		}
		return res.send(JSON.stringify({
			"error": false,
			"message": ""
		}));
	});
});

router.get('/categories', function(req, res, next) {
	res.set("Content-type", "application/json");
	req.models.Category.find({}, null, {
			sort: {
				position: 1
			}
		},
		function(err, categories) {
			if (err) {
				return res.send(JSON.stringify({
					"error": true,
					"message": "No categories available"
				}));
			}
			return res.send(JSON.stringify({
				"error": false,
				"message": "",
				"data": categories
			}));
		});
});

module.exports = router;