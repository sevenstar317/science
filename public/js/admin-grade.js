var countLinks = 100;
var syllabuses = [];
var isLoadingData = false;

function responseGrade(res) {
	$('#wait').addClass('hidden');

	if (res.status_code == 200 ) {
		$(location).attr('href', '/admin/grades');
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

function addLink(element) {
	countLinks--;
	var makeDefaultFunc = '';

	var newLink = '<div class="edit-link-block">';

	newLink += '<div class="pull-left margin-right-30">';
	newLink += '<p class="edit-link-label pull-left">Syllabus</p>';
	newLink += '<select id="syllabus_' + countLinks + '" name="syllabuses" index="'+ countLinks +'" class="form-control edit-link-select" required></select>';
	newLink += '</div>';

	newLink += '<div class="form-group pull-left margin-right-30">';
	newLink += '<p class="edit-link-label pull-left">Order</p>';
	newLink += '<select id="order_' + countLinks +'" name="orders" class="form-control edit-link-select" required></select>';
	newLink += '</div>';

	newLink += '<button class="btn btn-default pull-right glyphicon glyphicon-minus" type="button" onclick="removeLink(this)"/>';

	newLink += '</div>';

	var linkBlock = $(element).parent().parent();
	linkBlock.append(newLink);

	var id = '#syllabus_' + countLinks;
	var newSyllabus = $(id);
	newSyllabus.on('change', function(){
		loadOrder(newSyllabus);
	});

	for (var i = 0; i < syllabuses.length; i++) {
		var syllabus = syllabuses[i];
		var val = syllabus._id;

		newSyllabus.append('<option value="' + val + '">' + syllabus.title + '</option>');
	}

	var id = '#order_' + countLinks;
	var newOrder = $(id);
	newOrder.append('<option value="1">First</option>');

	var addBtn = '<div class="edit-link-block">';
	addBtn += '<button class="btn btn-default pull-right glyphicon glyphicon-plus" type="button" onclick="addLink(this)"/>';
	addBtn += '</div>';

	linkBlock.append(addBtn);

	$(element).parent().remove();

	loadOrder(newSyllabus);
}

function removeLink(element) {
	$(element).parent().remove();
}

function loadOrder(element) {
	var syllabusId = $(element).val();
	var index = $(element).attr("index");
	var orderId = '#order_' + index;
	var orderElem = $(orderId);
	orderElem.empty();
	orderElem.append('<option value="1">First</option>');

	if (isLoadingData == true)
		return;

	isLoadingData = true;
	
	$.ajax({
		url: '/admin/get/links',
		type: 'GET',
		data: {
			'kind': 'grade',
			'syllabus': syllabusId,
			'grade': grade_id,
			'chapter': ''
		},
		success: function(result){
			
			isLoadingData = false;

			if (result.status_code != 200)
				return;

			var len = result.links.length;

			for (var i = 0; i < len; i++) {
				var link = result.links[i];
				if (grade_id == link.grade_id)
					continue;

				var val = link.order + 1;
				orderElem.append('<option value="' + val + '" >After ' + link.grade_title + '</option>');
			}

		},
		error: function(req, status, err) {
			isLoadingData = false;
		}
	});
}

function deleteGrade() {
	$('#wait').removeClass('hidden');
	$('.alert').remove();

	$.ajax({
		url: '/admin/grade/del',
		type: 'GET',
		data: {
			'grade': grade_id
		},
		success: function(res){

			$('#wait').addClass('hidden');

			if (res.status_code == 200 ) {
				$(location).attr('href', '/admin/grades');
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

	$("#image").on('fileloaded', function(event, file, previewId, index) {
		$('#image-removed').val('');
	});

	$('#image').on('filecleared', function(event) {
		$('#image-removed').val('removed');
	});

	if (image_path != '') {
		$("#image").fileinput({
			initialPreview: ['<img src="' + image_path + '" class="file-preview-image">'],
			showCaption: false,
			showUpload: false,
			previewSettings: {image: {width: "auto", height:"160px"}},
		});
	} else {
		$("#image").fileinput({
			showCaption: false,
			showUpload: false,
			previewSettings: {image: {width: "auto", height:"160px"}},
		});
	}

	$('form').submit(function(event) {
		event.preventDefault();
		$('#wait').removeClass('hidden');
		$('.alert').remove();

		if (grade_id == '') {
			$.ajax({
				url: '/admin/grade/new',
				type: 'POST',
				data: new FormData(this),
				contentType: false,
				processData: false,
				success: function(result){
					responseGrade(result);
				}
			});
		} else {
			var data = new FormData(this);
			data.append('image', image);

			$.ajax({
				url: '/admin/grade/edit?id=' + grade_id,
				type: 'POST',
				data: data,
				contentType: false,
				processData: false,
				success: function(result){
					responseGrade(result);
				}
			});
		}
	});
});

