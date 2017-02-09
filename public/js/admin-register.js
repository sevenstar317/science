function registerAdmin() {
	$('form').validator('validate');
	setTimeout (
		function(){
			if ($('.has-error').length > 0)
				return;

			$('.has-error').removeClass('has-error');
			$('.help-block.with-errors').empty();
			$('form').submit();
		},
		100
	);
}

function responseRegister(res) {
	var alertElem = '';
	$('#wait').addClass('hidden');
	if (res.status_code == 200) {
		alertElem = '<div class="alert alert-success alert-dismissable">';
		alertElem += '<button type="button" data-dismiss="alert" aria-hidden="true" class="close">&times;</button>';
		alertElem += '<strong>Success!</strong><p>' + res.message + '</p></div>';
		$('#alert-block').append(alertElem);
		setTimeout(
			function() {
				$(location).attr('href', '/admin/login');
			},
			2000
		);
	} else {
		alertElem = '<div class="alert alert-danger alert-dismissable">';
		alertElem += '<button type="button" data-dismiss="alert" aria-hidden="true" class="close">&times;</button>';
		alertElem += '<strong>Error!</strong><p>' + res.message + '</p></div>';
		$('#alert-block').append(alertElem);
		$('#password').val('');
		$('#confirm-password').val('');
	}
}

$(document).ready(function(){
	$('form').submit(function(event) {
		event.preventDefault();
		$('#wait').removeClass('hidden');
		$('.alert').remove();

		$.ajax({
			url: '/admin/register',
			type: 'POST',
			data: new FormData(this),
			contentType: false,
			processData: false,
			success: function(res) {
				responseRegister(res);
			}
		});
	});

	$('#name').keydown(function(e) {
		if (e.which == 13)
			$('#password').focus();
	});

	$('#password').keydown(function(e) {
		if (e.which == 13)
			$('#confirm-password').focus();
	});

	$('#confirm-password').keydown(function(e) {
		if (e.which == 13)
			registerAdmin();
	});
});
