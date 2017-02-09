var countLinks = 100;
var syllabuses = [];
var isLoadingData = false;

function responseChapter(res) {
	$('#wait').addClass('hidden');

	if (res.status_code == 200 ) {
		$(location).attr('href', '/admin/chapters');
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

function deleteChapter() {
	$('#wait').removeClass('hidden');
	$('.alert').remove();

	$.ajax({
		url: '/admin/chapter/del',
		type: 'GET',
		data: {
			'chapter': chapter_id
		},
		success: function(res){

			$('#wait').addClass('hidden');

			if (res.status_code == 200 ) {
				$(location).attr('href', '/admin/chapters');
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


function addLink(element) {
	countLinks--;
	var makeDefaultFunc = '';

	var newLink = '<div class="edit-link-block">';

	newLink += '<div class="pull-left margin-right-30">';
	newLink += '<p class="edit-link-label pull-left">Syllabus</p>';
	newLink += '<select id="syllabus_' + countLinks + '" name="syllabuses" index="'+ countLinks +'" class="form-control edit-link-select" required></select>';
	newLink += '</div>';

	newLink += '<div class="form-group pull-left margin-right-30">';
	newLink += '<p class="edit-link-label pull-left">Grade</p>';
	newLink += '<select id="grade_' + countLinks +'" name="grades" class="form-control edit-link-select" required></select>';
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
	var syllabusElem = $(id);
	syllabusElem.on('change', function(){
		loadGrade(syllabusElem);
	});

	for (var i = 0; i < syllabuses.length; i++) {
		var syllabus = syllabuses[i];
		var val = syllabus._id;

		syllabusElem.append('<option value="' + val + '">' + syllabus.title + '</option>');
	}

	var id = '#grade_' + countLinks;
	var gradeElem = $(id);
	gradeElem.on('change', function(){
		loadOrder(syllabusElem, gradeElem);
	});

	var id = '#order_' + countLinks;
	var orderElem = $(id);
	orderElem.append('<option value="1">First</option>');

	var addBtn = '<div class="edit-link-block">';
	addBtn += '<button class="btn btn-default pull-right glyphicon glyphicon-plus" type="button" onclick="addLink(this)"/>';
	addBtn += '</div>';

	linkBlock.append(addBtn);

	$(element).parent().remove();

	loadGrade(syllabusElem);
}

function removeLink(element) {
	$(element).parent().remove();
}

function loadGrade(element) {
	var syllabusId = $(element).val();
	var index = $(element).attr("index");
	var gradeElemId = '#grade_' + index;
	var gradeElem = $(gradeElemId);
	gradeElem.empty();

	if (isLoadingData == true)
		return;

	isLoadingData = true;

	$.ajax({
		url: '/admin/get/links',
		type: 'GET',
		data: {
			'kind': 'grade',
			'syllabus': syllabusId,
			'grade': '',
			'chapter': ''
		},
		success: function(result){
			isLoadingData = false;

			if (result.status_code != 200)
				return;

			var len = result.links.length;

			for (var i = 0; i < len; i++) {
				var link = result.links[i];
				var val = link.grade_id;

				gradeElem.append('<option value="' + val + '" >' + link.grade_title + '</option>');
			}

			loadOrder(element, gradeElem);

		},
		error: function(req, status, err) {
			isLoadingData = false;
		}
	});
}

function loadOrder(syllabusElem, gradeElem) {
	var syllabusId = $(syllabusElem).val();
	var gradeId = $(gradeElem).val();
	var index = $(syllabusElem).attr("index");
	var orderElemId = '#order_' + index;
	var orderElem = $(orderElemId);
	orderElem.empty();
	orderElem.append('<option value="1">First</option>');

	if (isLoadingData == true)
		return;

	isLoadingData = true;

	$.ajax({
		url: '/admin/get/links',
		type: 'GET',
		data: {
			'kind': 'chapter',
			'syllabus': syllabusId,
			'grade': gradeId,
			'chapter': ''
		},
		success: function(result){
			isLoadingData = false;

			if (result.status_code != 200)
				return;

			var len = result.links.length;

			for (var i = 0; i < len; i++) {
				var link = result.links[i];
				if (chapter_id == link.chapter_id)
					continue;

				var val = link.order + 1;
				orderElem.append('<option value="' + val + '" >After ' + link.chapter_title + '</option>');
			}
		},
		error: function(req, status, err) {
			isLoadingData = false;
		}
	});
	
}

$(document).ready(function() {
	$('.admin-container').attr('style', 'display:table');
	$('textarea').val($('#pretext').text());

	$("#image").on('fileloaded', function(event, file, previewId, index) {
		$('#image-removed').val('');
	});

	$('#image').on('filecleared', function(event) {
		$('#image-removed').val('removed');
	});

	if (image != '') {
		$("#image").fileinput({
			initialPreview: ['<img src="' + image + '" class="file-preview-image">'],
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

		if (chapter_id == '') {
			$.ajax({
				url: '/admin/chapter/new',
				type: 'POST',
				data: new FormData(this),
				contentType: false,
				processData: false,
				success: function(result){
					responseChapter(result);
				}
			});
		} else {
			var data = new FormData(this);
			data.append('image', image);

			$.ajax({
				url: '/admin/chapter/edit?id=' + chapter_id,
				type: 'POST',
				data: data,
				contentType: false,
				processData: false,
				success: function(result){
					responseChapter(result);
				}
			});
		}
	});

});

