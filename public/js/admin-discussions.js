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
		loadConceptList ('all', '', '', '');
	}
	else if (optionVal == 2)
		setEnableFilters(true);
	else if (optionVal == 3) {
		setEnableFilters(false);
		loadConceptList('unmapped', '', '', '');
	}
	else
		return;
}

function setEnableFilters(isEnable) {
	var syllabusFilter = $('#syllabus-filter');
	var gradeFilter = $('#grade-filter');
	var chapterFilter = $('#chapter-filter');

	if (isEnable == true) {
		$(syllabusFilter).attr('disabled', false);
		$(syllabusFilter).removeClass('text-gray');

		$(gradeFilter).attr('disabled', false);
		$(gradeFilter).removeClass('text-gray');

		$(chapterFilter).attr('disabled', false);
		$(chapterFilter).removeClass('text-gray');

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

	if (syllabusId === '' || gradeId === '' || chapterId === '')
		return;

	loadConceptList('mapped', syllabusId, gradeId, chapterId);
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
			$(chapterFilter).append('<option value="all" >All</option>');
			$(chapterFilter).append('<option value="general" >General</option>');
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

function loadConceptList (option, syllabusId, gradeId, chapterId) {
	
	if (isLoadingData == true)
		return;

	totalCount = 0;
	isLoadingData = true;

	$('#wait').removeClass('hidden');

	$.ajax({
		url: '/admin/get/discussions',
		type: 'GET',
		data: {
			'option': option,
			'syllabus': syllabusId,
			'grade': gradeId,
			'chapter': chapterId
		},
		success: function(result){
			isLoadingData = false;
			$('#wait').addClass('hidden');

			if (result.status_code != 200) {
				showAlert(result.message);
				return;
			}

			parseConceptList(result);
		},
		error: function(req, status, err) {
			console.log(status);
			console.log(req);
			isLoadingData = false;
			$('#wait').addClass('hidden');
			showAlert('Sorry. Something went wrong. Please try again later.');
		}
	});
}

function parseConceptList(result) {
	var len;

	if (result.discussions) {
		len = result.discussions.length;
	} else {
		$('#concept-tbody').empty();
		return;
	}
	
	totalCount = len;
	resetPageCount();

	$('#concept-tbody').empty();

	for (var i = 0; i < len; i++) {
		var index = i + 1;
		var discussion = result.discussions[i];
		var html = '<tr id="item-' +index + '">';
		html += '<td>' + index + '</td>';
		html += '<td>' + discussion.title + '</td>';
		html += '<td>' + discussion.chapter.title + '</td>';
		html += '<td><a href="/admin/discussion/edit?id=' + discussion._id + '">Edit</a></td>';
		html += '</tr>';

		$('#concept-tbody').append(html);
	}

	goToPage(curPage);
}

$(document).ready(function() {

});

