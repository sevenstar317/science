var verified_status = 'all';

function selectVerifiedStatus(val) {
	verified_status = val;
}

function download() {
	$('#wait').removeClass('hidden');

	var grades = $('#filter-grades').val();
	if (grades == null)
		grades = [];

	var data = {
		'registered_begin': $('#registered_begin').val(),
		'registered_end': $('#registered_end').val(),
		'signin_begin': $('#signin_begin').val(),
		'signin_end': $('#signin_end').val(),
		'verified_status': verified_status,
		'grades': grades
	};

	$.ajax({
		url: '/admin/download/users',
		type: 'GET',
		data: data,
		success: function(result) {
			$('#wait').addClass('hidden');
			responseDownload(result);
		}
	});
}

function responseDownload(res) {
	if (res.status_code == 200) {
		$(location).attr('href', '/' + res.filename);
	} else {
		var alertElem = '<div class="alert alert-danger alert-dismissable">';
		alertElem += '<button type="button" data-dismiss="alert" aria-hidden="true" class="close">&times;</button>';
		alertElem += '<strong>Error!</strong><p>' + res.message + '</p></div>';
		$('#alert-block').append(alertElem);
	}
}

$(document).ready(function(){
	$('.date-filter').datepicker({
		autoclose: true,
		todayHighlight: true
	});
});

