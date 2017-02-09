function download() {
	$('#wait').removeClass('hidden');

	var data = {
		'reported_begin': $('#reported_begin').val(),
		'reported_end': $('#reported_end').val()
	};

	$.ajax({
		url: '/admin/download/reports',
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

