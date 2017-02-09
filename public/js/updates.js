var countPerPage = 25;
var curPage = 1;
var updateContent = [];
var updateCount = 0;
var lastPage = 1;

function readUpdate() {
	$.ajax({
		url: '/read/update',
		type: 'POST',
		data: {},
		success: function(){
			getUpdatesCount();
		}
	});
}

function getUpdatesCount() {
	$('#wait').removeClass('hidden');
	$.ajax({
		url: 'get/updates/count',
		type: 'GET',
		data: {},
		success: function(res){
			$('#wait').addClass('hidden');
			if (res.status_code == 200) {
				updateCount = res.count;

				if (updateCount <= 0) {
					$('#show-bar').addClass('hidden');
					$('#page-btnset').addClass('hidden');
					$('#not-found').removeClass('hidden');
				} else {
					lastPage = (updateCount + countPerPage - 1) / countPerPage >> 0;
					goToPage(curPage);
				}
			}
		}
	});
}

function getUpdates() {
	//$('#wait').removeClass('hidden');
	$.ajax({
		url: 'get/updates',
		type: 'GET',
		data: {
			'after': (curPage - 1) * countPerPage,
			'count': countPerPage 
			},
		success: function(res) {
			//$('#wait').addClass('hidden');

			if (res.status_code == 200)
				parseUpdates(res.updates);
			else {
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
		}
	});
}

function parseUpdates(updates) {
	var len = updates.length;
	$('#updates .content-item').remove();
	updateContent = [];

	if (len <= 0)
		return;

	for (var i = 0; i < len; i++) {
		var action = '';
		var action_type = '';
		if (updates[i].type == 'joined') {
			action = 'View Profile';
			action_type = 'profile';
			updateContent.push(updates[i].profile);
		} else if (updates[i].type == 'added video' || updates[i].type == 'shared video') {
			action = 'Watch Video';
			action_type = 'video';
			updateContent.push(updates[i].content);
		} else if (updates[i].type == 'added reference' || updates[i].type == 'shared reference') {
			action = 'Read Reference';
			action_type = 'reference';
			updateContent.push(updates[i].content);
		} else if (updates[i].type == 'added note' || updates[i].type == 'shared note') {
			action = 'Read Note';
			action_type = 'note';
			updateContent.push(updates[i].content);
		}

		var html = '<div class="content-item">';
		html += '<div class="note-item full-width inline-block">';
		html += '<div class="person pull-left">';
		html += '<img src="' + updates[i].profile.photo + '" title="' + updates[i].profile.name + '"></div>';
		html += '<div class="content">';
		html += '<p class="note-item-date inline-block">' + updates[i].date + '</p>';
		html += '<p class="note-content">' + updates[i].text + '</p>';
		html += '<a href="#" class="btn btn-default btn-view-update pull-right" onclick="viewUpdate(\'' + action_type + '\', ' + i + ', \'' + updates[i].id + '\')">' + action + '</a>';

		if (updates[i].shareable == 'true') {
			html += '<a href="#" class="btn btn-default btn-share pull-right" onclick="shareContent(this, \'' + action_type + '\', \'' + updates[i].content_id + '\', \'' + updates[i].owner + '\')" title="Share">';
			html += '<img src="/images/share.png"></a>';
		}
		html += '</div></div></div>';

		$(html).insertBefore($('#page-btnset'))
	}
}

function viewUpdate(actionType, contentIndex, update_id) {
	if (actionType == 'video') {
		$('#video-modal').attr('data-video-url', updateContent[contentIndex]);
		$('#video-modal').modal('toggle');
	} else if (actionType == 'note') {
		$('#note-modal .modal-body').append('<p>' + updateContent[contentIndex] + '</p>');
		$('#note-modal').modal('toggle');
	} else if (actionType == 'profile') {
		$('#profile-modal .update_name').text(updateContent[contentIndex].name);
		$('#profile-modal .update_email').text(updateContent[contentIndex].email);
		$('#profile-modal .update_school_name').text(updateContent[contentIndex].school_name);
		$('#profile-modal .update_school_addr').text(updateContent[contentIndex].school_addr);

		if (updateContent[contentIndex].school_city == '')
			$('#profile-modal .update_school_city_country').text(updateContent[contentIndex].school_country);
		else
			$('#profile-modal .update_school_city_country').text(updateContent[contentIndex].school_city + ', ' + updateContent[contentIndex].school_country);

		$('#profile-modal .update_grade').text(updateContent[contentIndex].grade);
		$('#profile-modal .update_section').text(updateContent[contentIndex].section);
		$('#profile-modal .update_photo').attr('src', updateContent[contentIndex].photo);
		$('#profile-modal').modal('toggle');
	} else if (actionType == 'reference') {
		var win = window.open(updateContent[contentIndex], '_blank');
  		win.focus();
	}
}

function goToPage(page){
	var toPage = curPage;
	var start, end;

	if (page == 'first')
		toPage = 1;
	else if (page == 'prev' && curPage > 1)
		toPage--;
	else if (page == 'next' && curPage < lastPage)
		toPage++;
	else if (page == 'last')
		toPage = lastPage;
	else {
		toPage = page * 1;
	}

	// remove old page steps
	start = curPage - 2;
	if (start > lastPage - 4)
		start = lastPage - 4;
	if (start <= 0)
		start = 1;

	end = curPage + 2;
	if (end < 5)
		end = 5;
	if (end > lastPage)
		end = lastPage;

	for (var i = start; i <= end; i++) {
		var id = '.page-' + i;
		$(id).remove();
	}

	// add new page steps
	start = toPage - 2;
	if (start > lastPage - 4)
		start = lastPage - 4;
	if (start <= 0)
		start = 1;

	end = toPage + 2;
	if (end < 5)
		end = 5;
	if (end > lastPage)
		end = lastPage;

	for (var i = start; i <= end; i++) {
		var html;
		if (i == toPage)
			html = '<a class="btn btn-default page-selected page-' + i + '" disabled>' + i + '</a>';
		else
			html = '<a href="#" class="btn btn-default page-' + i + '" title="Page ' + i + '" onclick="goToPage(\'' + i + '\')">' + i + '</a>';

		$(html).insertBefore($('.page-next'));
	}

	if (toPage <= 1) {
		$('.page-first').attr('disabled', 'true');
		$('.page-prev').attr('disabled', 'true');
	} else {
		$('.page-first').removeAttr('disabled');
		$('.page-prev').removeAttr('disabled');
	}

	if (toPage >= lastPage) {
		$('.page-next').attr('disabled', 'true');
		$('.page-last').attr('disabled', 'true');
	} else {
		$('.page-next').removeAttr('disabled');
		$('.page-last').removeAttr('disabled');
	}

	start = (toPage - 1) * countPerPage + 1;
	end = toPage * countPerPage;
	if (end > updateCount)
		end = updateCount;
	
	$('#show-info').text(start + ' to ' + end + ' of Total ' + updateCount);

	curPage = toPage;
	getUpdates();
}

function shareContent(elem, content_type, content_id, classmate_id) {
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
				$(elem).remove();
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

function changeCountPerPage() {
	countPerPage = $('#count-per-page').val() * 1;
	if (countPerPage == -1)
		countPerPage = updateCount;

	// remove old page steps
	var start, end;
	start = curPage - 2;
	if (start > lastPage - 4)
		start = lastPage - 4;
	if (start <= 0)
		start = 1;

	end = curPage + 2;
	if (end < 5)
		end = 5;
	if (end > lastPage)
		end = lastPage;

	for (var i = start; i <= end; i++) {
		var id = '.page-' + i;
		$(id).remove();
	}

	lastPage = (updateCount + countPerPage - 1) / countPerPage >> 0;
	goToPage(1);
}

function reportUser() {
	var alertElem = '<div class="alert alert-success alert-dismissable">';
	alertElem += '<p>Succeeded to report user.</p></div>';
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

$(document).ready(function(){
	readUpdate();

	$('#video-modal').on('show.bs.modal', function(){ 
		var html = '<iframe width="100%" height="300" src="http://www.youtube.com/embed/' + $(this).attr('data-video-url') + '" frameborder="0" allowfullscreen=""></iframe>';
		$(this).find('.modal-body').append(html);
	});

	$('#video-modal').on('hidden.bs.modal', function(){
		$(this).find('.modal-body').empty();
	});

	$('#note-modal').on('hidden.bs.modal', function(){
		$(this).find('.modal-body').empty();
	});
});

