var added_videos = [];
var notes = [];
var reportOption = '';
var youtubeInfoUrl = 'https://www.googleapis.com/youtube/v3/videos?part=snippet%2C+contentDetails%2C+statistics&id=';
var youtubeSearchUrl = 'https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=15&q=';
var clientKey = 'AIzaSyAzPYLRYina5ozWsy1673GD0JiOVl9BDSQ';
var rich, editor;

function onChapterChanged() {
	var chapterSelect = $('#chapters-list');
	var chapter_id = $(chapterSelect).val();

	$(location).attr('href', '/lessons?syllabus=' + concept.syllabus + '&grade=' + concept.grade + '&chapter=' + chapter_id);
}

function makeEditor () {
    editor = null;
    editor = new Quill('#full-editor', {
        modules: {
            'toolbar': { container: '#toolbar' }
        },
        theme: 'snow'
    });
}

function showDefaultVideo() {
	var html = '<script ';
	html += ' type="text/javascript"';
	html += ' src="' + youtubeInfoUrl + default_video.url + '&key=' + clientKey + '&callback=parseYoutubeInfo">';
	html += ' </script>';

	html += '<iframe class="defvid" src="https://www.youtube.com/embed/' + default_video.url + '" frameborder="0" allowfullscreen=""></iframe>';
	
	$('#default-video .concept-video').append(html);
}

function _showVideo(video) {
	//console.log(video);

	var html = '<div class="sm-video-block">';

	html += '<script ';
	html += ' type="text/javascript"';
	html += ' src="' + youtubeInfoUrl + video.url + '&key=' + clientKey + '&callback=parseYoutubeInfo">';
	html += ' </script>';

	html += '<div item_id="' + video.id + '" class="sm-video" onmouseover="onMouseContent(this, true)" onmouseout="onMouseContent(this, false)">';

	if (userid !== '') {
		html += '<div id="pin-' + video.id + '" class="mark-pin hidden">';
		html += '<a href="#" onclick="setDefault(\'video\', \'' + video.id + '\')">';
		html += '<img src="/images/icon-tick.png">';
		html += '</a></div>';
	
	
		if (video.owner == userid) {
			html += '<div id="del-' + video.id + '" class="mark-delete hidden">';
			html += '<a href="#" onclick="deleteContent(\'video\', \'' + video.id + '\', this)">';
			html += '<img src="/images/delete.png">';
			html += '</a></div>';
		} else if (video.owner != 'admin') {
			// html += '<div id="flag-' + video.id + '" class="mark-flag hidden">';
			// html += '<a href="#" onclick="viewUser(\'video\', \'' + video.id + '\')">';
			// html += '<img src="/images/flag.png">';
			// html += '</a></div>';
		}
	}

	html += '<a href="#" data-video-url="' + video.url + '" onclick="playVideo(\'' + video.url + '\')">';
	html += '<img src="https://img.youtube.com/vi/' + video.url + '/0.jpg" class="full-width"></a>';

	html += '</div>';

	html += '<div id="video-info-' + video.url + '" class="sm-video-info">';
	html += '<p class="video-title">Video Title</p>';
	html += '<p class="author">By Uploader</p>';
	html += '<p class="viewCounts">2472 Views</p>';
	html += '</div>';

	html += '</div>';

	console.log(html);

	$('#added-videos .videos').append(html);
}

function showAddedVideos() {
	var len = added_videos.length;

	if (len > 6)
		len = 6;

	for (var i = 0; i < len; i ++) {
		var video = added_videos[i];

		_showVideo(video);
	}

}

function playVideo(video_id) {
	$('#video-modal').attr('data-video-url', video_id);
	$('#video-modal').modal('toggle');
}

function checkDuplicateVideo(video_id) {
	if (!video_id || video_id == '')
		return false;

	if (video_id == default_video.url)
		return false;

	if (!added_videos)
		return true;

	var videos_len = added_videos.length;

	for (var i = 0; i < videos_len; i++) {
		var added_video = added_videos[i];

		if (video_id == added_video.url)
			return false;
	}

	return true;
}

function showRelatedVideo(entry) {

	var author = entry.snippet.channelTitle;
	var title = entry.snippet.title;
	var views = '-- views';
	var video_id = entry.id.videoId;

	var html = '<div class="sm-video-block">';

	html += '<script ';
	html += ' type="text/javascript"';
	html += ' src="' + youtubeInfoUrl + video_id + '&key=' + clientKey + '&callback=parseYoutubeInfo">';
	html += ' </script>';

	html += '<div item_id="' + video_id + '" class="sm-video" onmouseover="onMouseContent(this, true)" onmouseout="onMouseContent(this, false)">';

	if (userid !== '') {
		html += '<div id="add-' + video_id + '" class="mark-sm-add hidden">';
		html += '<a href="#" onclick="addVideo(event, this, \'' + video_id + '\')">';
		html += '<img src="/images/share.png">';
		html += '</a></div>';
	}
	
	
	html += '<a href="#" data-video-url="' + video_id + '" onclick="playVideo(\'' + video_id + '\')">';
	html += '<img src="https://img.youtube.com/vi/' + video_id + '/0.jpg" class="full-width"></a>';
	html += '</div>';

	html += '<div id="video-info-' + video_id + '" class="sm-video-info">';
	html += '<b><p class="video-title">' + title + '</p></b>';
	html += '<p class="author">By ' + author + '</p>';
	html += '<p class="viewCounts">' + views + ' Views</p>';
	html += '</div>';

	html += '</div>';

	$('#related-videos').append(html);
}

function parseYoutubeInfo (data) {
	var item = data.items[0];
	
	var author = item.snippet.channelTitle;
	var title = item.snippet.title;
	var views = item.statistics.viewCount;
	var video_id = item.id;

	$('#video-info-' + video_id + ' .video-title').text(title);
	$('#video-info-' + video_id + ' .author').text('By ' + author);
	$('#video-info-' + video_id + ' .viewCounts').text(views + ' Views');
}

function parseSearchVideos (data) {
	var entries = data.items || [];

	var len = entries.length;
	var count = 0;
	
 	for (var i = 0; i < len; i++) {
		var entry = entries[i];
		var video_id = entry.id.videoId;

		if (!checkDuplicateVideo(video_id))
			continue;

		showRelatedVideo(entry);

		count ++;
		if (count >= 5)
			break;
	}
}

function onMouseContent(element, isOver) {
	var item_id = $(element).attr('item_id');

	var pinElem_id = '#pin-' + item_id;
	var pinElem = $(pinElem_id);
	var flagElem_id = '#flag-' + item_id;
	var flagElem = $(flagElem_id);
	var delElem_id = '#del-' + item_id;
	var delElem = $(delElem_id);
	var addElem_id = '#add-' + item_id;
	var addElem = $(addElem_id);

	if (isOver == true) {
		pinElem.removeClass('hidden');
		flagElem.removeClass('hidden');
		delElem.removeClass('hidden');
		addElem.removeClass('hidden');
	} else {
		pinElem.addClass('hidden');
		flagElem.addClass('hidden');
		delElem.addClass('hidden');
		addElem.addClass('hidden');
	}
}

function searchRelatedVideos() {
	var query = concept_name;
	var html = '<script ';
	html += ' type="text/javascript"';
	html += ' src="' + youtubeSearchUrl + query + '&key=' + clientKey + '&callback=parseSearchVideos">';
	html += ' </script>';

	$('#related-videos').append(html);

}

function viewUser(content, content_id) {
	
	var userInfo = {};
	var photo;

	if (content == 'video') {
		for (var i = 0; i < added_videos.length; i++) {
			if (added_videos[i].id == content_id) {
				video = added_videos[i];

				userInfo.id = video.owner;
				userInfo.name = video.owner_name;
				userInfo.photo = video.owner_photo;
				userInfo.email = video.owner_email;
				userInfo.school = video.owner_school;
				userInfo.addr = video.owner_location;
				userInfo.grade = video.owner_grade;
				userInfo.section = video.owner_section;
				userInfo.rcv_update = video.owner_rcv_update;
				break;
			}
		}
	} else if (content == 'note') {
		for (var i = 0; i < notes.length; i++) {
			if (notes[i].id == content_id) {
				note = notes[i];

				userInfo.id = note.owner;
				userInfo.name = note.owner_name;
				userInfo.photo = note.owner_photo;
				userInfo.email = note.owner_email;
				userInfo.school = note.owner_school;
				userInfo.addr = note.owner_location;
				userInfo.grade = note.owner_grade;
				userInfo.section = note.owner_section;
				userInfo.rcv_update = note.owner_rcv_update;
				break;
			}
		}
	} else {
		return;
	}

	if (!userInfo || !userInfo.id || userInfo.id == '')
		return;

	if (userInfo.name == 'Admin')
		return;

	showReportOption(false);

	$('#user-modal .name').text(userInfo.name);
	$('#user-modal .name').attr('classmate_id', userInfo.id);
	$('#user-modal .school-name').text(userInfo.school);
	$('#user-modal .location').text(userInfo.addr);
	$('#user-modal .grade-section').text(userInfo.grade + 'th Grade, Section ' + userInfo.section);
	$('#user-modal .email').text(userInfo.email);
	if (userInfo.photo == '')
		photo = '/images/guest.png';
	else
		photo = userInfo.photo;

	$('#user-modal .user-photo').attr('src', photo);

	if (userInfo.rcv_update == 'true') {
		$('.on-off-btnset .btn-success').show();
		$('.on-off-btnset .btn-default').hide();
	} else {
		$('.on-off-btnset .btn-success').hide();
		$('.on-off-btnset .btn-default').show();
	}

	$('#user-modal').modal('toggle');
}

function showReportOption(show) {
	if (show) {
		$('#report-user').addClass('hidden');
		$('#report-options').removeClass('hidden');
		$('#report-options textarea').addClass('hidden');
//		$('#report-options input[type="radio"]').attr('checked', false);
		$('#report-bad-content').prop('checked', true);
		reportOption = 'Bad Content';
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
	var classmate_id = 	$('#user-modal .name').attr('classmate_id');

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

function setDefault(content_type, content_id) {
	$('#wait').removeClass('hidden');
	$('#alert-modal').addClass('hidden');

	$.ajax({
		type: 'POST',
		url: '/setdefault',
		data: {
			'concept_id': concept.concept,
			'content_type': content_type,
			'content_id': content_id
		},
		success: function(res) {
			$('#wait').addClass('hidden');
			var alertElem;

			if (res.status_code == 200) {
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
					if (res.status_code == 200)
						location.reload();
				},
				1200
			);
		}
	});
}

function addNote() {
	console.log(editor.getText());
	if (!editor.getText() || /^\s*$/.test(editor.getText())) {

		return;
	}
	var id = '#added-note';
	$('#wait').removeClass('hidden');
	$('#alert-modal').addClass('hidden');

	

	$.ajax({
		type: 'POST',
		url: '/addnote',
		data: {
			'concept_id': concept.concept,
			'note': editor.getHTML(),
			'isPrivate': 'false'
		},
		success: function(res) {
			$('#wait').addClass('hidden');
			var alertElem;

			if (res.status_code == 200) {
				alertElem = '<div class="alert alert-success alert-dismissable">';
				$(id).val('');
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
					if (res.status_code == 200)
						location.reload();
				},
				1500
			);
		}
	});
}

function addVideo(event, element, video_url) {
	
	event.preventDefault();
	event.stopPropagation();

	if (video_url == '')
		return;

	$('#wait').removeClass('hidden');

	var videoUrl = 'https://www.youtube.com/watch?v=' + video_url;

	$.ajax({
		type: 'POST',
		url: '/addvideo',
		data: {
			'concept_id': concept.concept,
			'url': videoUrl,
			'isPrivate': 'false'
		},
		success: function(res) {
			$('#wait').addClass('hidden');
			var alertElem;

			if (res.status_code == 200) {

				var new_video = {
					'id':res.id,
					'url': video_url,
					'date': 'Today',
					'owner': userid,
					'owner_name': user.name,
					'owner_photo': user.photo,
					'owner_email': '',
					'owner_school': '',
					'owner_location': '',
					'owner_grade': '',
					'owner_section': '',
					'owner_rcv_update':''
				};
				added_videos.push(new_video);
				
				$(element).parent().parent().parent().remove();

				_showVideo(new_video);


				alertElem = '<div class="alert alert-success alert-dismissable">';
			}
			else {
				alertElem = '<div class="alert alert-danger alert-dismissable">';
			}

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
		},
		error: function (req, status, err) {

			$('#wait').removeClass('hidden');

			var alertElem;
			alertElem += '<p>' + err.message + '</p></div>';
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

function deleteContent(content_type, content_id, element) {

	if (content_type == 'video')
		$(element).parent().parent().parent().remove();
	else if (content_type == 'note')
		$(element).parent().parent().remove();

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

					if (content_type == 'note') {
						window.location.reload();
					}
				},
				3000
			);
		}
	});
}

function onMoreDescription(element) {
	var action = $(element).attr('data-action');

	if (action == 'more') {
		$(element).attr('data-action', 'less');
		$(element).text('Less');

		$('#description').css('height', 'auto');
		$('#description').css('overflow', 'visible');
	}
	else if (action == 'less') {
		$(element).attr('data-action', 'more');
		$(element).text('More');

		$('#description').css('height', '140px');
		$('#description').css('overflow', 'hidden');
	}
}

$(document).ready(function(){
  $('#rich-editor').removeClass('hidden');
  if (typeof user !== 'undefined') {
  	makeEditor();
  }
  
	$('#video-modal').on('show.bs.modal', function(){ 
		var html = '<iframe width="100%" height="300" src="https://www.youtube.com/embed/' + $(this).attr('data-video-url') + '" frameborder="0" allowfullscreen=""></iframe>';
		$(this).find('.modal-body').append(html);
	});

	$('#video-modal').on('hidden.bs.modal', function(){
		$(this).find('.modal-body').empty();
	});
	
	$('#nav-chapter').html(chapter_name + ' > ');

	showDefaultVideo();
	
	showAddedVideos();

	searchRelatedVideos();
	$("#default-video").fitVids();

	$('#loadnotes').on('click', function () {
		$('#send-response').removeClass('responses-collapsed');
		$('.concept-note.responses').removeClass('responses-collapsed');
	});
});
