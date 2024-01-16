var express = require('express');
var router = express.Router();
var speakeasy = require('speakeasy');

router.get('/items', function(req, res, next) {
	res.set("Content-type", "application/json");
	var options = {
		user_id: req.session.user_id
	};
	req.models.Totp.find(options,
		"_id title secret",
		function(err, items) {
			if (err) {
				return res.send(JSON.stringify({
					"error": true,
					"message": "No item can be fetched"
				}));
			}
			var d = Math.floor(new Date().getTime() / 1000);
			var nextTick = (30 - (d % 30)) * 1000;
			var totp_items = {
				nextTick: nextTick,
				items: []
			};
			for (var i = 0; i < items.length; i++) {
				totp_items.items.push({
					_id: items[i]._id,
					title: items[i].title,
					code: speakeasy.totp({
						secret: items[i].secret,
						encoding: 'base32'
					})
				});
			};
			return res.send(JSON.stringify({
				"error": false,
				"message": "",
				"data": totp_items
			}));
		});
});

router.delete('/item', function(req, res, next) {
	res.set("Content-type", "application/json");
	req.models.Totp.findOne({
		_id: req.query.id,
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

module.exports = router;