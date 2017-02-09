function exportContents() {
	$('#wait').removeClass('hidden');

	var grades = $('#filter-grades').val();
	if (grades == null)
		grades = [];

	var data = {
		'grades': grades
	};

	$.ajax({
		url: '/admin/contents/export',
		type: 'POST',
		data: data,
		success: function(result) {
			$('#wait').addClass('hidden');
			responseExport(result);
		}
	});
}

function responseExport(res) {
	if (res.status_code == 200) {
		$(location).attr('href', '/' + res.filename);
	} else {
		var html = '<div class="alert alert-danger alert-dismissable">';
		html += '<p>' + res.message + '</p></div>';
		$('#alert-modal').empty();
		$('#alert-modal').append(html);
		$('#alert-modal').removeClass('hidden');

		setTimeout(
			function(){
				$('#alert-modal').addClass('hidden');
			},
			3000
		);
	}
}
