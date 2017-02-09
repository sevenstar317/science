function responseSyllabus(res) {
	$('#wait').addClass('hidden');

	if (res.status_code == 200 ) {
		$(location).attr('href', '/admin/syllabuses');
	} else {
		var alertElem = '<div class="alert alert-danger alert-dismissable">';
		alertElem += '<button type="button" data-dismiss="alert" aria-hidden="true" class="close">&times;</button>';
		alertElem += '<strong>Error!</strong><p>' + res.message + '</p></div>';
		$('#alert-block').append(alertElem);
	}
}

function save() {
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

function deleteSyllabus() {
	$('#wait').removeClass('hidden');
	$('.alert').remove();

	$.ajax({
		url: '/admin/syllabus/del',
		type: 'GET',
		data: {
			'syllabus': syllabus_id
		},
		success: function(res){

			$('#wait').addClass('hidden');

			if (res.status_code == 200 ) {
				$(location).attr('href', '/admin/syllabuses');
			} else {
				var alertElem = '<div class="alert alert-danger alert-dismissable">';
				alertElem += '<button type="button" data-dismiss="alert" aria-hidden="true" class="close">&times;</button>';
				alertElem += '<strong>Error!</strong><p>' + res.message + '</p></div>';
				$('#alert-block').append(alertElem);
			}

		},
		error: function(req, status, err) {
			$('#wait').addClass('hidden');
		}
	});
}

$(document).ready(function() {
	$('.admin-container').attr('style', 'display:table');
	$('textarea').val($('#pretext').text());

	$('form').submit(function(event) {
		event.preventDefault();
		$('#wait').removeClass('hidden');
		$('.alert').remove();

		if (syllabus_id == '') {
			$.ajax({
				url: '/admin/syllabus/new',
				type: 'POST',
				data: new FormData(this),
				contentType: false,
				processData: false,
				success: function(result){
					responseSyllabus(result);
				}
			});
		} else {
			var data = new FormData(this);

			$.ajax({
				url: '/admin/syllabus/edit?id=' + syllabus_id,
				type: 'POST',
				data: data,
				contentType: false,
				processData: false,
				success: function(result){
					responseSyllabus(result);
				}
			});
		}
	});

});

