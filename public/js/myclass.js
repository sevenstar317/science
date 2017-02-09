var credit_over = false;
var isAddNote = false;
var classmates =[];
var friends =[];
var reportOption = '';

function renderLesson(URL){
	$(location).attr('href', '/' + URL + '');
	
}
function renderMyclass(URL){
	$(location).attr('href', '/' + URL + '');
	
}
function renderTest(URL){
	$(location).attr('href', '/' + URL + '');
}



function showConceptContent(concept_id){
	
	if (!concept_id || concept_id == '')
		return;
	var syllabus_id = lesson.syllabus;
	var grade_id = lesson.grade;
	var chapter_id = lesson.chapter;

	$(location).attr('href', '/concept?syllabus=' + syllabus_id + '&grade=' + grade_id + '&chapter=' + chapter_id +'&concept=' + concept_id);
}


function showConcepts() {
	$('#concepts .concept-group').removeClass('hidden');
	$('#concepts .concept-content-group').addClass('hidden');
	$('#show-concepts').addClass('hidden');
}

function onChapterChanged(element)
{
	var chapterId = $(element).val();

	if (!chapterId || chapterId == '')
		return;
	
	$('#concepts .concept-group .column').empty();
	showConcepts();

	$.ajax({
		type: 'GET',
		url: '/getconcepts',
		data: {
			'chapter_id': chapterId,
			'lesson': 'true'},
		success: function(res) {
			if (res.status_code == 200) {
				lesson.chapter = chapterId;
				parseConcepts(res.concepts);
			}
		}
	});
}

function parseConcepts(concepts) {
	var len = concepts.length;

	if (len <= 0) {
		lesson.concept = '';
		lesson.isLesson == 'false'
	} else if (lesson.isLesson == 'false') {
		lesson.concept = concepts[0].id;
	}

	lesson.isLesson = 'false';

	for (var i = 0; i < len; i++) {
		var html = '<a href="#" class="concept-' + concepts[i].id + ' concept-item" onclick="showConceptContent(\'' + concepts[i].id + '\')"></a>';

		$('#concepts .one-column .column-1').append(html);
		if (i % 2 == 0)
			$('#concepts .two-columns .column-1').append(html);
		else
			$('#concepts .two-columns .column-2').append(html);

		if (i % 3 == 0)
			$('#concepts .three-columns .column-1').append(html);
		else if (i % 3 == 1)
			$('#concepts .three-columns .column-2').append(html);
		else
			$('#concepts .three-columns .column-3').append(html);

		html = '<div class="inline-block full-width">';
		html += '<div class="concept-img-block"><p class="take-a-test"><a href="/testSelection">Take a test</a></p>';
		html += '<img src="' + concepts[i].image + '" class="concept-img">';
		if (concepts[i].image_credit && concepts[i].image_credit != '') {
			html += '<p class="image-credit"><a href="' + concepts[i].image_source + '" target="_blank" onmouseover="creditOverOut(true)" onmouseout="creditOverOut(false)">' + concepts[i].image_credit + '</a></p>';
		}
		html += '</div>';
		html += '<p class="no-margin">' + concepts[i].title + '</p></div></a>';

		var id = '#concepts .concept-' + concepts[i].id;
		$(id).append(html);
	}
}

function creditOverOut(over) {
	credit_over = over;
}

function showClassmates() {
	
	if (userid == '') {
		$('#guest-comment').removeClass('hidden');
		$('#user-classmates').addClass('hidden');
	}
	else {
		$('#guest-comment').addClass('hidden');
		$('#user-classmates').removeClass('hidden');

		$('#user-classmates').empty();

		var info = '<p id="class-info" class="class-info"><b>' + user.school_name + '</b><span>' + user.grade_name + 'th Grade, ' + user.section_name + '</span></p>';

		var addBtn = '<div class="classmate-item center" >';
		addBtn += '<a href="/searchfriend" >';
		addBtn += '<img class="user-photo" src="/images/add.png" />';
		addBtn += '<p>Add Friend</p>';
		addBtn += '</a></div>';
		
		$('#user-classmates').append(info);
		$('#user-classmates').append(addBtn);

		var len = classmates.length;

		if (len == 0) {
			var html = '<div class="none-classmate center">';
			html += '<p>None of your classmates are here yet.</p>';
			html += '</div>';

			$('#user-classmates').append(html);

			return;
		}

		for (var i = 0; i < len; i++) {
			var classmate = classmates[i];
			var photo;

			if (classmate.photo && (typeof classmate.photo != 'undefined') &&
				(typeof classmate.photo != 'object') && (classmate.photo != 'undefined')) {
				photo = classmate.photo;
			} else{
				photo = '/images/guest.png';
			}


			var html = '<div class="classmate-item center">';
			html += '<a href="#" onclick="viewUser(\'' + classmate.id + '\')">';
			html += '<img src="' + photo + '" class="user-photo">';
			html += '<p>' + classmate.name + '</p>';
			html += '</a></div>';

			$('#user-classmates').append(html);
		}
	}
}

function showFriends() {
	
	if (userid == '') {
		showScientists();
	}
	else {
		$('#user-friends').empty();

		var len = friends.length;

		for (var i = 0; i < len; i++) {
			var friend = friends[i];
			var photo;

			if (friend.photo == '')
				photo = '/images/guest.png';
			else
				photo = friend.photo;


			var html = '<div id="friend-' + friend.id + '" friend_id="' + friend.id + '" class="classmate-sm-item" onmouseover="onMouseFriend(this, true)" onmouseout="onMouseFriend(this, false)" >';
			html += '<div class="friend-sm-item center">';
			html += '<a href="#" onclick="viewUser(\'' + friend.id + '\')">';
			if (photo && (typeof photo != 'undefined') &&
				(typeof photo != 'object') && (photo != 'undefined')) {
				html += '<img src="' + photo + '" style="margin: 0 auto;" class="user-sm-photo">';
			} else{
				html += '<img src="/images/guest.png" style="margin: 0 auto;" class="user-sm-photo">';
			}
			
			html += '<p>' + friend.name + '</p>';
			html += '</a>';

			html += '<div id="remove-friend-' + friend.id + '" class="remove-friend hidden" >';
			html += '<a href="#" title="Remove From Friends" onclick="removeFromFriends(event, \'' + friend.id + '\')">';
			html += '<img src="/images/delete.png">';
			html += '</a></div></div></div>';

			$('#user-friends').append(html);
		}

		if (len === 0 ) {
			showScientists();
		}
	}
}

function removeFromFriends(event, friend_id) {
	
	event.preventDefault();
	event.stopPropagation();
	
	var friendElem_id = '#friend-' + friend_id;
	var friendElem = $(friendElem_id);

	$('#wait').removeClass('hidden');
	$.ajax({
		url: '/remove/friend',
		type: 'POST',
		data: {'user_id': friend_id},
		success: function(res) {

			if (res.status_code == 200) {
				friendElem.remove();
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
			
			$('#wait').addClass('hidden');
		}
	});
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

function showScientists() {
	
	var len = scientists.length;
	if (len > 3)
		len = 3;

	/*var html = '<div id="friend-' + friend.id + '" friend_id="' + friend.id + '" class="classmate-sm-item" onmouseover="onMouseFriend(this, true)" onmouseout="onMouseFriend(this, false)" >';
			html += '<div class="friend-sm-item center">';
			html += '<a href="#" onclick="viewUser(\'' + friend.id + '\')">';
			if (photo && (typeof photo != 'undefined') &&
				(typeof photo != 'object') && (photo != 'undefined')) {
				html += '<img src="' + photo + '" style="margin: 0 auto;" class="user-sm-photo">';
			} else{
				html += '<img src="/images/guest.png" style="margin: 0 auto;" class="user-sm-photo">';
			}
			
			html += '<p>' + friend.name + '</p>';
			html += '</a>';

			html += '<div id="remove-friend-' + friend.id + '" class="remove-friend hidden" >';
			html += '<a href="#" title="Remove From Friends" onclick="removeFromFriends(event, \'' + friend.id + '\')">';
			html += '<img src="/images/delete.png">';
			html += '</a></div></div></div>';
			*/
	$('#socialfriend').empty();
	for (var i = 0; i < len; i++) {
		var scientist = scientists[i];
		var html = '<div class="classmate-sm-item center">';
		html += '<div class="friend-sm-item center">';
		html += '<img src="' + scientist.photo + '" style="margin: 0 auto;" class="user-sm-photo">';
		html += '<p>' + scientist.name + '</p>';
		//html += '</a></div>';
		html += '</a></div></div>';
		$('#user-friends').append(html);
	}
	if(len >= 1){
		if(scientist.type == "facebook"){
			var html2 = '<a href="#" onclick="FBInvite()"><img src="/social_buttons/f.png" onclick="_gaq.push([\'_trackEvent\', \'My Class\', Add Friends]);"></a>';
		}	else {
			var html2 = '<a data-contenturl="http://scienceisfun.mobiloitte.org:3000" data-contentdeeplinkid="/afterLogin" data-clientid="25626773198-ldeub2pae5rjgk7hjlpt68jb0ppevmn6.apps.googleusercontent.com" data-cookiepolicy="single_host_origin" data-prefilltext="Join me in an exciting world where text books come to life, and learning ‘Science is Fun’" data-calltoactionlabel="INVITE" data-calltoactionurl="http://scienceisfun.mobiloitte.org:3000" data-calltoactiondeeplinkid="/grades" class="g-interactivepost" ><img src="/social_buttons/google-plus.png" onclick="_gaq.push([\'_trackEvent\', \'My Class\', Add Friends]);"  /></a>';
			}
		//$('#google-share').append(html2);
	}
}

function onMoreClassmates() {
	$('#classmates-expand').addClass('hidden');

	getClassmates();
}

function onMoreFriends() {
	$('#friends-expand').addClass('hidden');

	getFriends();
}

function parseClassmates(data) {
	classmates = [];

	len = data.classmates.length;
	if (len <= 0) {
		return;
	}

	classmates = data.classmates;
}

function parseFriends(data) {
	friends = [];

	len = data.friends.length;
	if (len <= 0) {
		return;
	}

	friends = data.friends;
}

function getClassmates() {
	$('#wait').removeClass('hidden');

	$.ajax({
		url: '/get/classmates',
		type: 'GET',
		data: {},
		success: function(res){
			if (res.status_code == 200) {
				parseClassmates(res);
				showClassmates();
			}

			$('#wait').addClass('hidden');
		}
	});
}

function getFriends() {
	$('#wait').removeClass('hidden');

	$.ajax({
		url: '/get/friends',
		type: 'GET',
		data: {},
		success: function(res){
			if (res.status_code == 200) {
				parseFriends(res);
				showFriends();
			}

			$('#wait').addClass('hidden');
		}
	});
}

function viewUser(userId) {
	
	var userInfo;
	var photo;

	for (var i = 0; i < classmates.length; i++) {
		if (classmates[i].id == userId) {
			userInfo = classmates[i];
			break;
		}
	}

	for (var i = 0; i < friends.length; i++) {
		if (friends[i].id == userId) {
			userInfo = friends[i];
			break;
		}
	}

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
			console.log(res);
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
	if (option == 'Other' || option == 'Bad Content') {
		$('#report-options textarea').val('');
		$('#report-options textarea').removeClass('hidden');
	} else
		$('#report-options textarea').addClass('hidden');
}

function reportUser() {
	var alertElem;
	var reason = reportOption;
	var classmate_id = 	$('#user-modal .name').attr('classmate_id');

	if (reason == 'Other'  || reason == 'Bad Content')
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
	var id = '#chapter-' + lesson.chapter;

	if (lesson.concept == '')
		lesson.isLesson = 'false';
	else
		lesson.isLesson = 'true';

	onChapterChanged($('#chapters-list'));

	if (classmates.length <= 8)
		$('#classmates-expand').addClass('hidden');

	if (friends.length <= 6)
		$('#friends-expand').addClass('hidden');

	showClassmates();
	showFriends();
});

