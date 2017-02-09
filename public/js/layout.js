var scientists = [];

function getUnreadUpdateCnt() {
	return;

	if (global_userid == '' || $(location).attr('pathname') == '/updates')
		return;
	
	$.ajax({
		url: '/get/updates/unreadcount',
		type: 'GET',
		data: {},
		success: function(res){
			if (res.count != 0) {
				$('.update-count-mark').text(res.count);
				$('.update-count-mark').removeClass('hidden');
			} else {
				$('.update-count-mark').addClass('hidden');
			}
		}
	});
}

$(document).ready(function(){
	getUnreadUpdateCnt();

  $('#nav-toggle-btn').on('click', function () {
    $('body').toggleClass('collapsed');
  });

	if (guest) {
		$('#guest_name').text(guest.name);
		if (guest.photo != '')
			$('#guest_photo').attr('src', guest.photo);
		$('#guest_link').attr('href', 'http://www.google.com/search?q=' + guest.name);
	}

	if (typeof lesson !== 'undefined') {
		if (lesson.syllabus_name && lesson.grade_name);
			$('#caption').text(lesson.grade_name + 'th Grade, ' + lesson.syllabus_name);
	}

	if (typeof user !== 'undefined') {
		$('.user-school').text(user.school_name + ', ' +  user.grade_name + 'th Grade, ' + user.section_name);
	}

	if ($(window).height() > 800) {
		$('.content-wrapper').height($(document).height() - $('.header.navbar').outerHeight() - $('.top-nav').outerHeight() - $('.footer').outerHeight() - 5);
	}

  $('input[type="password"]').on('paste', function (e) {
    e.preventDefault();
  });
});

jQuery.fn.getPath = function () {
    if (this.length != 1) throw 'Requires one element.';
    var selector = '';
    var element = $(this);

    selector = element.prop('tagName') + '.' + element.attr('class').split(' ').join('.');
    element = element.parent();
    while(true) {
    	var tagName = element.prop('tagName');
    	var classes = element.attr('class');
    	var tmp = '';

    	if (element.prop('tagName') === 'BODY') {
    		break;
    	}

    	tmp = tagName;

    	if (classes) {
				tmp += '.' + classes.split(' ').join('.');
    	}
    	selector = tmp + ' > ' + selector;
    	element = element.parent();
    }

    console.log(selector);

    return selector;
};