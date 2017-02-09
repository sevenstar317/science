
window.fbAsyncInit = function() {
    FB.init({
        appId: '664262100315335',
        status: true,
        cookie: true,
        xfbml: true
    });
};


(function(d, debug){var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];if   (d.getElementById(id)) {return;}js = d.createElement('script'); js.id = id; js.async = true;js.src = "//connect.facebook.net/en_US/all" + (debug ? "/debug" : "") + ".js";ref.parentNode.insertBefore(js, ref);}(document, /*debug*/ false));

function postToFeed(title, desc, url) {
    var obj = {method: 'feed',link: url, name: title,description: desc};
	console.log(title + desc + url);
    function callback(response) {}
    FB.ui(obj, callback);
}

$( document ).ready(function() {
	var fbShareBtn = document.querySelector('.fb_share');
	fbShareBtn.addEventListener('click', function(e) {
		e.preventDefault();
		var ab = $('.user-percentile').text();
		console.log(ab);
		 var title = fbShareBtn.getAttribute('data-title'),
        desc =  $('#percentile #user-percentile').text() + $('#percentile .schoolname').text() + $('#percentile .user-percentage').text() + $('#percentile #caption').text(),
        url = fbShareBtn.getAttribute('href');
			
		postToFeed(title, desc, url);
		
		return false;
	});
	window.___gcfg = {
    lang: 'en-US',
    parsetags: 'onload'
  };

});
