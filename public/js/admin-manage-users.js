var isSearching = false;
var search_text = '';

function searchUser() {
	search_text = $('#search').val();
	search_text = search_text.replace(/^\s+/, '');
	search_text = search_text.replace(/\s+$/, '');

	if (search_text == '')
		return;

	$('#not-found').addClass('hidden');
	$('#not-found p').remove();

	$('#users').addClass('hidden');
	$('#users .classmates').empty();
	$('.classmate-profile').addClass('hidden');

	if (isSearching == true)
		return;

	_searchUser();
}

function _searchUser() {
	isSearching = true;
	$('#wait').removeClass('hidden');

	$.ajax({
		url: '/admin/search/users',
		type: 'GET',
		data: {'search_text': search_text},
		success: function(res){
			isSearching = false;
			$('#wait').addClass('hidden');

			if (search_text != res.search_text) {
				_searchUser();
				return;
			}

			if (res.status_code == 200)
				parseSearchUsers(res);
			else {
				var alertElem = '<div class="alert alert-danger alert-dismissable">';
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
			$('#wait').addClass('hidden');
		}
	});
}

function parseSearchUsers(data) {
	var users_len = data.users.length;
	if (users_len <= 0) {
		var html = '<p>' + data.search_text + '</p>';
		$('#not-found').append(html);
		$('#not-found').removeClass('hidden');
		return;
	}

	for (var i = 0; i < users_len; i++) {
		var user = data.users[i];
		var html = '<div class="classmate-item center pull-left">';
		html += '<div><a href="#" onclick="showUser(\'' + user.id + '\')">';
		html += '<img class="user-photo" src="' + user.photo + '">';
		html += '<p>' + user.name + '</p></a></div>';
		$('#users .classmates').append(html);
	}
	
	$('#users').removeClass('hidden');
}

function showUser(id) {
	$('#wait').removeClass('hidden');

	$.ajax({
		url: '/admin/get/user',
		type: 'GET',
		data: {'user_id': id},
		success: function(res){
			$('#wait').addClass('hidden');
			if (res.status_code == 200)
				parseGetUser(res);
			else {
				var alertElem = '<div class="alert alert-danger alert-dismissable">';
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

function parseGetUser(data) {
	console.log(data);
	$('.classmate-profile img').attr('src', data.user.photo);
	$('.classmate-profile .school-name').text(data.user.school_name);
	$('.classmate-profile .grade').text('Grade ' + data.user.grade + ' Section ' + data.user.section);
	$('.classmate-profile .email').text(data.user.email);
	$('.classmate-profile .name').text(data.user.name);
	$('.classmate-profile .verified-status').text(data.user.activation + ', ');
	$('.classmate-profile .disable-status').text(data.user.disabled);

	if (data.user.disabled == 'Disabled') {
		$('.classmate-profile .second-info a').text('Enable');
		$('.classmate-profile .second-info a').attr('onclick', 'disableUser("' + data.user._id + '", "false")');
	} else {
		$('.classmate-profile .second-info a').text('Disable');
		$('.classmate-profile .second-info a').attr('onclick', 'disableUser("' + data.user._id + '", "true")');
	}

	$('#users').addClass('hidden');
	$('.classmate-profile').removeClass('hidden');
}

function showSearchList() {
	$('#users').removeClass('hidden');
	$('.classmate-profile').addClass('hidden');
}

function disableUser(id, disable) {
	$('#wait').removeClass('hidden');

	$.ajax({
		url: '/admin/disable/user',
		type: 'POST',
		data: {
			'user_id': id,
			'disable': disable
		},
		success: function(res){
			$('#wait').addClass('hidden');
			var alertElem = ''

			if (res.status_code == 200) {
				if (disable == 'true') {
					$('.classmate-profile .disable-status').text('Disabled');
					$('.classmate-profile .second-info a').text('Enable');
					$('.classmate-profile .second-info a').attr('onclick', 'disableUser("' + id + '", "false")');
				} else {
					$('.classmate-profile .disable-status').text('Enabled');
					$('.classmate-profile .second-info a').text('Disable');
					$('.classmate-profile .second-info a').attr('onclick', 'disableUser("' + id + '", "true")');
				}

				alertElem = '<div class="alert alert-success alert-dismissable">';
				alertElem += '<p>' + res.message + '</p></div>';
			} else {
				alertElem = '<div class="alert alert-danger alert-dismissable">';
				alertElem += '<p>' + res.message + '</p></div>';
			}

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
			searchUser();
	});
});

