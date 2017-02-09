var isSelectingChapter = false;
var countLinks = 100;
var syllabuses = [];
var isLoadingData = false;

function responseConcept(res) {
	$('#wait').addClass('hidden');

	if (res.status_code == 200 ) {
		$(location).attr('href', '/admin/concepts');
	} else {
		var alertElem = '<div class="alert alert-danger alert-dismissable">';
		alertElem += '<button type="button" data-dismiss="alert" aria-hidden="true" class="close">&times;</button>';
		alertElem += '<strong>Error!</strong><p>' + res.message + '</p></div>';
		$('#alert-block').append(alertElem);
	}
}

function save() {
	
	// if (!checkInputURL($('#image')) ||
	// 		!checkInputURL($('#image_sources')) ||
	// 		!checkInputURL($('#image2')) ||
	// 		!checkInputURL($('#image2_sources')) ) {
		
	// 	var alertElem = '<div class="alert alert-danger alert-dismissable">';
	// 	alertElem += '<button type="button" data-dismiss="alert" aria-hidden="true" class="close">&times;</button>';
	// 	alertElem += '<strong>Error!</strong><p>Please input valid url for images.</p></div>';
	// 	$('#alert-block').append(alertElem);

	// 	return;
	// }

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

function checkInputURL (element) {
	var textUrl = $(element).val();

	return validateURL(textUrl);
}

function validateURL(textval) {
//	var urlregex = new RegExp('"^(ht|f)tp(s?)\:\/\/[0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*(:(0-9)*)*(\/?)([a-zA-Z0-9\-\.\?\,\'\/\\\+&amp;%\$#_]*)?$');
    var urlregex = new RegExp(
          "^(http|https|ftp)\://([a-zA-Z0-9\.\-]+(\:[a-zA-Z0-9\.&amp;%\$\-]+)*@)*((25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9])\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[0-9])|([a-zA-Z0-9\-]+\.)*[a-zA-Z0-9\-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(\:[0-9]+)*(/($|[a-zA-Z0-9\.\,\?\'\\\+\(\)\:&amp;%\$#\=~_\-]+))*$");
    return urlregex.test(textval);
}

function deleteConcept() {
	$('#wait').removeClass('hidden');
	$('.alert').remove();

	$.ajax({
		url: '/admin/concept/del',
		type: 'GET',
		data: {
			'concept': concept_id
		},
		success: function(res){

			$('#wait').addClass('hidden');

			if (res.status_code == 200 ) {
				$(location).attr('href', '/admin/concepts');
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

function addContent(element, hasPlaceholder) {
	var placeholder = '';
	var name = '';
	var makeDefaultFunc = '';

	if (hasPlaceholder) {
		placeholder = ' placeholder="Only Youtube URL"';
		name = ' name="videos"';
		makeDefaultFunc = 'onclick="makeDefaultVideo(this)"';
	} else {
		name = ' name="references"';
		makeDefaultFunc = 'onclick="makeDefaultReference(this)"';
	}

	var newRef = '<div><button type="button" onclick="addContent(this, ';
	newRef += hasPlaceholder;
	newRef += ')" class="btn btn-default pull-right glyphicon glyphicon-plus"> </button>';
	newRef += '<a class="btn btn-default btn-set-default pull-right" ' + makeDefaultFunc + '>';
	newRef += '<img src="/images/undefault.png"></a>';
	newRef += '<input type="text" class="text-input form-control"' + name + placeholder + '>';
	newRef += '<input id="videos_enable" type="checkbox" class="check-input "' +  ' name="videos_enable"' + '></div>';

	var refBlock = $(element).parent().parent();
	refBlock.append(newRef);

	var elem = $(element);
	elem.blur();
	elem.attr('onclick', 'removeContent(this)');
	elem.removeClass('glyphicon-plus');
	elem.addClass('glyphicon-minus');
}

function removeContent(element) {
	$(element).parent().remove();
}

/*
function refreshChapter() {
	var grade = $('#grade').val();

	if (grade == '') {
		$('#chapter option').each(function(){
			if (!$(this).attr('data-grade')) {
				$(this).attr('selected', 'true');
				return;
			}

			$(this).hide();
		});
	} else {
		$('#chapter option').each(function(){
			if (!$(this).attr('data-grade')) {
				$(this).attr('selected', 'true');
				return;
			}

			if ($(this).attr('data-grade') == grade)
				$(this).show();
			else
				$(this).hide();
		});
	}

	selectChapter();
}

function selectChapter() {
	var grade = $('#grade').val();
	var chapter = $('#chapter').val();
	var orderElem = $('#order');
	orderElem.empty();
	orderElem.append('<option value="1">First</option>');

	if (isSelectingChapter == true)
		return;

	isSelectingChapter = true;

	$.ajax({
		url: '/admin/get/concepts',
		type: 'GET',
		data: {
			'grade': grade,
			'chapter': chapter
		},
		success: function(result){
			isSelectingChapter = false;

			if (result.status_code != 200)
				return;

			if ($('#chapter').val() != result.chapter) {
				selectChapter();
				return;
			}

			var len = result.concepts.length;
			if (len > 0) {
				var val = len + 1;
				orderElem.append('<option value="' + val + '">Last</option>');
			}

			for (var i = 0; i < len; i++) {
				var concept = result.concepts[i];
				if (concept_chapter == chapter && concept_order * 1 == concept.order)
					continue;

				var val = concept.order + 1;
				var selected = '';
				if (concept_chapter == chapter && concept_order != '') {
					if (concept_order * 1 == val)
						selected = ' selected';
				}

				orderElem.append('<option value="' + val + '"' + selected + '>After ' + concept.title + '</option>');
			}
		},
		error: function(req, status, err) {
			isSelectingChapter = false;
		}
	});
}
*/
function makeDefaultVideo(elem) {
	$('#alert-block').empty();

	var url = $(elem).next().val();
	url = url.replace(/^\s+/, '');
	url = url.replace(/\s+$/, '');

	if (url == '')
		return;

	$('#video-contents .default-content img').attr('src', '/images/undefault.png');
	$('#video-contents .default-content').attr('onclick', 'makeDefaultVideo(this)');
	$('#video-contents .default-content').removeClass('default-content');
	$(elem).attr('onclick', '');
	$(elem).addClass('default-content');
	$('#video-contents .default-content img').attr('src', '/images/default.png');
}

function makeDefaultReference(elem) {
	$('#alert-block').empty();

	var url = $(elem).next().val();
	url = url.replace(/^\s+/, '');
	url = url.replace(/\s+$/, '');

	if (url == '')
		return;

	$('#reference-contents .default-content img').attr('src', '/images/undefault.png');
	$('#reference-contents .default-content').attr('onclick', 'makeDefaultReference(this)');
	$('#reference-contents .default-content').removeClass('default-content');
	$(elem).attr('onclick', '');
	$(elem).addClass('default-content');
	$('#reference-contents .default-content img').attr('src', '/images/default.png');
}

function checkDefaultVideo() {
	var videos = $('#video-contents input');
	var len = videos.length;
	var existVideo = false;

	for (var i = 0; i < len; i++) {
		var url = $(videos[i]).val().replace(/^\s+/, '');
		url = url.replace(/\s+$/, '');
		if (url != '') {
			existVideo = true;
		}
	}

	if (!existVideo)
		return true;
	
	var selectedElem = $('#video-contents .default-content');
	if (selectedElem[0]) {
		var url = selectedElem.next().val();
		url = url.replace(/^\s+/, '');
		url = url.replace(/\s+$/, '');
		if (url != '') {
			$('#default_video').val(selectedElem.next().val())
			return true;
		}
	}

	var alertElem = '<div class="alert alert-danger alert-dismissable">';
	alertElem += '<button type="button" data-dismiss="alert" aria-hidden="true" class="close">&times;</button>';
	alertElem += '<strong>Error!</strong><p>Please input and select default video url.</p></div>';
	$('#alert-block').append(alertElem);
	$('#wait').addClass('hidden');
	return false;
}

function checkDefaultReference() {
	var references = $('#reference-contents input');
	var len = references.length;
	var existReference = false;

	for (var i = 0; i < len; i++) {
		var url = $(references[i]).val().replace(/^\s+/, '');
		url = url.replace(/\s+$/, '');
		if (url != '') {
			existReference = true;
		}
	}

	return true;
	/*
	if (!existReference)
		return true;

	var selectedElem = $('#reference-contents .default-content');
	if (selectedElem[0]) {
		var url = selectedElem.next().val();
		url = url.replace(/^\s+/, '');
		url = url.replace(/\s+$/, '');
		if (url != '') {
			$('#default_reference').val(selectedElem.next().val())
			return true;
		}
	}

	var alertElem = '<div class="alert alert-danger alert-dismissable">';
	alertElem += '<button type="button" data-dismiss="alert" aria-hidden="true" class="close">&times;</button>';
	alertElem += '<strong>Error!</strong><p>Please select default reference url.</p></div>';
	$('#alert-block').append(alertElem);
	$('#wait').addClass('hidden');
	return false;*/
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
		loadOrder(syllabusElem, gradeElem, chapterElem);
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
				var val = link.chapter_id;

				chapterElem.append('<option value="' + val + '" >' + link.chapter_title + '</option>');
			}

			loadOrder(syllabusElem, gradeElem, chapterElem);

		},
		error: function(req, status, err) {
			isLoadingData = false;
		}
	});
}

function loadOrder(syllabusElem, gradeElem, chapterElem) {
	var syllabusId = $(syllabusElem).val();
	var gradeId = $(gradeElem).val();
	var chapterId = $(chapterElem).val();
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
			'kind': 'concept',
			'syllabus': syllabusId,
			'grade': gradeId,
			'chapter': chapterId
		},
		success: function(result){
			isLoadingData = false;

			if (result.status_code != 200)
				return;

			var len = result.links.length;

			for (var i = 0; i < len; i++) {
				var link = result.links[i];
				if (concept_id == link.concept_id)
					continue;

				var val = link.order + 1;
				orderElem.append('<option value="' + val + '" >After ' + link.concept_title + '</option>');
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

		if (!checkDefaultVideo())
			return;

		if (!checkDefaultReference())
			return;

		var data = new FormData(this);

		var videos_enables = [];
	    $('#video-contents input[type=checkbox]').each(function() {
			if ( $(this).prop('checked'))
				videos_enables.push('on');
			else
				videos_enables.push('off');
		});

		for (var i = 0; i < videos_enables.length; i++) {
			data.append('videos_enables', videos_enables[i]);
		}

		var refs_enables = [];
		$('#reference-contents input[type=checkbox]').each(function() {
			if ( $(this).prop('checked'))
				refs_enables.push('on');
			else
				refs_enables.push('off');
		});

		for (var i = 0; i < refs_enables.length; i++) {
			data.append('refs_enables', refs_enables[i]);
		}

		if (concept_id == '') {
			$.ajax({
				url: '/admin/concept/new',
				type: 'POST',
				//data: new FormData(this),
				data: data,
				contentType: false,
				processData: false,
				success: function(result){
					responseConcept(result);
				}
			});
		} else {
			$.ajax({
				url: '/admin/concept/edit?id=' + concept_id,
				type: 'POST',
				//data: new FormData(this),
				data: data,
				contentType: false,
				processData: false,
				success: function(result){
					responseConcept(result);
				}
			});
		}
	});

});

