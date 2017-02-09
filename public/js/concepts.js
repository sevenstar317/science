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
	console.log('showConceptContent');
	console.log(syllabus_id);
	console.log(grade_id);
	console.log(chapter_id);
}


function showConcepts() {
	$('#concepts .concept-group').removeClass('hidden');
	$('#concepts .concept-content-group').addClass('hidden');
	$('#show-concepts').addClass('hidden');
}

function onChapterChanged(element)
{
	var chapterId = $(element).data('chapter-id');

	if (!chapterId || chapterId == '')
		return;
	
	$('#concepts .concept-group .column').empty();
	showConcepts();
	$('h2.page-info').text($(element).text());

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

function onChapterChangedNew()
{
	var chapterId = $(this).data('chapter-id');
	$('[data-chapter-id]').removeClass('active');
	$(this).addClass('active');
	$('h2.page-info').text($(this).text());

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
		lesson.isLesson = 'false';
	} else if (lesson.isLesson == 'false') {
		lesson.concept = concepts[0].id;
	}

	lesson.isLesson = 'false';
	$('#concepts .concept-group').empty();
	for (var i = 0; i < len; i++) {
		var html = '<a href="#" style="background-image: url(\''+ concepts[i].image + '\');" class="concept-' + concepts[i].id + ' concept-item" onclick="showConceptContent(\'' + concepts[i].id + '\');_gaq.push([\'_trackEvent\', \'Lesson\', Concept]);"></a>';

		$('#concepts .concept-group').append(html);
		/*if (i % 2 == 0)
			$('#concepts .two-columns .column-1').append(html);
		else
			$('#concepts .two-columns .column-2').append(html);

		if (i % 3 == 0)
			$('#concepts .three-columns .column-1').append(html);
		else if (i % 3 == 1)
			$('#concepts .three-columns .column-2').append(html);
		else
			$('#concepts .three-columns .column-3').append(html);*/

		//html = '<div class="inline-block full-width">';
		//html += '<div class="concept-img-block">';
		//html += '<img src="' + concepts[i].image + '" class="concept-img">';
		html = '<div class="shadows"></div>';
		html += '<div class="concept-item-title">';
		html += '<p>' + concepts[i].title + '</p>';
		if (concepts[i].image_credit && concepts[i].image_credit != '') {
			html += '<p class="image-credit"><a href="' + concepts[i].image_source + '" target="_blank" onmouseover="creditOverOut(true)" onmouseout="creditOverOut(false)">' + concepts[i].image_credit + '</a></p>';
		}
		html += '</div>';
		html += '</a>';

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

		var info = '<p id="class-info">' + user.school_name + '<br>' + user.grade_name + 'th Grade, ' + user.section_name + '</p>';

		var addBtn = '<div class="classmate-sm-item center" >';
		addBtn += '<a href="/searchfriend" >';
		addBtn += '<img class="user-sm-photo" src="/images/add.png" style="margin: 0 auto;" />';
		addBtn += '<p>Add Friend</p>';
		addBtn += '</a></div>';
		
		$('#user-classmates').append(info);
		$('#user-classmates').append(addBtn);

		var len = classmates.length;

		if (len == 0) {
			var html = '<div class="none-classmate center">';
			html += '<p>None of your classamtes are here yet.</p>';
			html += '</div>';

			$('#user-classmates').append(html);

			return;
		}

		for (var i = 0; i < len; i++) {
			var classmate = classmates[i];
			var photo;

			if (classmate.photo == '')
				photo = '/images/guest.png';
			else
				photo = classmate.photo;


			var html = '<div class="classmate-sm-item center">';
			html += '<a href="#" onclick="viewUser(\'' + classmate.id + '\')">';
			html += '<img src="' + photo + '" style="margin: 0 auto;" class="user-sm-photo">';
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
			html += '<img src="' + photo + '" style="margin: 0 auto;" class="user-sm-photo">';
			html += '<p>' + friend.name + '</p>';
			html += '</a>';

			html += '<div id="remove-friend-' + friend.id + '" class="remove-friend hidden" >';
			html += '<a href="#" title="Remove From Friends" onclick="removeFromFriends(event, \'' + friend.id + '\')">';
			html += '<img src="/images/delete.png">';
			html += '</a></div></div></div>';

			$('#user-friends').append(html);
		}
		
		showScientists();
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

	for (var i = 0; i < len; i++) {
		var scientist = scientists[i];

		var html = '<div class="classmate-sm-item center">';
		html += '<a href="http://www.google.com/search?q=' + scientist.name + '" target="_blank" >';
		html += '<img src="' + scientist.photo + '" style="margin: 0 auto;" class="user-sm-photo">';
		html += '<p>' + scientist.name + '</p>';
		html += '</a></div>';

		$('#user-friends').append(html);
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

$(document).ready(function(){
	var id = '#chapter-' + lesson.chapter;

	if (lesson.concept == '')
		lesson.isLesson = 'false';
	else
		lesson.isLesson = 'true';

	onChapterChanged($('[data-chapter-id].active'));

	if (classmates.length <= 8)
		$('#classmates-expand').addClass('hidden');

	if (friends.length <= 6)
		$('#friends-expand').addClass('hidden');

	showClassmates();
	showFriends();
	$('[data-chapter-id]').on('click', onChapterChangedNew);
});

