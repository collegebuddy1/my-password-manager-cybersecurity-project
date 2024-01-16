var mongoose = require('mongoose');

exports.User = new mongoose.Schema({
	first_name: String,
	last_name: String,
	email: String,
	password: String,
	status: Number,
	dateCreated: {
		type: Date,
		default: Date.now
	},
	main_password: String,
	unlocked_token: String,
	tmp_pk: String,
	dateLastAction: Date,
});

exports.Item = new mongoose.Schema({
	title: String,
	url: String,
	username: String,
	password: String,
	password_hidden: String,
	password_strength: Number,
	comment: String,
	user_id: String,
	category_id: String,
});

exports.Category = new mongoose.Schema({
	title: String,
	position: String,
});

exports.Totp = new mongoose.Schema({
	title: String,
	secret: String,
	user_id: String,
});