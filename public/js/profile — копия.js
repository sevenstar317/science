$(document).ready(function(){
	showSchoolList();
	$('.add-manual').hide();
	initGeolocation();

	$('#profile').submit(function(event) {
		event.preventDefault();
		$('#wait').removeClass('hidden');
		$('.alert').remove();
		$.ajax({
			url: '/profile',
			type: 'POST',
			data: new FormData(this),
			contentType: false,
			processData: false,
			success: function(result){
				$('#wait').addClass('hidden');
				responseProfile(result);
			}
		});
	});

	$('#password').submit(function(event) {
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
});

function showMap(){
	$('#map_canvas').show();
	$('.list-school').hide();
	$('.btn-map').hide();
	$('.btn-list').show();
}

function showSchoolList(){
	$('#map_canvas').hide();
	$('.list-school').show();
	$('.btn-map').show();
	$('.btn-list').hide();
}

function showAddManual(){
	$('.add-manual').show();
	$('#map_canvas').hide();
	$('.list-school').hide();
	$('.btn-map').hide();
	$('.btn-list').hide();
	$('.btn-add-manually').hide();
}

function selectDropdownItem(item){
	$(item).parent().parent().prev().find('.selected-item').text($(item).text());
	$(item).parent().parent().next().val($(item).text());
}

function saveProfile(){
	$('#profile').validator('validate');
	setTimeout (
		function(){
			if ($('#profile .has-error').length > 0)
				return;

			$('#profile').submit();
		},
		100
	);
}

function responseProfile(res) {
	if (res.status_code == 200 ) {
		$('#photo-removed').val('');
		$('#menu-user .username').text($('#name').val());
		if (res.photo == '')
			$('#menu-user img').attr('src', '/images/guest.png');
		else
			$('#menu-user img').attr('src', res.photo);
	} else {
		var alertElem = '<div class="alert alert-danger alert-dismissable">';
		alertElem += '<button type="button" data-dismiss="alert" aria-hidden="true" class="close">&times;</button>';
		alertElem += '<strong>Error!</strong><p>' + res.message + '</p></div>';
		$('#profile-alert-block').append(alertElem);
	}
}

function changePassword() {
	$('#password').validator('validate');
	setTimeout (
		function(){
			if ($('#password .has-error').length > 0)
				return;

			$('#password').submit();
		},
		100
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
		$('#password-alert-block').append(alertElem);
	}
}

$(function() {
    //create instance
    $('.chart').easyPieChart({
        animate: 2000
    });
    //update instance after 5 sec
    setTimeout(function() {
        $('.chart').data('easyPieChart').update(40);
    }, 5000);
});