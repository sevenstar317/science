$(document).ready(function(){
	$('#video-modal').on('show.bs.modal', function(){ 
		var html = '<iframe width="100%" height="300" src="http://www.youtube.com/embed/' + $(this).attr('data-video-url') + '" frameborder="0" allowfullscreen=""></iframe>';
		$(this).find('.modal-body').append(html);
	});

	$('#video-modal').on('hidden.bs.modal', function(){
		$(this).find('.modal-body').empty();
	});

	$('#video-add-modal').on('hidden.bs.modal', function(){
		$(this).find('input').val('');
	});

	$('#video-add-form').submit(submitVideo);

	var id = '#chapter-' + lesson.chapter;
	selectChapter($(id));
});

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function selectChapter(elem) {
	var chapterElem;
	if (elem)
		chapterElem = $(elem);
	else
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
		html =  '<h3>' + concepts[i].title + '</h3>';
		html += '<div id="video-' + concepts[i].id + '" class="row">';
		html += '<div id="video-add-' + concepts[i].id + '" class="col-xs-6 col-sm-3 content-item">';

		if (userid != '')
			html += '<a href="#" onclick="showAddVideoModal(\'' + concepts[i].id + '\')">';
		else
			html += '<a href="#" onclick="$(location).attr(\'href\', \'/addvideo\')">';

		html += '<div class="add-video">';
		html += '<img src="/images/add-video.png">';
		html += '</div></div></div>';
		$('#content-videos').append(html);

		html = '<h3>' + concepts[i].title + '</h3>';
		html += '<div id="note-' + concepts[i].id + '" class="content-item">';
		html += '<div id="note-add-' + concepts[i].id + '" class="note-add full-width inline-block">';
		html += '<textarea placeholder="Add your notes experiment results, feild trip reports. anything!" data-private="false"></textarea>';
		html += '<div class="pull-right">';
		html += '<button type="button" class="btn btn-default public" onclick="setPrivateNote(this, \'' + concepts[i].id + '\')">';
		html += '<img src="/images/public.png"></button>';

		if (userid != '')
			html += '<button type="button" class="btn btn-default btn-note-add" onclick="addNote(\'' + concepts[i].id + '\')">Add note</button>';
		else
			html += '<button type="button" class="btn btn-default btn-note-add" onclick="$(location).attr(\'href\', \'/addnote\')">Add note</button>';
		html += '</div></div></div>';
		$('#content-notes').append(html);

		
		html = '<h3>' + concepts[i].title + '</h3>';
		html += '<div id="reference-' + concepts[i].id + '" class="content-item">';
		html += '<div id="reference-add-' + concepts[i].id + '" class="reference-add full-width inline-block">';
		html += '<input type="text" class="form-control" data-private="false">';
		html += '<div class="pull-right">';
		html += '<button class="btn btn-default public" type="button" onclick="setPrivateReference(this, \'' + concepts[i].id + '\')">';
		html += '<img src="/images/public.png">';
		html += '</button>';

		if (userid != '')
			html += '<button class="btn btn-default btn-note-add" type="button" onclick="addReference(\'' + concepts[i].id + '\')">Add reference</button>';
		else
			html += '<button class="btn btn-default btn-note-add" type="button" onclick="$(location).attr(\'href\', \'/addreference\')">Add reference</button>';
		html += '</div></div>';
		$('#content-references').append(html);

		$.ajax({
			type: 'GET',
			url: '/getvideos',
			data: {'concept_id': concepts[i].id},
			success: function(res) {
				if (res.status_code == 200)
					parseVideos(res);
			}
		});

		$.ajax({
			type: 'GET',
			url: '/getreferences',
			data: {'concept_id': concepts[i].id},
			success: function(res) {
				if (res.status_code == 200)
					parseReferences(res);
			}
		});

		$.ajax({
			type: 'GET',
			url: '/getnotes',
			data: {'concept_id': concepts[i].id},
			success: function(res) {
				if (res.status_code == 200)
					parseNotes(res);
			}
		});
	}
}

function parseVideos(data) {
	var videos = data.videos;
	var addId = '#video-add-' + data.concept_id;
	var len = videos.length;
	for (var i = 0; i < len; i++) {
		var html = '<div class="col-xs-6 col-sm-3 content-item">';
		html += '<a href="#" data-video-url="' + videos[i].url + '" onclick="playVideo(this)">';
		html += '<img src="http://img.youtube.com/vi/' + videos[i].url + '/0.jpg" class="full-width"></a>';
		html += '<div class="mark-default pull-right">';

		if (userid != '') {
			if (videos[i].owner != 'admin') {
				html += '<a href="#" class="public pull-right" onclick="deleteContent(\'video\', \'' + videos[i].id + '\')" title="Delete">';
				html += '<img src="/images/delete.png"></a>';
			}

			if (videos[i].isPrivate == 'true') {
				html += '<a href="#" class="public pull-right" onclick="makePrivate(\'video\',\'' + data.concept_id + '\', \'' + videos[i].id + '\', \'false\')" title="Private">';
				html += '<img src="/images/private.png"></a>';
			} else {
				html += '<a href="#" class="public pull-right" onclick="makePrivate(\'video\',\'' + data.concept_id + '\', \'' + videos[i].id + '\', \'true\')" title="Public">';
				html += '<img src="/images/public.png"></a>';
			}


			if (videos[i].isDefault == 'true') {
				html += '<a href="#" title="Default">';
				html += '<img src="/images/default.png"></a>';
			} else {
				html += '<a href="#" onclick="makeDefault(\'video\', \'' + data.concept_id + '\', \'' + videos[i].id + '\')" title="Undefault">';
				html += '<img src="/images/undefault.png"></a>';
			}

			html += '</div>';
			html += '<div class="description">';
			if (videos[i].shared_count > 0) {
				html += '<p class="pull-right add-count">Added ' + videos[i].shared_count + ' times</p>';
			}
		} else {
			html += '<a href="#" class="public pull-right" onclick="$(location).attr(\'href\', \'/setprivate\')" title="Public">';
			html += '<img src="/images/public.png"></a>';

			if (videos[i].isDefault == 'true') {
				html += '<a href="#" title="Default">';
				html += '<img src="/images/default.png"></a>';
			} else {
				html += '<a href="#" onclick="$(location).attr(\'href\', \'/setdefault\')" title="Undefault">';
				html += '<img src="/images/undefault.png"></a>';
			}
		}

		html += '</div></div>';
		$(html).insertBefore(addId);
	}
}

function parseReferences(data) {
	var references = data.references;
	var addId = '#reference-add-' + data.concept_id;
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

		if (userid != '') {
			if (references[i].owner != 'admin') {
				html += '<a href="#" class="public pull-right" onclick="deleteContent(\'reference\', \'' + references[i].id + '\')" title="Delete">';
				html += '<img src="/images/delete.png"></a>';
			}

			if (references[i].isPrivate == 'true') {
				html += '<a href="#" class="public pull-right" onclick="makePrivate(\'reference\',\'' + data.concept_id + '\', \'' + references[i].id + '\', \'false\')" title="Private">';
				html += '<img src="/images/private.png"></a>';
			} else {
				html += '<a href="#" class="public pull-right" onclick="makePrivate(\'reference\',\'' + data.concept_id + '\', \'' + references[i].id + '\', \'true\')" title="Public">';
				html += '<img src="/images/public.png"></a>';
			}

			html += '<div class="mark-default pull-right">';
			if (references[i].isDefault == 'true') {
				html += '<a href="#" title="Default">';
				html += '<img src="/images/default.png"></a>';
			} else {
				html += '<a href="#" onclick="makeDefault(\'reference\', \'' + data.concept_id + '\', \'' + references[i].id + '\')" title="Undefault">';
				html += '<img src="/images/undefault.png"></a>';
			}
			html += '</div>';
		} else {
			html += '<a href="#" class="public pull-right" onclick="$(location).attr(\'href\', \'/setprivate\')" title="Public">';
			html += '<img src="/images/public.png"></a>';
			html += '<div class="mark-default pull-right">';
			if (references[i].isDefault == 'true') {
				html += '<a href="#" title="Default">';
				html += '<img src="/images/default.png"></a>';
			} else {
				html += '<a href="#" onclick="$(location).attr(\'href\', \'/setdefault\')" title="Undefault">';
				html += '<img src="/images/undefault.png"></a>';
			}
			html += '</div>';
		}

		html += '<div class="content">';

		if (references[i].title != '')
			html += '<p class="reference-item-title">' + references[i].title + '</p>';
		if (references[i].description != '')
			html += '<p class="reference-item-description">' + references[i].description + '</p>';
		html += '<a href="' + references[i].url + '" class="reference-item-link"  target="_blank">' + domain + '</a></div></div>';
		html += '<div class="description">';
		if (references[i].shared_count > 0)
			html += '<p class="pull-right add-count">Added ' + references[i].shared_count + ' times</p>';
		html += '</div>';
		$(html).insertBefore(addId);
	}
}

function parseNotes(data) {
	var notes = data.notes;
	var addId = '#note-add-' + data.concept_id;
	var noteId = '#note-' + data.concept_id;
	var len = notes.length;

	for (var i = 0; i < len; i++) {
		var html = '<div class="content-item">';
		html += '<div class="note-item full-width inline-block">';
		html += '<div class="person pull-left">';
		html += '<img src="' + notes[i].owner_photo + '" title="' + notes[i].owner_name + '">';
		html += '<p class="person-name">' + notes[i].owner_name + '</p></div>';

		if (userid != '') {
			html += '<a href="#" class="public pull-right" onclick="deleteContent(\'note\', \'' + notes[i].id + '\')" title="Delete">';
			html += '<img src="/images/delete.png"></a>';

			if (notes[i].isPrivate == 'true') {
				html += '<a href="#" class="public pull-right" onclick="makePrivate(\'note\',\'' + data.concept_id + '\', \'' + notes[i].id + '\', \'false\')" title="Private">';
				html += '<img src="/images/private.png"></a>';
			} else {
				html += '<a href="#" class="public pull-right" onclick="makePrivate(\'note\',\'' + data.concept_id + '\', \'' + notes[i].id + '\', \'true\')" title="Public">';
				html += '<img src="/images/public.png"></a>';
			}

			html += '<div class="mark-default pull-right">';
			if (notes[i].isDefault == 'true') {
				html += '<a href="#" title="Default">';
				html += '<img src="/images/default.png"></a>';
			} else {
				html += '<a href="#" onclick="makeDefault(\'note\', \'' + data.concept_id + '\', \'' + notes[i].id + '\')" title="Undefault">';
				html += '<img src="/images/undefault.png"></a>';
			}
			html += '</div>';
		}

		html += '<div class="content">';
		html += '<p class="note-item-date inline-block">' + notes[i].date + '</p>';
		html += '<p class="note-content">' + notes[i].note + '</p></div></div>';
		html += '<div class="description">';
		if (userid != '' && notes[i].shared_count > 0)
			html += '<p class="pull-right add-count">Added ' + notes[i].shared_count + ' times</p>';

		html += '</div></div>';

		if (userid != '' && notes[i].isDefault == 'true' && $(noteId).find('.content-item').length > 0) {
			$(html).insertBefore($(noteId).find('.content-item')[0]);
		} else
			$(html).insertBefore(addId);
	}
}

function playVideo(elem) {
	$('#video-modal').attr('data-video-url', $(elem).attr('data-video-url'));
	$('#video-modal').modal('toggle');
}

function showAddVideoModal(concept_id) {
	$('#video-add-modal input').attr('data-concept-id', concept_id);
	$('#video-add-modal').modal('toggle');
}

function setPrivateVideo() {
	if ($('#video-add-modal input').attr('data-private') == 'true'){
		$('#video-add-modal input').attr('data-private', 'false');
		$('#video-add-modal img').attr('src', '/images/public.png');
	} else {
		$('#video-add-modal input').attr('data-private', 'true');
		$('#video-add-modal img').attr('src', '/images/private.png');
	}
}

function addVideo() {
	$('#video-add-form').validator('validate');
	setTimeout (
		function(){
			if ($('#video-add-form .has-error').length > 0)
				return;

			$('#video-add-form').submit();
		},
		100
	);
}

function submitVideo(event){
	event.preventDefault();
	var concept_id = $('#video-add-modal input').attr('data-concept-id');
	$('#video-add-modal').modal('hide');
	$('#wait').removeClass('hidden');
	$.ajax({
		type: 'POST',
		url: '/addvideo',
		data: {
			'concept_id': concept_id,
			'url': $('#video-add-modal input').val(),
			'isPrivate': $('#video-add-modal input').attr('data-private')
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

/*
 * params:
 * 		content_type: video, reference, note
 */
function makeDefault(content_type, concept_id, content_id) {
	$('#wait').removeClass('hidden');
	$('#alert-modal').addClass('hidden');

	$.ajax({
		type: 'POST',
		url: '/setdefault',
		data: {
			'concept_id': concept_id,
			'content_type': content_type,
			'content_id': content_id
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

/*
 * params:
 * 		content_type: video, reference, note
 */
function makePrivate(content_type, concept_id, content_id, isPrivate) {
	$('#wait').removeClass('hidden');
	$('#alert-modal').addClass('hidden');

	$.ajax({
		type: 'POST',
		url: '/setprivate',
		data: {
			'concept_id': concept_id,
			'content_type': content_type,
			'content_id': content_id,
			'isPrivate': isPrivate
		},
		success: function(res) {
			console.log(res);
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

function setPrivateReference(elem, concept_id) {
	var id = '#reference-add-' + concept_id + ' input';
	if ($(id).attr('data-private') == 'true') {
		$(elem).find('img').attr('src', '/images/public.png');
		$(id).attr('data-private', 'false');
	} else {
		$(elem).find('img').attr('src', '/images/private.png');
		$(id).attr('data-private', 'true');
	}
}

function addReference(concept_id) {
	var id = '#reference-add-' + concept_id + ' input';
	$('#wait').removeClass('hidden');
	$.ajax({
		type: 'POST',
		url: '/addreference',
		data: {
			'concept_id': concept_id,
			'reference': $(id).val(),
			'isPrivate': $(id).attr('data-private')
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

function setPrivateNote(elem, concept_id) {
	var id = '#note-add-' + concept_id + ' textarea';
	if ($(id).attr('data-private') == 'true') {
		$(elem).find('img').attr('src', '/images/public.png');
		$(id).attr('data-private', 'false');
	} else {
		$(elem).find('img').attr('src', '/images/private.png');
		$(id).attr('data-private', 'true');
	}
}

function addNote(concept_id) {
	var id = '#note-add-' + concept_id + ' textarea';
	$('#wait').removeClass('hidden');
	$.ajax({
		type: 'POST',
		url: '/addnote',
		data: {
			'concept_id': concept_id,
			'note': $(id).val(),
			'isPrivate': $(id).attr('data-private')
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

function changeContentTab(type) {
	$.ajax({
		type: 'GET',
		url: '/changecontenttype',
		data: {
			'type': type
		},
		success: function(res) {}
	});
}

function deleteContent(content_type, content_id) {
	$('#wait').removeClass('hidden');
	$.ajax({
		type: 'POST',
		url: '/deletecontent',
		data: {
			'content_type': content_type,
			'content_id': content_id
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

