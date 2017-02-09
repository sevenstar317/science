var classmates_len = -1;
var grademates_len = -1;
var friends_len = -1;
var isSearching = false;
var search_text = '';


function searchFriend() {
	search_text = $('#search').val();
	search_text = search_text.replace(/^\s+/, '');
	search_text = search_text.replace(/\s+$/, '');

	if (search_text == '') {
		if (classmates_len > 0)
			$('#classmates').removeClass('hidden');
		if (grademates_len > 0) {
			$('#grademates').removeClass('hidden');
			if (classmates_len > 0)
				$('#grademates').addClass('border');
			else
				$('#grademates').removeClass('border');
		}

		$('#search-result').addClass('hidden');
		$('#loading').addClass('hidden');
		$('#not-found').addClass('hidden');

		getFriends();

		return;
	}

	$('#loading').removeClass('hidden');
	$('#loading .wait-mark').removeClass('hidden');
	$('#loading .none-text').addClass('hidden');
	$('#not-found').addClass('hidden');
	$('#not-found p').remove();

	$('#classmates').addClass('hidden');
	$('#grademates').addClass('hidden');
	$('#friends').addClass('hidden');
	$('#search-result').addClass('hidden');
	$('#search-result .classmates').empty();

	if (isSearching == true)
		return;

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
				$('#loading').addClass('hidden');

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
			html += '<a href="#" onclick="invite(\'' + data.search_text + '\')"><img src="/images/share.png">INVITE</a>';
		}
		html += '</p>';

		$('#loading').addClass('hidden');
		$('#not-found').append(html);
		$('#not-found').removeClass('hidden');
		return;
	}

	for (var i = 0; i < users_len; i++) {
		var user = data.users[i];
		var html = '<div class="classmate-item center pull-left">';

		if (user.isFriend == 'false') {
			html += '<div id="add-friend-' + user.id + '" class="pull-right add-friend">';
			html += '<a href="#" onclick="AddToFriends(\'' + user.id + '\')" title="Add to Friends">';
			html += '<img src="/images/share.png"></a></div>';
		} else if (user.isFriend == 'true') {
			html += '<div id="remove-friend-' + user.id + '" class="pull-right add-friend">';
			html += '<a href="#" onclick="removeFromFriends(\'' + user.id + '\')" title="Remove From Friends">';
			html += '<img src="/images/delete.png"></a></div>';
		}

		html += '<div><a href="#" onclick="onClickUser(event, \'' + user.id + '\')">';
		html += '<img class="user-photo" src="' + user.photo + '">';
		html += '<p>' + user.name + '</p></a></div>';

		$('#search-result .classmates').append(html);
	}
	
	$('#classmates').addClass('hidden');
	$('#grademates').addClass('hidden');
	$('#friends').addClass('hidden');
	$('#search-result').removeClass('hidden');
	$('#loading').addClass('hidden');
}

function invite(mail_address) {
	$('#wait').removeClass('hidden');
	$.ajax({
		url: '/invite',
		type: 'POST',
		data: {'mail': mail_address},
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

function hideLoadingMark(){
	if (classmates_len != 0 ||
		grademates_len != 0 ||
		friends_len != 0)
		return;
	
	$('#loading .wait-mark').addClass('hidden');
	$('#loading .none-text').removeClass('hidden');
}

function getClassmates() {
	$.ajax({
		url: '/get/classmates',
		type: 'GET',
		data: {},
		success: function(res){
			if (res.status_code == 200)
				parseClassmates(res);
			else
				classmates_len = 0;

			hideLoadingMark();
		}
	});
}

function parseClassmates(data) {
	classmates_len = data.classmates.length;
	if (classmates_len <= 0) {
		return;
	}

	/*
	var grade_str = 'Grade ' + data.grade + ' Section ' + data.section;
	$('#classmates .school-name').text(data.school_name);
	$('#classmates .grade').text(grade_str);
	*/

	for (var i = 0; i < classmates_len; i++) {
		var classmate = data.classmates[i];
		var html = '<div class="classmate-item center pull-left">';
		html += '<a href="#" onclick="onClickUser(event, \'' + classmate.id + '\')">';
		html += '<img class="user-photo" src="' + classmate.photo + '">';
		html += '<p>' + classmate.name + '</p></a>';

		$('#classmates .classmates').append(html);
	}

	$('#classmates').removeClass('hidden');
	$('#grademates').addClass('border');
	$('#friends').addClass('border');
	$('#loading').addClass('hidden');
}

function getGrademates() {
	$.ajax({
		url: '/get/grademates',
		type: 'GET',
		data: {},
		success: function(res){
			if (res.status_code == 200)
				parseGrademates(res);
			else
				grademates_len = 0;

			hideLoadingMark();
		}
	});
}

function parseGrademates(data) {
	grademates_len = data.grademates.length;
	if (grademates_len <= 0)
		return;

	/*
	var grade_str = 'Grade ' + data.grade;
	$('#grademates .school-name').text(data.school_name);
	$('#grademates .grade').text(grade_str);
	*/

	for (var i = 0; i < grademates_len; i++) {
		var grademate = data.grademates[i];
		var html = '<div class="classmate-item center pull-left">';
		html += '<a href="#" onclick="onClickUser(event, \'' + grademate.id + '\')">';
		html += '<img class="user-photo" src="' + grademate.photo + '">';
		html += '<p>' + grademate.name + '</p></a>';

		$('#grademates .classmates').append(html);
	}

	if (classmates_len > 0)
		$('#grademates').addClass('border')
	else
		$('#grademates').removeClass('border')
	$('#grademates').removeClass('hidden');
	$('#friends').addClass('border');
	$('#loading').addClass('hidden');
}

function getFriends() {
	$('#friends .classmates').empty();
	$('#friends').addClass('hidden');

	$.ajax({
		url: '/get/friends',
		type: 'GET',
		data: {},
		success: function(res){
			if (res.status_code == 200)
				parseFriends(res);
			else
				friends_len = 0;

			hideLoadingMark();
		}
	});
}

function parseFriends(data) {
	friends_len = data.friends.length;
	if (friends_len <= 0) {
		return;
	}

	for (var i = 0; i < friends_len; i++) {
		var friend = data.friends[i];
		var html = '<div id="friend-' + friend.id + '" friend_id="' + friend.id + '" class="classmate-item center pull-left" onmouseover="onMouseFriend(this, true)" onmouseout="onMouseFriend(this, false)" >';
		html += '<div><a href="#" onclick="onClickUser(event, \'' + friend.id + '\')">';
		html += '<img class="user-photo" src="' + friend.photo + '">';
		html += '<p>' + friend.name + '</p></a></div>';
		html += '<div id="remove-friend-' + friend.id + '" class="remove-friend hidden">';
		html += '<a href="#" onclick="removeFromFriends(\'' + friend.id + '\')" title="Remove From Friends">';
		html += '<img src="/images/delete.png"></a></div>';

		$('#friends .classmates').append(html);
	}

	if (classmates_len > 0 || grademates_len > 0)
		$('#friends').addClass('border');
	else
		$('#friends').removeClass('border');
	$('#friends').removeClass('hidden');
	$('#loading').addClass('hidden');
}

function onMouseFriend(element, isOver) {
	var friend_id = $(element).attr('friend_id');

	var removeElem_id = '#remove-friend-' + friend_id;
	var removeElem = $(removeElem_id);

	if (isOver == true) {
		removeElem.removeClass('hidden');
	} else {
		removeElem.addClass('hidden');
	}
}

function AddToFriends(user_id) {
	$('#wait').removeClass('hidden');
	$.ajax({
		url: '/add/friend',
		type: 'POST',
		data: {'user_id': user_id},
		success: function(res) {
			var alertElem;
			$('#wait').addClass('hidden');

			if (res.status_code == 200) {
				var id = '#add-friend-' + res.user_id;
				$(id).attr('id', 'remove-friend-' + res.user_id);
				id = '#remove-friend-' + res.user_id;
				$(id).empty();

				var html = '<a href="#" onclick="removeFromFriends(\'' + res.user_id + '\')" title="Remove From Friends">';
				html += '<img src="/images/delete.png"></a>';
				$(id).append(html);

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

function removeFromFriends(user_id) {
	$('#wait').removeClass('hidden');
	$.ajax({
		url: '/remove/friend',
		type: 'POST',
		data: {'user_id': user_id},
		success: function(res) {
			var alertElem;
			$('#wait').addClass('hidden');

			if (res.status_code == 200) {
				var id = '#friend-' + res.user_id;
				$(id).remove();

				id = '#remove-friend-' + res.user_id;
				$(id).attr('id', 'add-friend-' + res.user_id);
				id = '#add-friend-' + res.user_id;
				$(id).empty();

				var html = '<a href="#" onclick="AddToFriends(\'' + res.user_id + '\')" title="Add to Friends">';
				html += '<img src="/images/share.png"></a>';
				$(id).append(html);

				if ($('#friends .classmate-item').length <= 0)
					$('#friends').addClass('hidden');

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

function onClickUser (event, user_id) {
	event.preventDefault();
	event.stopPropagation();

	var classmateId = user_id;

	if (user_id = '')
		return false;

	$('#wait').removeClass('hidden');

	$.ajax({
		url: '/get/classmate/info',
		type: 'GET',
		data: {'classmate_id': classmateId},
		success: function(res){
			if (res.status_code == 200) {
				viewUser(res.userinfo);
			} else {
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

			$('#wait').addClass('hidden');
		}
	});
}

function viewUser(userInfo) {
	
	if (!userInfo || !userInfo.id || userInfo.id == '')
		return;

	showReportOption(false);

	$('#user-modal .name').text(userInfo.name);
	$('#user-modal .name').attr('classmate_id', userInfo.id);
	$('#user-modal .school-name').text(userInfo.school_name);
	$('#user-modal .location').text(userInfo.school_addr);
	$('#user-modal .grade-section').text(userInfo.grade + 'th Grade, Section ' + userInfo.section);
	$('#user-modal .email').text(userInfo.email);
	if (userInfo.photo == '')
		photo = '/images/guest.png';
	else
		photo = userInfo.photo;

	$('#user-modal .user-photo').attr('src', photo);

	if (userInfo.receive_update == 'true') {
		$('.on-off-btnset .btn-success').show();
		$('.on-off-btnset .btn-default').hide();
	} else {
		$('.on-off-btnset .btn-success').hide();
		$('.on-off-btnset .btn-default').show();
	}
	$('#user-modal').modal('toggle');
}

function updateOnOff(on){
	var receive_update;
	var classmate_id = 	$('#user-modal .name').attr('classmate_id');

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

function showReportOption(show) {
	if (show) {
		$('#report-user').addClass('hidden');
		$('#report-options').removeClass('hidden');
		$('#report-options textarea').addClass('hidden');
//		$('#report-options input[type="radio"]').attr('checked', false);
		$('#report-not-in-class').prop('checked', true);
		reportOption = 'Not in Class';
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

$(document).ready(function() {
	$('#search').keydown(function(e) {
		if (e.which == 13)
			searchFriend();
	});

	getClassmates();
	getGrademates();
	getFriends();
});

