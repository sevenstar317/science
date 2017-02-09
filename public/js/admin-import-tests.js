var socket = io.connect($(location).attr('host'));
var content_type = 'test';

function selectContentType(val) {
	content_type = val;
}

function checkCsvFile(filename) {
	var pos = filename.lastIndexOf('.');
	var ext = '';
	if (pos != -1)
		ext = filename.substring(pos + 1).toLowerCase();
	
	if (ext == 'csv') {
		$('.btn-import').removeClass('hidden');
		return;
	}

	var html = '<div class="alert alert-danger alert-dismissable">';
	html += '<p>Please select only *.csv file.</p></div>';
	$('#alert-modal').empty();
	$('#alert-modal').append(html);
	$('#alert-modal').removeClass('hidden');
	$('.import-file .kv-caption-icon').hide();
	$('.import-file .file-caption-name').text('');
	$('.btn-import').addClass('hidden');

	setTimeout(
		function(){
			$('#alert-modal').addClass('hidden');
		},
		3000
	);
}

function importTests() {
	$('form').submit();
}

function responseImporting(res) {
	if (res.status_code == 400) {
		$('#wait').addClass('hidden');
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

$(document).ready(function(){
	$('#csv_file').on('fileloaded', function(event, file, previewId, index) {
		$('.import-result').addClass('hidden');
		setTimeout(
			function(){
				checkCsvFile(file.name);
			},
			100
		);
	});

	$('#csv_file').on('filecleared', function(event) {
	});

	$('#csv_file').fileinput({
		showUpload:false,
		showRemove:false,
		showPreview:true,
		layoutTemplates:{
			main1:'<div class="input-group {class}">\n' +
				'   <div class="input-group-btn">\n' +
				'       {browse}\n' +
				'   </div>\n' +
				'   {caption}\n' +
				'</div>'
		}
	});

	$('form').submit(function(event) {
		event.preventDefault();
		
		

		var reqUrl;
		if (content_type === 'syllabus')
			reqUrl = '/admin/tests/import/test';
		else
			reqUrl = '/admin/tests/import/test';
			
		$('#processing').text('0%');
		$('#wait').removeClass('hidden');
		$.ajax({
			url: reqUrl,
			type: 'POST',
			data: new FormData(this),
			contentType: false,
			processData: false,
			success: function(res) {
				console.log('Success Data' + JSON.stringify(res));
				responseImporting(res);
			},
			error: function(req, status, err) {
				console.log(err);
				responseImporting = false;
			}
		});
	});

	socket.on('resImportingTest', function(data) {
		var percent = 0;
		if (data.total_count > 0)
			percent = (data.completed_count * 100 / data.total_count) | 0;
		
		$('#processing').text(percent + '%');
	});

	socket.on('resImportTestCompleted', function(data) {
		$('#wait').addClass('hidden');
		$('.import-result').removeClass('hidden');
		$('#import-total-count .value').text(data.total_count);
		$('#import-imported-count .value').text(data.imported_count);
		$('#import-failed-rows .value').text(data.failed_rows);
	});
});
