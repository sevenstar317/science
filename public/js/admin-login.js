function loginAdmin() {
	$('form').validator('validate');
	setTimeout (
		function() {
			if ($('.has-error').length > 0)
				return;

			$('.has-error').removeClass('has-error');
			$('.help-block.with-errors').empty();
			$('form').submit();
		},
		100
	);
}

function responseLogin(res) {
	$('#wait').addClass('hidden');
	if (res.status_code == 200) {
		$(location).attr('href', '/admin');
	} else {
		var alertElem = '<div class="alert alert-danger alert-dismissable">';
		alertElem += '<button type="button" data-dismiss="alert" aria-hidden="true" class="close">&times;</button>';
		alertElem += '<strong>Error!</strong><p>' + res.message + '</p></div>';
		$('#alert-block').append(alertElem);
		$('#password').val('');
	}
}

$(document).ready(function(){
	$('form').submit(function(event) {
		event.preventDefault();
		$('#wait').removeClass('hidden');
		$('.alert').remove();

		$.ajax({
			url: '/admin/login',
			type: 'POST',
			data: new FormData(this),
			contentType: false,
			processData: false,
			success: function(res) {
				responseLogin(res);
			}
		});
	});

	$('#name').keydown(function(e) {
		if (e.which == 13)
			$('#password').focus();
	});

	$('#password').keydown(function(e) {
		if (e.which == 13)
			loginAdmin();
	});
});
