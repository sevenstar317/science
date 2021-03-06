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
		loadChapterList ('all', '', '');
	}
	else if (optionVal == 2)
		setEnableFilters(true);
	else if (optionVal == 3) {
		setEnableFilters(false);
		loadChapterList('unmapped', '', '');
	}
	else
		return;
}

function setEnableFilters(isEnable) {
	var syllabusFilter = $('#syllabus-filter');
	var gradeFilter = $('#grade-filter');

	if (isEnable == true) {
		$(syllabusFilter).attr('disabled', false);
		$(syllabusFilter).removeClass('text-gray');

		$(gradeFilter).attr('disabled', false);
		$(gradeFilter).removeClass('text-gray');

	} else {
		$(syllabusFilter).attr('disabled', true);
		$(syllabusFilter).addClass('text-gray');
		$(syllabusFilter).val('');

		$(gradeFilter).attr('disabled', true);
		$(gradeFilter).addClass('text-gray');
		$(gradeFilter).val('');
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

	if (syllabusId === '' || gradeId === '')
		return;

	loadChapterList('mapped', syllabusId, gradeId);
}

function loadGrade(syllabusId) {
	var gradeFilter = $('#grade-filter');
	$(gradeFilter).empty();
	$(gradeFilter).append('<option value="">-Select Grade-</option>');

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

		},
		error: function(req, status, err) {
		}
	});
}

function loadChapterList (option, syllabusId, gradeId) {
	
	if (isLoadingData == true)
		return;

	totalCount = 0;
	isLoadingData = true;

	$('#wait').removeClass('hidden');

	$.ajax({
		url: '/admin/get/chapters',
		type: 'GET',
		data: {
			'option': option,
			'syllabus': syllabusId,
			'grade': gradeId
		},
		success: function(result){
			isLoadingData = false;
			$('#wait').addClass('hidden');

			if (result.status_code != 200) {
				showAlert(result.message);
				return;
			}

			parseChapterList(result);
		},
		error: function(req, status, err) {
			isLoadingData = false;
			$('#wait').addClass('hidden');
			showAlert('Sorry. Something went wrong. Please try again later.');
		}
	});
}

function parseChapterList(result) {
	var len = result.chapters.length;
	
	totalCount = len;
	resetPageCount();

	$('#chapter-tbody').empty();

	for (var i = 0; i < len; i++) {
		var index = i + 1;
		var chapter = result.chapters[i];
		var html = '<tr id="item-' +index + '">';
		html += '<td>' + index + '</td>';
		html += '<td>' + chapter.chapter_title + '</td>';
		html += '<td>' + chapter.syllabus_title + '</td>';
		html += '<td>' + chapter.grade_title + '</td>';
		if (chapter.chapter_enabled === 'false')
			html += '<td class="grade-enabled">Disabled</td>';
		else
			html += '<td class="grade-enabled">Enabled</td>';
		html += '<td><a href="/admin/chapter/edit?id=' + chapter.chapter_id + '">Edit</a></td>';
		html += '</tr>';

		$('#chapter-tbody').append(html);
	}

	goToPage(curPage);
}

$(document).ready(function() {

});

