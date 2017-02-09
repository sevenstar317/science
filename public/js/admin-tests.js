var syllabuses = [];
var isLoadingData = false;

function showAlert(msg){
	var alertElem = '<div class="alert alert-danger alert-dismissable">';
	alertElem += '<p>' + msg + '</p></div>';
	$('#alert-modal').empty();
	$('#alert-modal').append(alertElem);
	$('#alert-modal').removeClass('hidden');
	setTimeout(
		function(){
			$('#alert-modal').addClass('hidden');
		},
		3000
	);
}

function onOptionFilter(optionElem) {
	var optionVal = $(optionElem).val();

	$('#grade-tbody').empty();

	if (optionVal == 1) {
		setEnableFilters(false);
		loadTestList ('all', '', '', '','');
	}
	else if (optionVal == 2)
		setEnableFilters(true);
	else if (optionVal == 3) {
		setEnableFilters(false);
		loadTestList('unmapped', '', '', '','');
	}
	else
		return;
}

function setEnableFilters(isEnable) {
	var syllabusFilter = $('#syllabus-filter');
	var gradeFilter = $('#grade-filter');
	var chapterFilter = $('#chapter-filter');
	var conceptFilter = $('#concept-filter');

	if (isEnable == true) {
		$(syllabusFilter).attr('disabled', false);
		$(syllabusFilter).removeClass('text-gray');

		$(gradeFilter).attr('disabled', false);
		$(gradeFilter).removeClass('text-gray');

		$(chapterFilter).attr('disabled', false);
		$(chapterFilter).removeClass('text-gray');
		
		$(conceptFilter).attr('disabled', false);
		$(conceptFilter).removeClass('text-gray');

	} else {
		$(syllabusFilter).attr('disabled', true);
		$(syllabusFilter).addClass('text-gray');
		$(syllabusFilter).val('');

		$(gradeFilter).attr('disabled', true);
		$(gradeFilter).addClass('text-gray');
		$(gradeFilter).val('');

		$(chapterFilter).attr('disabled', true);
		$(chapterFilter).addClass('text-gray');
		$(chapterFilter).val('');
		
		$(conceptFilter).attr('disabled', true);
		$(conceptFilter).addClass('text-gray');
		$(conceptFilter).val('');

	}
}

function onSyllabusFilter() {
	var syllabusFilter = $('#syllabus-filter');
	var syllabusId = $(syllabusFilter).val();

	loadGrade(syllabusId);
}

function onGradeFilter() {
	var syllabusFilter = $('#syllabus-filter');
	var syllabusId = $(syllabusFilter).val();

	var gradeFilter = $('#grade-filter');
	var gradeId = $(gradeFilter).val();

	loadChapter(syllabusId, gradeId);
}

function onChapterFilter() {
	var syllabusFilter = $('#syllabus-filter');
	var syllabusId = $(syllabusFilter).val();

	var gradeFilter = $('#grade-filter');
	var gradeId = $(gradeFilter).val();

	var chapterFilter = $('#chapter-filter');
	var chapterId = $(chapterFilter).val();

	loadConcept(syllabusId, gradeId, chapterId)
}

function onConceptFilter() {
	var syllabusFilter = $('#syllabus-filter');
	var syllabusId = $(syllabusFilter).val();

	var gradeFilter = $('#grade-filter');
	var gradeId = $(gradeFilter).val();

	var chapterFilter = $('#chapter-filter');
	var chapterId = $(chapterFilter).val();

	var conceptFilter = $('#concept-filter');
	var conceptId = $(conceptFilter).val();
	
	if (syllabusId === '' || gradeId === '' || chapterId === '' || conceptId === '')
		return;

	loadTestList('mapped', syllabusId, gradeId, chapterId, conceptId);
}


function loadGrade(syllabusId) {
	var gradeFilter = $('#grade-filter');
	$(gradeFilter).empty();
	$(gradeFilter).append('<option value="">-Select Grade-</option>');

	var chapterFilter = $('#chapter-filter');
	$(chapterFilter).empty();
	$(chapterFilter).append('<option value="">-Select Chapter-</option>');

	if (!syllabusId || syllabusId === '')
		return;

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

			if (result.status_code != 200)
				return;

			var len = result.links.length;

			for (var i = 0; i < len; i++) {
				var link = result.links[i];
				var val = link.grade_id;

				$(gradeFilter).append('<option value="' + val + '" >' + link.grade_title + '</option>');
			}

			$(gradeFilter).val('');
			$(chapterFilter).val('');

		},
		error: function(req, status, err) {
		}
	});
}

function loadChapter(syllabusId, gradeId) {
	var chapterFilter = $('#chapter-filter');
	$(chapterFilter).empty();
	$(chapterFilter).append('<option value="">-Select Chapter-</option>');

	if (!syllabusId || syllabusId === '' || !gradeId || !gradeId === '')
		return;

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

			if (result.status_code != 200)
				return;

			var len = result.links.length;

			for (var i = 0; i < len; i++) {
				var link = result.links[i];
				var val = link.chapter_id;

				$(chapterFilter).append('<option value="' + val + '" >' + link.chapter_title + '</option>');
			}

			$(chapterFilter).val('');

		},
		error: function(req, status, err) {
		}
	});
}

function loadConcept(syllabusId, gradeId, chapterId) {
	var conceptFilter = $('#concept-filter');
	$(conceptFilter).empty();
	$(conceptFilter).append('<option value="">-Select Concept-</option>');

	if (!syllabusId || syllabusId === '' || !gradeId || !gradeId === '' || !chapterId || chapterId === '')
		return;

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

			if (result.status_code != 200)
				return;

			var len = result.links.length;

			for (var i = 0; i < len; i++) {
				var link = result.links[i];
				var val = link.concept_id;

				$(conceptFilter).append('<option value="' + val + '" >' + link.concept_title + '</option>');
			}

			$(conceptFilter).val('');

		},
		error: function(req, status, err) {
		}
	});
}

function loadTestList (option, syllabusId, gradeId, chapterId, conceptId) {
	
	if (isLoadingData == true)
		return;

	totalCount = 0;
	isLoadingData = true;

	$('#wait').removeClass('hidden');

	$.ajax({
		url: '/admin/get/tests',
		type: 'GET',
		data: {
			'option': option,
			'syllabus': syllabusId,
			'grade': gradeId,
			'chapter': chapterId,
			'concept': conceptId,
		},
		success: function(result){
			isLoadingData = false;
			$('#wait').addClass('hidden');

			if (result.status_code != 200) {
				showAlert(result.message);
				return;
			}

			parseTestList(result);
		},
		error: function(req, status, err) {
			isLoadingData = false;
			$('#wait').addClass('hidden');
			showAlert('Sorry. Something went wrong. Please try again later.');
		}
	});
}

function parseTestList(result) {
	var len = result.tests.length;
	
	totalCount = len;
	resetPageCount();

	$('#test-tbody').empty();

	for (var i = 0; i < len; i++) {
		var index = i + 1;
		var test = result.tests[i];
		var html = '<tr id="item-' +index + '">';
		html += '<td>' + index + '</td>';
		html += '<td>' + test.test_title + '</td>';
		html += '<td>' + test.concept_title + '</td>';
		html += '<td>' + test.chapter_title + '</td>';
		html += '<td>' + test.syllabus_title + '</td>';
		html += '<td>' + test.grade_title + '</td>';
		if (test.test_enabled === 'false')
			html += '<td class="grade-enabled">Disabled</td>';
		else
			html += '<td class="grade-enabled">Enabled</td>';
		html += '<td><a href="/admin/test/edit?id=' + test.test_id + '">Edit</a></td>';
		html += '</tr>';

		$('#test-tbody').append(html);
	}

	goToPage(curPage);
}

$(document).ready(function() {

});

