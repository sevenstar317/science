$(document).ready(function(){
	$('form').submit(function(event) {
		event.preventDefault();
		$('#wait').removeClass('hidden');
		$('.alert').remove();
		$.ajax({
			url: '/password',
			type: 'POST',
			data: new FormData(this),
			contentType: false,
			processData: false,
			success: function(result){
				$('#wait').addClass('hidden');
				responsePassword(result);
			}
		});
	});

	$('#old-password').keydown(function(e) {
		if (e.which == 13)
			$('#new-password').focus();
	});

	$('#new-password').keydown(function(e) {
		if (e.which == 13)
			$('#confirm-password').focus();
	});

	$('#confirm-password').keydown(function(e) {
		if (e.which == 13)
			changePassword();
	});
});

function changePassword() {
	$('form').validator('validate');
	setTimeout (
		function(){
			if ($('.has-error').length > 0)
				return;

			$('form').submit();
		},
		1000
	);
}

function responsePassword(res) {
	$('#old-password').val('');
	$('#new-password').val('');
	$('#confirm-password').val('');

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
	}
}

