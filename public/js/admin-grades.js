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
		loadGradeList ('all', '');
	}
	else if (optionVal == 2)
		setEnableFilters(true);
	else if (optionVal == 3) {
		setEnableFilters(false);
		loadGradeList('unmapped', '');
	}
	else
		return;
}

function setEnableFilters(isEnable) {
	var syllabusFilter = $('#syllabus-filter');

	if (isEnable == true) {
		$(syllabusFilter).attr('disabled', false);
		$(syllabusFilter).removeClass('text-gray');

	} else {
		$(syllabusFilter).attr('disabled', true);
		$(syllabusFilter).addClass('text-gray');
		$(syllabusFilter).val('');
	}
}

function onSyllabusFilter(syllabusElem) {
	var syllabusId = $(syllabusElem).val();

	if (!syllabusId || syllabusId === '')
		return;

	loadGradeList('mapped', syllabusId);
}

function loadGradeList (option, syllabusId) {
	
	if (isLoadingData == true)
		return;

	totalCount = 0;
	isLoadingData = true;

	$('#wait').removeClass('hidden');
	
	$.ajax({
		url: '/admin/get/grades',
		type: 'GET',
		data: {
			'option': option,
			'syllabus': syllabusId
		},
		success: function(result){
			isLoadingData = false;
			$('#wait').addClass('hidden');
			if (result.status_code != 200) {
				showAlert(result.message);
				return;
			}

			parseGradeList(result);
		},
		error: function(req, status, err) {
			isLoadingData = false;
			$('#wait').addClass('hidden');
			showAlert('Sorry. Something went wrong. Please try again later.');
		}
	});
}

function parseGradeList(result) {
	var len = result.grades.length;
	
	totalCount = len;
	resetPageCount();

	$('#grade-tbody').empty();

	for (var i = 0; i < len; i++) {
		var index = i + 1;
		
		var grade = result.grades[i];
		var html = '<tr id="item-' +index + '">';
		html += '<td>' + index + '</td>';
		html += '<td>' + grade.grade_title + '</td>';
		html += '<td>' + grade.syllabus_title + '</td>';
		if (grade.grade_enabled === 'false')
			html += '<td class="grade-enabled">Disabled</td>';
		else
			html += '<td class="grade-enabled">Enabled</td>';
		html += '<td><a href="/admin/grade/edit?id=' + grade.grade_id + '">Edit</a></td>';
		html += '</tr>';
		console.log('grade ' + grade.grade_title);
		$('#grade-tbody').append(html);
	}

	goToPage(curPage);
}

$(document).ready(function() {

});

