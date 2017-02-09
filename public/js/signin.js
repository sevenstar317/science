$(document).ready(function(){
	$('form').submit(function(event) {
		event.preventDefault();
		$('#wait').removeClass('hidden');
		$('.alert').remove();
		$.ajax({
			url: '/signin',
			type: 'POST',
			data: new FormData(this),
			contentType: false,
			processData: false,
			success: function(result){
				responseSignin(result);
			}
		});
	});

	$('#email').keydown(function(e) {
		if (e.which == 13)
			$('#password').focus();
	});

	$('#password').keydown(function(e) {
		if (e.which == 13)
			signin();
	});
});

function responseSignin(res) {
	$('#wait').addClass('hidden');

	if (res.redirect) {
		$(location).attr('href', res.redirect);
		return;
	}

	if (res.status_code != 200 ) {
		//var alertElem = '<div class="alert alert-danger alert-dismissable">';
		//alertElem += '<button type="button" data-dismiss="alert" aria-hidden="true" class="close">&times;</button>';
		//alertElem += '<strong>Error!</strong><p>' + res.message + '</p></div>';
		$('#alert-block').empty();
		var alertElem = '<p>' + res.message + '</p>';
		$('#alert-block').append(alertElem);
		$('#password').val('');
	}
}

function signin() {
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

// clear social info from session
function clearSocialCookie() {
	$.ajax({
		url: '/social-logout',
		type: 'POST',
		
		success: function(result){
			console.log("cleared social session");
		}
	})
	return;
}