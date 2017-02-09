var reportOption = '';

function updateOnOff(on){
	var receive_update;

	if (on == 1) {
		$('.on-off-btnset .btn-success').show();
		$('.on-off-btnset .btn-default').hide();
		receive_update = 'true';
	} else {
		$('.on-off-btnset .btn-success').hide();
		$('.on-off-btnset .btn-default').show();
		receive_update = 'false';
	}

	$('#wait').removeClass('hidden');
	$.ajax({
		url: '/set/update',
		type: 'POST',
		data: {
			'classmate_id': classmate_id,
			'receive_update': receive_update
		},
		success: function(res) {
			var alertElem;
			$('#wait').addClass('hidden');

			if (res.status_code == 200)
				alertElem = '<div class="alert alert-success alert-dismissable">';
			else
				alertElem = '<div class="alert alert-danger alert-dismissable">';

			alertElem += '<p>' + res.message + '</p></div>';
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
	});
}

function selectChapter(elem) {
	var chapterElem = $(elem);
	
	if (chapterElem === [] || !chapterElem[0])
		chapterElem = $('#chapters .list-group-item:first-child');

	if (chapterElem.hasClass('active'))
		return;
	
	chapterElem.parent().find('.active').removeClass('active');
	chapterElem.addClass('active');

	$('#content-videos').empty();
	$('#content-notes').empty();
	$('#content-references').empty();

	$.ajax({
		type: 'GET',
		url: '/getconcepts',
		data: {'chapter_id': chapterElem.attr('data-chapter-id')},
		success: function(res) {
			if (res.status_code == 200)
				parseConcepts(res.concepts);
		}
	});
}

function parseConcepts(concepts) {
	var len = concepts.length;

	for (var i = 0; i < len; i++) {
		var html;
		html =  '<h3 class="hidden">' + concepts[i].title + '</h3>';
		html += '<div id="video-' + concepts[i].id + '" class="row hidden"></div>';
		$('#content-videos').append(html);

		html = '<h3 class="hidden">' + concepts[i].title + '</h3>';
		html += '<div id="note-' + concepts[i].id + '" class="content-item hidden"></div>';
		$('#content-notes').append(html);

		
		html = '<h3 class="hidden">' + concepts[i].title + '</h3>';
		html += '<div id="reference-' + concepts[i].id + '" class="content-item hidden"></div>';
		$('#content-references').append(html);

		$.ajax({
			type: 'GET',
			url: '/get/classmate/videos',
			data: {
				'concept_id': concepts[i].id,
				'classmate_id': classmate_id
			},
			success: function(res) {
				if (res.status_code == 200)
					parseVideos(res);
			}
		});

		$.ajax({
			type: 'GET',
			url: '/get/classmate/references',
			data: {
				'concept_id': concepts[i].id,
				'classmate_id': classmate_id
			},
			success: function(res) {
				if (res.status_code == 200)
					parseReferences(res);
			}
		});

		$.ajax({
			type: 'GET',
			url: '/get/classmate/notes',
			data: {
				'concept_id': concepts[i].id,
				'classmate_id': classmate_id
			},
			success: function(res) {
				if (res.status_code == 200)
					parseNotes(res);
			}
		});
	}
}

function parseVideos(data) {
	var videos = data.videos;
	var id = '#video-' + data.concept_id;
	var len = videos.length;
	for (var i = 0; i < len; i++) {
		var html = '<div class="col-xs-6 col-sm-3 content-item">';
		html += '<a href="#" data-video-url="' + videos[i].url + '" onclick="playVideo(this)">';
		html += '<img src="http://img.youtube.com/vi/' + videos[i].url + '/0.jpg" class="full-width"></a>';
		html += '<div class="mark-default pull-right">';

		if (videos[i].is_shared == 'false') {
			html += '<a href="#" class="public pull-right" onclick="shareContent(\'video\', \'' + videos[i].id + '\')" title="Share">';
			html += '<img src="/images/share.png"></a>';
		}

		html += '</div>';
		html += '<div class="description">';
		if (videos[i].shared_count > 0) {
			html += '<p class="pull-right add-count">Added ' + videos[i].shared_count + ' times</p>';
		}

		html += '</div></div>';

		$(id).append(html);
		$(id).removeClass('hidden');
		$(id).prev().removeClass('hidden');
	}
}

function parseReferences(data) {
	var references = data.references;
	var id = '#reference-' + data.concept_id;
	var len = references.length;

	for (var i = 0; i < len; i++) {
		var url = references[i].url;
		var start = url.indexOf('//') + 2;
		var end = url.indexOf('/', start);
		var domain;
		if (end != -1)
			domain = url.substring(start, end);
		else
			domain = url.substring(start);

		var html = '<div class="reference-item full-width inline-block">';
		html += '<img src="' + references[i].image + '" class="pull-left thumb">';

		if (references[i].is_shared == 'false') {
			html += '<a href="#" class="public pull-right" onclick="shareContent(\'reference\', \'' + references[i].id + '\')" title="Share">';
			html += '<img src="/images/share.png"></a>';
		}

		html += '<div class="content">';

		if (references[i].title != '')
			html += '<p class="reference-item-title">' + references[i].title + '</p>';
		if (references[i].description != '')
			html += '<p class="reference-item-description">' + references[i].description + '</p>';

		html += '<a href="' + references[i].url + '" class="reference-item-link" target="_blank">' + domain + '</a></div></div>';
		html += '<div class="description">';
		if (references[i].shared_count > 0) {
			html += '<p class="pull-right add-count">Added ' + references[i].shared_count + ' times</p>';
		}
		html += '</div>';

		$(id).append(html);
		$(id).removeClass('hidden');
		$(id).prev().removeClass('hidden');
	}
}

function parseNotes(data) {
	var notes = data.notes;
	var id = '#note-' + data.concept_id;
	var len = notes.length;

	for (var i = 0; i < len; i++) {
		var html = '<div class="content-item">';
		html += '<div class="note-item full-width inline-block">';
		html += '<div class="person pull-left">';
		html += '<img src="' + notes[i].owner_photo + '" title="' + notes[i].owner_name + '">';
		html += '<p class="person-name">' + notes[i].owner_name + '</p></div>';

		if (notes[i].is_shared == 'false') {
			html += '<a href="#" class="public pull-right" onclick="shareContent(\'note\', \'' + notes[i].id + '\')" title="Share">';
			html += '<img src="/images/share.png"></a>';
		}

		html += '<div class="content">';
		html += '<p class="note-item-date">' + notes[i].date + '</p>';
		html += '<p class="note-content">&nbsp;&nbsp;' + notes[i].note + '</p></div></div>';
		html += '<div class="description">';
		if (notes[i].shared_count > 0) {
			html += '<p class="pull-right add-count">Added ' + notes[i].shared_count + ' times</p>';
		}

		html += '</div></div>';

		$(id).append(html);
		$(id).removeClass('hidden');
		$(id).prev().removeClass('hidden');
	}
}

function shareContent(content_type, content_id) {
	$('#wait').removeClass('hidden');
	$.ajax({
		type: 'POST',
		url: '/share/content',
		data: {
			'content_type': content_type,
			'content_id': content_id,
			'user_id': classmate_id
		},
		success: function(res) {
			$('#wait').addClass('hidden');
			var alertElem;

			if (res.status_code == 200) {
				var actChapter = $('#chapters .active');
				actChapter.removeClass('active');
				selectChapter(actChapter);
				alertElem = '<div class="alert alert-success alert-dismissable">';
			}
			else
				alertElem = '<div class="alert alert-danger alert-dismissable">';

			alertElem += '<p>' + res.message + '</p></div>';
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
	});
}

function playVideo(elem) {
	$('#video-modal').attr('data-video-url', $(elem).attr('data-video-url'));
	$('#video-modal').modal('toggle');
}

function showReportOption(show) {
	if (show) {
		$('#report-user').addClass('hidden');
		$('#report-options').removeClass('hidden');
		$('#report-options textarea').addClass('hidden');
		$('#report-options input[type="radio"]').attr('checked', false);
		reportOption = '';
	} else {
		$('#report-user').removeClass('hidden');
		$('#report-options').addClass('hidden');
	}
}

function selectReportOption(option) {
	reportOption = option;
	if (option == 'Other') {
		$('#report-options textarea').val('');
		$('#report-options textarea').removeClass('hidden');
	} else
		$('#report-options textarea').addClass('hidden');
}

function reportUser() {
	var alertElem;
	var reason = reportOption;
	if (reason == 'Other')
		reason = $('#report-options textarea').val();

	if (reason == '') {
		alertElem = '<div class="alert alert-danger alert-dismissable">';
		if (reportOption == '')
			alertElem += '<p>Please select report option.</p></div>';
		else {
			alertElem += '<p>Please write comment.</p></div>';
		}
		$('#alert-modal').empty();
		$('#alert-modal').append(alertElem);
		$('#alert-modal').removeClass('hidden');

		setTimeout(
			function(){
				$('#alert-modal').addClass('hidden');
			},
			2000
		);

		return;
	}

	$('#wait').removeClass('hidden');
	$.ajax({
		url: '/report',
		type: 'POST',
		data: {
			'user_id': classmate_id,
			'reason': reason
		},
		success: function(res) {
			$('#wait').addClass('hidden');
			if (res.status_code == 200){
				showReportOption(false);
				alertElem = '<div class="alert alert-success alert-dismissable">';
			} else
				alertElem = '<div class="alert alert-danger alert-dismissable">';

			alertElem += '<p>' + res.message + '</p></div>';
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
	});
}

$(document).ready(function(){
	$('#video-modal').on('show.bs.modal', function(){ 
		var html = '<iframe width="100%" height="300" src="http://www.youtube.com/embed/';
		html += $(this).attr('data-video-url') + '" frameborder="0" allowfullscreen=""></iframe>';
		$(this).find('.modal-body').append(html);
	});

	$('#video-modal').on('hidden.bs.modal', function(){
		$(this).find('.modal-body').empty();
	});

	var id = '#chapter-' + chapter_id;
	selectChapter(id);
});

