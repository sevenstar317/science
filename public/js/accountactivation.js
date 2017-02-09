function sendActLink() {
	$('#wait').removeClass('hidden');
	$('.alert').remove();

	$('form').validator('validate');
	setTimeout (
		function() {
			if ($('.has-error').length > 0) {
				$('#wait').addClass('hidden');
				return;
			}

			$.ajax({
				url: '/sendactivationlink',
				type: 'POST',
				data: {'email': $('#email').val()},
				success: function(res){
					$('#wait').addClass('hidden');

					if (res.status_code == 200 ) {
						$('#unknown').addClass('hidden');
						$('#afterSend').removeClass('hidden');
						userid = res.userid;
					} else {
						var alertElem
						alertElem = '<div class="alert alert-danger alert-dismissable">';
						alertElem += '<button type="button" data-dismiss="alert" aria-hidden="true" class="close">&times;</button>';
						alertElem += '<strong>Error!</strong><p>' + res.message + '</p></div>';
						$('#alert-block').append(alertElem);
					}
				}
			});
		},
		100
	);
}

function resendActivationEmail() {
	$('#wait').removeClass('hidden');
	$('.alert').remove();

	$.ajax({
		url: '/sendactivationlink',
		type: 'POST',
		data: {'userid': userid},
		success: function(res){
			$('#wait').addClass('hidden');

			var alertElem
			if (res.status_code == 200 ) {
				if ($('#beforeSend').hasClass('hidden')) {
					alertElem = '<div class="alert alert-success alert-dismissable">';
					alertElem += '<button type="button" data-dismiss="alert" aria-hidden="true" class="close">&times;</button>';
					alertElem += '<strong>Success!</strong><p>' + res.message + '</p></div>';
					$('#alert-block').append(alertElem);
				} else {
					$('#beforeSend').addClass('hidden');
					$('#afterSend').removeClass('hidden');
				}
				userid = res.userid;
			} else {
				alertElem = '<div class="alert alert-danger alert-dismissable">';
				alertElem += '<button type="button" data-dismiss="alert" aria-hidden="true" class="close">&times;</button>';
				alertElem += '<strong>Error!</strong><p>' + res.message + '</p></div>';
				$('#alert-block').append(alertElem);
			}
		}
	});
}

$(document).ready(function() {
	if (userid == '')
		$('#unknown').removeClass('hidden');
	else
		$('#beforeSend').removeClass('hidden');

	$('#email').keydown(function(e) {
		if (e.which == 13)
			sendActLink();
	});

	$('form').submit(function(event) {
		event.preventDefault();
	});
});

