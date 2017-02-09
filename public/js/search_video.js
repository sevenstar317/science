var isSearching = false;
var isAdding = false;
var added_videos = [];
var added_videos = [];
var youtubeInfoUrl = 'https://www.googleapis.com/youtube/v3/videos?part=snippet%2C+contentDetails%2C+statistics&id=';
var youtubeSearchUrl = 'https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=15&q=';
var clientKey = 'AIzaSyAzPYLRYina5ozWsy1673GD0JiOVl9BDSQ';

function onChapterChanged() {
	var chapterSelect = $('#chapters-list');
	var chapter_id = $(chapterSelect).val();

	$(location).attr('href', '/lessons?syllabus=' + concept.syllabus + '&grade=' + concept.grade + '&chapter=' + chapter_id);
}

function showSearchVideo(entry) {

	var author = entry.snippet.channelTitle;
	var title = entry.snippet.title;
	var views = '-- views';
	var kind = entry.id.kind;
	var video_id = '';
	if (kind == 'youtube#playlist')
		video_id = entry.id.playlistId;
	else if (kind == 'youtube#video')
		video_id = entry.id.videoId;
	var desc = entry.snippet.description;

	var isAdded = !checkDuplicateVideo(video_id);

	var html = '<div " item_id="' + video_id + '" class="search-video-block clearfix" onmouseover="onMouseContent(this, true)" onmouseout="onMouseContent(this, false)">';
	html += '<script ';
	html += ' type="text/javascript"';
	html += ' src="' + youtubeInfoUrl + video_id + '&key=' + clientKey + '&callback=parseYoutubeInfo">';
	html += ' </script>';

	html += '<div id="video-' + video_id + '" class="search-video" >';
	if (isAdded)
		html += '<div id="tick-' + video_id + '" class="mark-tick">';
	else
		html += '<div id="tick-' + video_id + '" class="mark-tick hidden">';

	html += '<a href="#">';
	html += '<img src="/images/icon-tick.png">';
	html += '</a></div>';

	if (!isAdded) {
		html += '<div id="add-video-' + video_id + '" class="mark-sm-add hidden">';
		html += '<a href="#" onclick="addVideo(event, \'' + video_id + '\')">';
		html += '<img src="/images/share.png">';
		html += '</a></div>';
	}

	html += '<a href="#" data-video-url="' + video_id + '" onclick="playVideo(\'' + video_id + '\')">';
	html += '<img src="http://img.youtube.com/vi/' + video_id + '/0.jpg" class="full-width"></a>';

	html += '</div>';

	html += '<div id="video-info-' + video_id + '" class="search-video-info">';
	
	if (!isAdded) {
		// html += '<div id="add-video-not-use' + video_id + '" class="mark-add hidden">';
		// html += '<a href="#" onclick="addVideo(event, \'' + video_id + '\')">';
		// html += '<img src="/images/add-video-r.png">';
		// html += '</a></div>';
		
		// html += '<div id="adding-video-' + video_id + '" class="mark-add hidden">';
		// html += '<a href="#" >';
		// html += '<img src="/images/adding-video.png">';
		// html += '</a></div>';
	}

	html += '<p class="video-title">' + title + '</p>';
	html += '<p class="author">By ' + author + '</p>';
	html += '<p class="description">' + desc + '</p>';
	html += '<p class="viewCounts">' + views + ' Views</p>';
	html += '</div>';

	html += '</div>';

	$('#searched-video').append(html);
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

function checkDuplicateVideo(video_id) {
	if (!video_id || video_id == '')
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

function playVideo(video_id) {
	$('#video-modal').attr('data-video-url', video_id);
	$('#video-modal').modal('toggle');
}

function parseSearchVideos (data) {
	var entries = data.items || [];

	var len = entries.length;
	
 	for (var i = 0; i < len; i++) {
		var entry = entries[i];

		showSearchVideo(entry);
	}
}

function _searchVideos(search_text) {
	
	if (isSearching == true)
		return;

	isSearching = true;

	//var search_url = 'http://gdata.youtube.com/feeds/api/videos?q=' + search_text + '&v=2&alt=json-in-script&format=5';
	var search_url = youtubeSearchUrl + search_text + '&key=' + clientKey;

	$('#searched-video').empty();
	$('#wait').removeClass('hidden');

	$.ajax({
		url: search_url,
		dataType: 'jsonp',
		success: function(res){
			isSearching = false;

			parseSearchVideos(res);

			$('#wait').addClass('hidden');
		},
		error: function(req, status, err) {
			isSearching = false;
			$('#wait').addClass('hidden');
		}
	});

}

function searchVideos() {

	var search_text = $('#search-input').val();
	search_text = search_text.replace(/^\s+/, '');
	search_text = search_text.replace(/\s+$/, '');

	if (search_text == '' || isSearching == true)
		return;

	_searchVideos(search_text);
}

function onMouseContent(element, isOver) {

	if (isAdding == true)
		return;

	var item_id = $(element).attr('item_id');

	var addElem_id = '#add-video-' + item_id;
	var addElem = $(addElem_id);

	if (!addElem)
		return;

	if (isOver == true) {
		addElem.removeClass('hidden');
	} else {
		addElem.addClass('hidden');
	}
}

function addVideo(event, video_id) {
	
	event.preventDefault();
	event.stopPropagation();

	if (video_id == '')
		return false;

	if (isAdding == true)
		return false;

	var addElem = $('#add-video-' + video_id);
	var addingElem = $('#adding-video-' + video_id);
	var tickElem = $('#tick-' + video_id);

	isAdding = true;

	addElem.addClass('hidden');
	addingElem.removeClass('hidden');

	var videoUrl = 'http://www.youtube.com/watch?v=' + video_id;

	$.ajax({
		type: 'POST',
		url: '/addvideo',
		data: {
			'concept_id': concept.concept,
			'url': videoUrl,
			'isPrivate': 'false'
		},
		success: function(res) {
			console.log('add success');
			var alertElem;

			isAdding = false;

			if (res.status_code == 200) {
				addElem.remove();
				addingElem.remove();

				tickElem.removeClass('hidden');

				added_videos.push({
					'id':'',
					'url': video_id,
					'date': '',
					'owner':'admin'
				});

				alertElem = '<div class="alert alert-success alert-dismissable">';
			}
			else {
				addElem.addClass('hidden');
				addingElem.addClass('hidden');

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
			isAdding = false;
			addElem.addClass('hidden');
			addingElem.addClass('hidden');
			console.log(err);

			var alertElem;
			addElem.addClass('hidden');
			addingElem.addClass('hidden');

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

$(document).ready(function(){

	$('#video-modal').on('show.bs.modal', function(){ 
		var html = '<iframe width="100%" height="300" src="http://www.youtube.com/embed/' + $(this).attr('data-video-url') + '" frameborder="0" allowfullscreen=""></iframe>';
		$(this).find('.modal-body').append(html);
	});

	$('#video-modal').on('hidden.bs.modal', function(){
		$(this).find('.modal-body').empty();
	});	

	$('#nav-chapter').text(chapter_name + ' >');
	$('#nav-concept').html('&nbsp; ' + concept_name + ' >');

	if (userid != '') {
		$('#search-input').keydown(function(e) {
			if (e.which == 13)
				searchVideos();
		});

		$('#search-input').val(concept_name);
		searchVideos();
	}
});

