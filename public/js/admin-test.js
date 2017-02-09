var countLinks = 100;
var syllabuses = [];
var isLoadingData = false;

function responseTest(res) {
	$('#wait').addClass('hidden');

	if (res.status_code == 200 ) {
		$(location).attr('href', '/admin/tests');
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

function deleteTest() {
	$('#wait').removeClass('hidden');
	$('.alert').remove();

	$.ajax({
		url: '/admin/test/del',
		type: 'GET',
		data: {
			'test': test_id
		},
		success: function(res){

			$('#wait').addClass('hidden');

			if (res.status_code == 200 ) {
				$(location).attr('href', '/admin/tests');
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
	newLink += '<p class="edit-link-label pull-left">Chapter</p>';
	newLink += '<select id="chapter_' + countLinks +'" name="chapters" class="form-control edit-link-select" required></select>';
	newLink += '</div>';
	
	newLink += '<div class="form-group pull-left margin-right-30">';
	newLink += '<p class="edit-link-label pull-left">Concept</p>';
	newLink += '<select id="concept_' + countLinks +'" name="concepts" class="form-control edit-link-select" required></select>';
	newLink += '</div>';

	newLink += '<div class="form-group pull-left margin-right-30">';
	newLink += '<p class="edit-link-label pull-left">Order</p>';
	newLink += '<select id="order_' + countLinks +'" name="orders" class="form-control edit-link-select" required></select>';
	newLink += '</div>';

	newLink += '<button class="btn btn-default pull-right glyphicon glyphicon-minus" type="button" onclick="removeLink(this)"/>';

	newLink += '</div>';

	var linkBlock = $(element).parent().parent();
	linkBlock.append(newLink);

	/* Syllabus select */
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

	/* Grade select */
	var id = '#grade_' + countLinks;
	var gradeElem = $(id);
	gradeElem.on('change', function(){
		loadChapter(syllabusElem, gradeElem);
	});

	/* Chapter select */
	var id = '#chapter_' + countLinks;
	var chapterElem = $(id);
	chapterElem.on('change', function(){
		loadConcept(syllabusElem, gradeElem, chapterElem);
	});
	
	/* Concept select */
	var id = '#concept_' + countLinks;
	var conceptElem = $(id);
	conceptElem.on('change', function(){
		loadOrder(syllabusElem, gradeElem, chapterElem, conceptElem);
	});

	/* Order select */
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
			'chapter': '',
			'concept':''
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

			loadChapter(element, gradeElem);

		},
		error: function(req, status, err) {
			isLoadingData = false;
		}
	});
}

function loadChapter(syllabusElem, gradeElem) {
	var syllabusId = $(syllabusElem).val();
	var gradeId = $(gradeElem).val();
	var index = $(syllabusElem).attr("index");
	var chapterElemId = '#chapter_' + index;
	var chapterElem = $(chapterElemId);
	chapterElem.empty();
console.log('in order');
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
			'chapter': '',
			'concept': ''
		},
		success: function(result){
			isLoadingData = false;

			if (result.status_code != 200)
				return;

			var len = result.links.length;

			for (var i = 0; i < len; i++) {
				var link = result.links[i];
				var val = link.chapter_id;

				chapterElem.append('<option value="' + val + '" >' + link.chapter_title + '</option>');
			}

			loadConcept(syllabusElem, gradeElem, chapterElem);

		},
		error: function(req, status, err) {
			isLoadingData = false;
		}
	});
}

function loadConcept(syllabusElem, gradeElem, chapterElem) {
	var syllabusId = $(syllabusElem).val();
	var gradeId = $(gradeElem).val();
	var chapterId = $(chapterElem).val();
	var index = $(syllabusElem).attr("index");
	var conceptElemId = '#concept_' + index;
	var conceptElem = $(conceptElemId);
	conceptElem.empty();
	console.log('Helo');
	if (isLoadingData == true)
		return;

	isLoadingData = true;

	$.ajax({
		url: '/admin/get/links',
		type: 'GET',
		data: {
			'kind': 'concept',
			'syllabus': syllabusId,
			'grade': gradeId,
			'chapter': chapterId,
			'concept': ''
		},
		success: function(result){
			isLoadingData = false;

			if (result.status_code != 200)
				return;

			var len = result.links.length;

			for (var i = 0; i < len; i++) {
				var link = result.links[i];
				var val = link.concept_id;

				conceptElem.append('<option value="' + val + '" >' + link.concept_title + '</option>');
			}

			loadOrder(syllabusElem, gradeElem, chapterElem, conceptElem);
console.log('in success');
		},
		error: function(req, status, err) {
			isLoadingData = false;
		}
	});
}

function loadOrder(syllabusElem, gradeElem, chapterElem, conceptElem) {
	var syllabusId = $(syllabusElem).val();
	var gradeId = $(gradeElem).val();
	var chapterId = $(chapterElem).val();
	var conceptId = $(conceptElem).val();
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
			'kind': 'test',
			'syllabus': syllabusId,
			'grade': gradeId,
			'chapter': chapterId,
			'concept': conceptId
		},
		success: function(result){
			isLoadingData = false;

			if (result.status_code != 200)
				return;

			var len = result.links.length;

			for (var i = 0; i < len; i++) {
				var link = result.links[i];
				if (test_id == link.test_id)
					continue;

				var val = link.order + 1;
				orderElem.append('<option value="' + val + '" >After ' + link.test_title + '</option>');
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

	/*
	if (concept_id == '')
		refreshChapter();
	*/

	$('form').submit(function(event) {
		event.preventDefault();
		$('#wait').removeClass('hidden');
		$('.alert').remove();

		var data = new FormData(this);

		if (test_id == '') {
			$.ajax({
				url: '/admin/test/new',
				type: 'POST',
				//data: new FormData(this),
				data: data,
				contentType: false,
				processData: false,
				success: function(result){
					responseTest(result);
				}
			});
		} else {
			$.ajax({
				url: '/admin/test/edit?id=' + test_id,
				type: 'POST',
				//data: new FormData(this),
				data: data,
				contentType: false,
				processData: false,
				success: function(result){
					responseTest(result);
				}
			});
		}
	});

});

