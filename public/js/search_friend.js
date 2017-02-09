var isSearching = false;
var isAdding = false;
var search_text = '';

function searchFriend() {
	search_text = $('#search-input').val();
	search_text = search_text.replace(/^\s+/, '');
	search_text = search_text.replace(/\s+$/, '');

	if (search_text == '') {
		return;
	}

	if (isSearching == true)
		return;

	$('#searched-friend').empty();
	$('#not-found').addClass('hidden');
	$('#not-found-email').addClass('hidden');

	_searchFriend();
}

function _searchFriend() {
	isSearching = true;
	$.ajax({
		url: '/search/users',
		type: 'GET',
		data: {'search_text': search_text},
		success: function(res){
			isSearching = false;

			if (search_text != res.search_text) {
				_searchFriend();
				return;
			}

			if (res.status_code == 200)
				parseSearchUsers(res);
			else {
				alertElem = '<div class="alert alert-success alert-dismissable">';
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
		},
		error: function(req, status, err) {
			isSearching = false;
		}
	});
}

function parseSearchUsers(data) {
	users_len = data.users.length;
	if (users_len <= 0) {
		var re = /\S+@\S+\.\S+/;
		var html = '<p>' + data.search_text;

		if (re.test(data.search_text)) {
			$('#not-found-email').removeClass('hidden');
			$('#txt-email').html(data.search_text);
			$('#invite-block').removeClass('hidden');
			$('#tick-invite').addClass('hidden');
		} else {
			$('#not-found').removeClass('hidden');
		}

		return;
	}

	for (var i = 0; i < users_len; i++) {
		var user = data.users[i];

		if (user.school_location == '')
			user.school_location = '--';
		if (!user.grade || user.grade == '')
			user.grade = '--';

		var html = '<div class="search-friend-block">';
		
		/* user photo/name area */
		html += '<div id="item-' + user.id + '" friend_id="' + user.id + '" class="classmate-item clearfix" onmouseover="onMouseFriend(this, true)" onmouseout="onMouseFriend(this, false)">';

		if (user.isFriend == 'true') {

			html += '<div id="tick-' + user.id + '" class="mark-tick">';
			html += '<img src="/images/icon-tick.png"></div>';

			html += '<div id="remove-friend-' + user.id + '" class="pull-right remove-friend hidden" >';
			html += '<a href="#" title="Remove From Friends" onclick="removeFromFriends(event, \'' + user.id + '\')">';
			html += '<img src="/images/delete.png">';
			html += '</a></div>';

		} else if (user.isFriend == 'false') {
			html += '<div id="add-friend-' + user.id + '" class="pull-right remove-friend hidden" >';
			html += '<a href="#" title="Add To Friends" onclick="AddToFriends(event, \'' + user.id + '\')">';
			html += '<img src="/images/share.png">';
			html += '</a></div>';
		}

		if (user.isFriend == '') {
			html += '<div class="user-photo"><a href="#" title="This user is a classmate or grademate.">';
		} else {
			html += '<div class="user-photo"><a href="#">';
		}

		if (user.photo && (typeof user.photo != 'undefined') && (typeof user.photo != 'object') && (user.photo != 'undefined')) {
			html += '<img src="' + user.photo + '">';
			console.log(typeof user.photo);
		} else{
			html += '<img src="/images/guest.png">';
		}
		
		html += '</a></div>';
		

		/* user details area */
		html += '<div id="info-' + user.id + '"class="search-video-info">';

		html += '<div id="adding-' + user.id + '" class="mark-add hidden">';
		html += '<a href="#">';
		html += '<img src="/images/adding-friend.png">';
		html += '</a></div>';

		html += '<p class="name">' + user.name + '</p>';
		html += '<p class="school">' + user.grade + 'th Grade, Section ' + user.section + ',' + user.school_name + '</p></div>';
		html += '</div>';
		$('#searched-friend').append(html);
	}
}

function invite() {
	var mail_address = search_text;

	$('#wait').removeClass('hidden');
	$.ajax({
		url: '/invite',
		type: 'POST',
		data: {'mail': mail_address},
		success: function(res) {
			var alertElem;
			$('#wait').addClass('hidden');

			if (res.status_code == 200){
				alertElem = '<div class="alert alert-success alert-dismissable">';
	
				$('#invite-block').addClass('hidden');
				$('#tick-invite').removeClass('hidden');
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
		}
	});
}

function friendChanged(user_id, isAdded) {
	
	var addElem = $('#add-friend-' + user_id);
	var removeElem = $('#remove-friend-' + user_id);
	var tickElem = $('#tick-' + user_id);
	var addingElem = $('#adding-' + user_id);

	if (isAdded == true) {
		addElem.remove();

		var html = '<div id="tick-' + user_id + '" class="mark-tick">';
		html += '<img src="/images/icon-tick.png"></div>';

		html += '<div id="remove-friend-' + user_id + '" class="pull-right remove-friend hidden" >';
		html += '<a href="#" title="Remove From Friends" onclick="removeFromFriends(event, \'' + user_id + '\')">';
		html += '<img src="/images/delete.png">';
		html += '</a></div>';

		var userBlock = $('#item-' + user_id);
		userBlock.append(html);
	} else if (isAdded == false) {
		tickElem.remove();
		removeElem.remove();

		var html = '<div id="add-friend-' + user_id + '" class="pull-right remove-friend hidden" >';
		html += '<a href="#" title="Add To Friends" onclick="AddToFriends(event, \'' + user_id + '\')">';
		html += '<img src="/images/share.png">';
		html += '</a></div>';
		
		var userBlock = $('#item-' + user_id);
		userBlock.append(html);
	}
}

function onMouseFriend(element, isOver) {
	var friend_id = $(element).attr('friend_id');

	var addElem_id = '#add-friend-' + friend_id;
	var addElem = $(addElem_id);
	var removeElem_id = '#remove-friend-' + friend_id;
	var removeElem = $(removeElem_id);

	if (isOver == true) {
		addElem.removeClass('hidden');
		removeElem.removeClass('hidden');
	} else {
		addElem.addClass('hidden');
		removeElem.addClass('hidden');
	}
}

function AddToFriends(event, user_id) {

	event.preventDefault();
	event.stopPropagation();

	var addingElem = $('#adding-' + user_id);

	addingElem.removeClass('hidden');

	$.ajax({
		url: '/add/friend',
		type: 'POST',
		data: {'user_id': user_id},
		success: function(res) {
			var alertElem;
			if (res.status_code == 200) {
				friendChanged(user_id, true);
				alertElem = '<div class="alert alert-success alert-dismissable">';

				alertElem += '<p>Friend was added successfully.</p></div>';
				$('#alert-modal').empty();
				$('#alert-modal').append(alertElem);
				$('#alert-modal').removeClass('hidden');
			}
			else {
				
				alertElem = '<div class="alert alert-danger alert-dismissable">';

				alertElem += '<p>' + res.message + '</p></div>';
				$('#alert-modal').empty();
				$('#alert-modal').append(alertElem);
				$('#alert-modal').removeClass('hidden');

				
			}

			setTimeout(
				function(){
					$('#alert-modal').addClass('hidden');
				},
				3000
			);
			
			addingElem.addClass('hidden');
		}
	});
}

function removeFromFriends(event, user_id) {
	
	event.preventDefault();
	event.stopPropagation();

	$.ajax({
		url: '/remove/friend',
		type: 'POST',
		data: {'user_id': user_id},
		success: function(res) {

			if (res.status_code == 200) {
				friendChanged(user_id, false);
			}
			else {
				var alertElem;
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

function goBack(){
	$(location).attr('href', '/lessons?syllabus=' + lesson.syllabus + '&grade=' + lesson.grade + '&chapter=' + lesson.chapter);
}

$(document).ready(function(){

	$('#search-input').keydown(function(e) {
		if (e.which == 13)
			searchFriend();
	});
});

