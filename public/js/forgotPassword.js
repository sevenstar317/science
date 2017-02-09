$(document).ready(function(){
	$('form').submit(function(event) {
		event.preventDefault();
		$('#wait').removeClass('hidden');
		$('.alert').remove();
		$.ajax({
			url: '/forgotpassword',
			type: 'POST',
			data: new FormData(this),
			contentType: false,
			processData: false,
			success: function(result){
				$('#wait').addClass('hidden');
				responseResetPassword(result);
			}
		});
	});

	$('#email').keydown(function(e) {
		if (e.which == 13) {
			resetPassword();
			event.preventDefault();
		}
	});
});

function resetPassword() {
	$('form').validator('validate');
	setTimeout (
		function(){
			if ($('.has-error').length > 0)
				return;

			$('form').submit();
		},
		100
	);
}

function responseResetPassword(res) {
	if (res.status_code != 200 ) {
		var alertElem = '<div class="alert alert-danger alert-dismissable">';
		alertElem += '<button type="button" data-dismiss="alert" aria-hidden="true" class="close">&times;</button>';
		alertElem += '<strong>Error!</strong><p>' + res.message + '</p></div>';
		$('#alert-block').append(alertElem);
	} else {
		var alertElem = '<div class="alert alert-success alert-dismissable">';
		alertElem += '<button type="button" data-dismiss="alert" aria-hidden="true" class="close">&times;</button>';
		alertElem += '<strong>Success!</strong><p>' + res.message + '</p></div>';
		$('#alert-block').append(alertElem);
		$('.forgot-password-btn').hide();

		setTimeout(
			function(){
				window.location.href = "/signin";
			},
			1200
		);
	}
}

