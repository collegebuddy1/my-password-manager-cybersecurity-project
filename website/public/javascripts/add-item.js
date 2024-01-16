$(function() {
	var modal = UIkit.modal("#modalGeneratePwd");
	var field = $(".pwdShowHideGenerate");
	field.parent().append('&nbsp;<button id="showPwd" class="uk-button uk-button-primary" data-uk-tooltip title="Show" type="button"><span class="uk-icon-eye"></span></button>');
	field.parent().append('<button id="hidePwd" class="uk-button uk-button-primary" data-uk-tooltip title="Hide" type="button"><span class="uk-icon-eye-slash"></span></button>');
	field.parent().append('&nbsp;<button id="generatePwd" class="uk-button uk-button-primary" data-uk-tooltip title="Generate" type="button"><span class="uk-icon-refresh"></span></button>');
	var showPwd = $("#showPwd");
	var hidePwd = $("#hidePwd");
	var generatePwd = $("#generatePwd");
	hidePwd.hide();
	generatePassword();

	$(document).on("click", "#showPwd", function() {
		field.attr("type", "text");
		showPwd.hide();
		hidePwd.show();
	});
	$(document).on("click", "#hidePwd", function() {
		field.attr("type", "password");
		showPwd.show();
		hidePwd.hide();
	});
	$(document).on("click", "#generatePwd", function() {
		modal.show();
	});
	$(document).on("change", "#formPwgGen", function(e) {
		if (e.target.id == "pwdGen_pwd")
			return false;
		generatePassword();
	});
	$(document).on("change mousemove", "#pwdGen_length", function() {
		$("#pwdGen_length_display").text($("#pwdGen_length").val());
	});
	$(document).on("submit", "#formPwgGen", function() {
		return false;
	});
	$(document).on("click", "#btnNewPwd", function() {
		generatePassword();
	});
	$(document).on("click", "#btnUsePwd", function() {
		field.val($("#pwdGen_pwd").val());
		modal.hide();
	});
	$('#id_category').append($('<option>', {
		value: "all",
		text: "-None-"
	}));
	$.ajax({
		url: "/ajax/categories",
		type: 'GET',
		timeout: 5000,
		dataType: "json",
		success: function(data) {
			if (!data.error) {
				$.each(data.data, function(i, item) {
					$('#id_category').append($('<option>', {
						value: item._id,
						text: item.title
					}));
				});
			}
		},
		error: function() {
			UIkit.notify("An error occured, please try again", "danger");
		}
	});
});

function generatePassword() {
	var pwdGen_length = $("#pwdGen_length");
	var pwdGen_numbers = $("#pwdGen_numbers");
	var pwdGen_lowercase = $("#pwdGen_lowercase");
	var pwdGen_uppercase = $("#pwdGen_uppercase");
	var pwdGen_specials = $("#pwdGen_specials");
	var optionsPwd = {
		'length': pwdGen_length.val(),
		'numeric': pwdGen_numbers.is(':checked'),
		'lowercase': pwdGen_lowercase.is(':checked'),
		'uppercase': pwdGen_uppercase.is(':checked'),
		'special': pwdGen_specials.is(':checked')
	};
	$("#pwdGen_length_display").text(pwdGen_length.val());
	if (!(pwdGen_numbers.is(':checked') || pwdGen_lowercase.is(':checked') || pwdGen_uppercase.is(':checked') || pwdGen_specials.is(':checked'))) {
		$("#pwdGen_pwd").val("Please choose one or more options above");
		setProgressBar(0);
	} else {
		$("#pwdGen_pwd").val($.passGen(optionsPwd));
		setProgressBar(100 * testStrength($("#pwdGen_pwd").val()));
	}
}

function setProgressBar(score) {
	score = score / 5;
	var passwordStrength = $("#passwordStrength");
	var passwordStrengthBar = $("#passwordStrengthBar");
	passwordStrength.removeClass(passwordStrength.attr("data-current-class"));
	var current_color = get_pwd_strength_color(score);
	passwordStrength.addClass(current_color);
	passwordStrength.attr("data-current-class", current_color);
	passwordStrength.attr("title", get_pwd_strength_title(score));
	passwordStrengthBar.width(score + "%");
}

function get_pwd_strength_color(strength) {
	if (strength >= 65)
		return "uk-progress-success";
	else if (strength >= 35)
		return "uk-progress-warning";
	else
		return "uk-progress-danger";
}

function get_pwd_strength_title(strength) {
	if (strength >= 85)
		return "Very strong";
	else if (strength >= 70)
		return "Strong";
	else if (strength >= 50)
		return "Good";
	else if (strength >= 30)
		return "Weak";
	else
		return "Very weak";
}