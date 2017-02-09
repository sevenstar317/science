var isSearching = false;
var content_type = 'image';



function onSyllabusFilter() {
	var syllabusFilter = $('#filter-syllabuses');
	var syllabusId = $(syllabusFilter).val();

	loadGrade(syllabusId);
}

function onGradeFilter() {
	var syllabusFilter = $('#filter-syllabuses');
	var syllabusId = $(syllabusFilter).val();

	var gradeFilter = $('#filter-grades');
	var gradeId = $(gradeFilter).val();

	loadChapter(syllabusId, gradeId);
}

function onChapterFilter() {
	var syllabusFilter = $('#filter-syllabuses');
	var syllabusId = $(syllabusFilter).val();

	var gradeFilter = $('#filter-grades');
	var gradeId = $(gradeFilter).val();

	var chapterFilter = $('#chapter-filter');
	var chapterId = $(chapterFilter).val();

	if (syllabusId === '' || gradeId === '' || chapterId === '')
		return;

	loadConceptList('mapped', syllabusId, gradeId, chapterId);
}

function loadConceptList (option, syllabusId, gradeId, chapterId) {
	var conceptFilter = $('#concept-filter');
	$(conceptFilter).empty();
	$(conceptFilter).append('<option value="">-Select Concept-</option>');

	totalCount = 0;
	isLoadingData = true;

	$.ajax({
		url: '/admin/get/concepts',
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

			if (result.status_code != 200)
				return;

			var len = result.concepts.length;

			for (var i = 0; i < len; i++) {
				var link = result.concepts[i];
				var val = link.concept_id;

				$(conceptFilter).append('<option value="' + val + '" >' + link.concept_title + '</option>');
			}
		},
		error: function(req, status, err) {
			isLoadingData = false;
			$('#wait').addClass('hidden');
			showAlert('Sorry. Something went wrong. Please try again later.');
		}
	});
}

function loadGrade(syllabusId) {
	var gradeFilter = $('#filter-grades');
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

function selectContentType(val) {
	content_type = val;
}

function searchContent(isDownload) {
	
	if (isSearching == true)
		return;

	isSearching = true;

	$('#wait').removeClass('hidden');

	var syllabuses = $('#filter-syllabuses').val();
	if (syllabuses == null)
		syllabuses = [];

	var grades = $('#filter-grades').val();
	if (grades == null)
		grades = [];

	var chap = '';
	if ($('#chapter-filter option:selected').text() !== '-Select Chapter-') {
		chap = $('#chapter-filter option:selected').text();
	}

	var con = '';
	if ($('#concept-filter option:selected').text() !== '-Select Concept-') {
		con = $('#concept-filter option:selected').text();
	}

	var data = {
		'chapter': chap,
		'concept': con,
		'content_type': content_type,
		'download': isDownload,
		'syllabuses': syllabuses,
		'grades': grades
	};

	$.ajax({
		url: '/searchcontents',
		type: 'GET',
		data: data,
		success: function(result) {
			isSearching = false;
			$('#wait').addClass('hidden');

			$('#show-bar').removeClass('hidden');
			$('#page-btnset').removeClass('hidden');

			responseSearch(result, isDownload);
		},
		error: function (req, status, err) {
			isSearching = false;
			$('#wait').addClass('hidden');
			showAlert('Sorry. Something went wrong. Please try again later.');
		}
	});
}

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

function responseSearch(res, isDownload) {
	if (res.status_code == 200) {
		parseSearchContents(res);
		if (isDownload === 'true')
			$(location).attr('href', '/' + res.filename);
	} else {
		showAlert(res.message);
	}
}

function parseSearchContents(data) {
	var type = data.content_type;

	$('#image-table').addClass('hidden');
	$('#video-table').addClass('hidden');
	$('#ref-table').addClass('hidden');

	$('#image-tbody').empty();
	$('#video-tbody').empty();
	$('#ref-tbody').empty();

	totalCount = 0;

	if (type === 'image')
		parseImageContents(data);
	else if (type === 'video')
		parseVideoContents(data);
	else if (type === 'reference')
		parseReferenceContents(data);
}

function parseImageContents(data) {
	var contents_len = data.images.length;

	totalCount = contents_len;
	resetPageCount('#image-tbody');

	for (var i = 0; i < contents_len; i++) {
		var index = i + 1;
		var image = data.images[i];
		var syllabus = '';
		var grade = '';
		var chapter = '';

		var html = '<tr id="item-' +index + '">';
		html += '<td>' + index + '</td>';
		html += '<td> <img class="search-photo" src="' + image.image + '"></td>';
		html += '<td> <a href="' + image.image_url + '" >' + image.image_credit + '</a> </td>';

		for (var j = 0; j < image.linkInfo.length; j++) {
			link = image.linkInfo[j];

			syllabus += link.syllabus_name;
			grade += link.grade_name;
			chapter += link.chapter_name;

			if ( j < image.linkInfo.length - 1) {
				syllabus += '<br>';
				grade += '<br>';
				chapter += '<br>';
			}
		}
		
		html += '<td>' + syllabus + '</td>';
		html += '<td>' + grade + '</td>';
		html += '<td>' + chapter + '</td>';

		html += '<td><a href="/admin/concept/edit?id=' + image.concept_id + '">' + image.concept_name + '</a></td>';
		html += '</tr>';
		$('#image-tbody').append(html);
	}

	$('#image-table').removeClass('hidden');
	goToPage(curPage);
}

function parseVideoContents(data) {
	var contents_len = data.videos.length;

	totalCount = contents_len;
	resetPageCount('#video-tbody');

	for (var i = 0; i < contents_len; i++) {
		var index = i + 1;
		var video = data.videos[i];
		var syllabus = '';
		var grade = '';
		var chapter = '';

		var html = '<tr id="item-' +index + '">';
		html += '<td>' + index + '</td>';
		html += '<td> <a href="#" data-video-url="' + video.url + '" onclick="playVideo(this)">';
		html += '<img src="http://img.youtube.com/vi/' + video.url + '/0.jpg" class="full-width"></a></td>';

		for (var j = 0; j < video.linkInfo.length; j++) {
			link = video.linkInfo[j];

			syllabus += link.syllabus_name;
			grade += link.grade_name;
			chapter += link.chapter_name;

			if ( j < video.linkInfo.length - 1) {
				syllabus += '<br>';
				grade += '<br>';
				chapter += '<br>';
			}
		}

		html += '<td>' + syllabus + '</td>';
		html += '<td>' + grade + '</td>';
		html += '<td>' + chapter + '</td>';

		html += '<td><a href="/admin/concept/edit?id=' + video.concept_id + '">' + video.concept_name + '</a></td>';
		html += '</tr>';
		$('#video-tbody').append(html);
	}

	$('#video-table').removeClass('hidden');

	goToPage(curPage);
}

function parseReferenceContents(data) {
	var contents_len = data.references.length;

	totalCount = contents_len;
	resetPageCount('#ref-tbody');

	for (var i = 0; i < contents_len; i++) {
		var index = i + 1;
		var reference = data.references[i];
		var syllabus = '';
		var grade = '';
		var chapter = '';

		var html = '<tr id="item-' +index + '">';
		html += '<td>' + index + '</td>';
		html += '<td> <a href="' + reference.url + '" >' + reference.title + '</a> </td>';
		html += '<td>' + reference.url + '</td>';

		for (var j = 0; j < reference.linkInfo.length; j++) {
			link = reference.linkInfo[j];

			syllabus += link.syllabus_name;
			grade += link.grade_name;
			chapter += link.chapter_name;

			if ( j < reference.linkInfo.length - 1) {
				syllabus += '<br>';
				grade += '<br>';
				chapter += '<br>';
			}
		}

		html += '<td>' + syllabus + '</td>';
		html += '<td>' + grade + '</td>';
		html += '<td>' + chapter + '</td>';

		html += '<td><a href="/admin/concept/edit?id=' + reference.concept_id + '">' + reference.concept_name + '</a></td>';
		html += '</tr>';
		$('#ref-tbody').append(html);
	}

	$('#ref-table').removeClass('hidden');

	goToPage(curPage);
}

function playVideo(elem) {
	$('#video-modal').attr('data-video-url', $(elem).attr('data-video-url'));
	$('#video-modal').modal('toggle');
}

$(document).ready(function(){
	$('#search').keydown(function(e) {
		if (e.which == 13)
			searchContent();
	});

	$('#video-modal').on('show.bs.modal', function(){ 
		var html = '<iframe width="100%" height="300" src="http://www.youtube.com/embed/' + $(this).attr('data-video-url') + '" frameborder="0" allowfullscreen=""></iframe>';
		$(this).find('.modal-body').append(html);
	});

	$('#video-modal').on('hidden.bs.modal', function(){
		$(this).find('.modal-body').empty();
	});

	$('#image-table').addClass('hidden');
	$('#video-table').addClass('hidden');
	$('#ref-table').addClass('hidden');
	$('#show-bar').addClass('hidden');
	$('#page-btnset').addClass('hidden');
});

