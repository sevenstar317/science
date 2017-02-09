var isLoadingData = false;

function loadGrade() {
	var syllabusFilter = $('#syllabus-select');
	var syllabusId = $(syllabusFilter).val();

	if (syllabusId === '')
		return;

	loadGradeList(syllabusId);
}

function removeGrades() {
	var gradesArea = $('#grades-area');
	if (gradesArea)
		$(gradesArea).remove();
}

function loadGradeList(syllabusId) {
	removeGrades();

	if (!syllabusId || syllabusId === '')
		return;

	$.ajax({
		url: '/admin/get/grades',
		type: 'GET',
		data: {
			'option': 'mapped',
			'syllabus': syllabusId
		},
		success: function(result){

			if (result.status_code != 200) {
				return;
			}

			parseGradeList(result, syllabusId);
		},
		error: function(req, status, err) {
		}
	});
}

function parseGradeList(result, syllabusId) {
	var grades = $('#grades');
	var len = result.grades.length;
		console.log(result.grades);
	var html = '<div id="grades-area" class="row">';
	for (var i = 0; i < len; i++) {
		var index = i + 1;
		var grade = result.grades[i];

		html += '<div class="class-col center">';
		if (grade.grade_enabled === 'false') {
			html += '<div class="grade-item disabled">';
				html += '<a href="#">';
					html += '<img src="/images/grade-' + grade.grade_title + '.jpg" alt="">';
					html += '<div class="shadows"></div>';
				html +='</a>';
				html += '<p class="grade-title">' + grade.grade_title + 'th Grade</p>';
				html += '</div>';
			html += '</div>';
		} else {
			html += '<div class="grade-item">';
				html += '<a href="'+'/lessons?grade=' + grade.grade_id +'&syllabus=' + syllabusId +'">';
					html += '<img src="/images/grade-' + grade.grade_title + '.jpg" alt="">';
					html += '<div class="shadows"></div>';
				html +='</a>';
				html += '<p class="grade-title">' + grade.grade_title + 'th Grade</p>';
				html += '</div>';
			html += '</div>';
		}
	}

	html += '</div>';
	$(grades).append(html);
}

$(document).ready(function() {
//	$('html').attr('style', "background:url('../images/home-back1.png')");
//	$('body').attr('style', "background:url('../images/home-back2.png') repeat-y");
	//$('.main').attr('style', 'padding-left:50px');
	//$('.footer').attr('style', 'padding-left:50px');
	var syllabusLinks = $('.syllabus-link');

	//loadGradeList($('.syllabus-link.active').data('syllabus'));
	var owl = $("#owl-syllabuses");
 
  owl.owlCarousel({
  	pagination: false,
  	items: 3,
    navigation : true,
    navigationText: ["",""]
  });

  syllabusLinks.on('click', function (e) {
  	e.preventDefault();

  	loadGradeList($(this).data('syllabus'));
  	syllabusLinks.removeClass('active');
  	$(this).addClass('active');
  });
});
