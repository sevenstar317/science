

function renderLesson(URL){
	$(location).attr('href', '/' + URL + '');
	
}
function renderMyclass(URL){
	$(location).attr('href', '/' + URL + '');
	
}
function renderTest(URL){
	$(location).attr('href', '/' + URL + '');
}

function getPercentile(userid,grade,syllabus,userschool){
	$.ajax({
		url: '/getPercentile',
		type: 'GET',
		data: {'userid':userid,'grade': grade,'syllabus':syllabus,'school':userschool},
		success: function(res) {
			$.each(res,function (i, perc) {
				$('#percentile #user-percentile').text('You are in '+ perc.percentile+' Percentile at ');
			});
			}
		});
	}
function getPercentage(userid,grade,syllabus,userschool){
	$.ajax({
		url: '/getPercentage',
		type: 'GET',
		data: {'userid':userid,'grade': grade,'syllabus':syllabus,'school':userschool},
		success: function(res) {
			
			$.each(res,function (i, per) {
				var percent = per.percentage == null ? 0:per.percentage;
				$('#percentile > p').text('You have completed ' + percent + ' %');
				showpercentage = per.syllabus_title;
			});
			}
		});
	}
	/*
function shareonfacebook(){
	var share = require('social-share');
	var url = share('facebook', {
		title:'share it'
	});
}
function displaysocialshare(socialtype){
	if(socialtype == 'facebook'){
		$('#facebookshare').removeClass('hidden');
		}
	if(socialtype == 'google'){
		$('#googleshare').removeClass('hidden');
		}
	}
*/
$(document).ready(function(){
	var grade = $('#gradename').val();
	var syllabus = $('#syllabusname').val();
	var userid = $('#userid').val();
	var userschool = $('#userschool').val();
	//var socialtype = $('#logintype').val();
	//displaysocialshare(socialtype);
	getPercentile(userid,grade,syllabus,userschool);
	getPercentage(userid,grade,syllabus,userschool);
	$.ajax({
		url: '/getdetails',
		type: 'GET',
		data: {'grade': grade,'syllabus':syllabus,'userid':userid},
		success: function(res) {
			renderUserInfo(res);
			//console.log('GRadeNAme:'+ JSON.stringify(res.gradename[grade_title]));
			//alertElem = res.gradename.grade_title + 'th grade' + res.syllabusname.syllabus_title 'Syllabus';  
			//$('#caption').append(alertElem);
			}
		});
		
	$.ajax({
			type: 'GET',
			url: '/getnotes2',
			data: {},
			success: function(res) {
				if (res.status_code == 200)
				
					parseNotes(res);
			}
		});
});

function renderUserInfo(userinfo) {
	console.log(userinfo);
	var syllabusTitle = '';
	var gradeTitle = '';
	$.each(userinfo.syllabusname,function (i, syllabus) {
		
		syllabusTitle = syllabus.syllabus_title;
	});
		$.each(userinfo.gradename,function (i, grade) {
		
		gradeTitle = grade.grade_title;
	});
	alertElem = 'of ' + gradeTitle + 'th grade ' + syllabusTitle +  ' Syllabus';  
	
	$('#percentile #caption').append(alertElem);
	
}

function parseNotes(data) {
	var notes = data.notes;
	//var addId = '#note-add-' + data.concept_id;
	//var noteId = '#note-' + data.concept_id;
	var len = notes.length;

	for (var i = 0; i < len; i++) {
		var html  = '<div class="content-item" style="width:1100px;">';
			html += 	'<div class="note-item full-width inline-block"  style="width:1100px;height:80px;margin-left:10px;margin-top:20px;">';
			html += 		'<div class="person pull-left">';
			html += 			'<img src="' + notes[i].owner_photo + '" title="' + notes[i].owner_name + '">';
			html += 			'<p class="person-name">' + notes[i].owner_name + '</p>';
			html +=			'</div>';
			html += 		'<div class="content">';
			html += 			'<p class="note-item-date inline-block">' + notes[i].date + '</p>';
			html += 			'<p class="note-content">' + notes[i].note + '</p>';
			html +=			'</div>';
			html +=		'</div>';
			html +=		'<div style="margin-left:10px;"><p>Concept</p></div>';
			html += 	'<div class="pull-right"><a class="btn btn-default" onClick="showConceptContent(\''+notes[i].concept_id+'\')">Add Note</a></div></div>';
		
								
		
		$('.note-add').append(html);
/*
		if (userid != '' && notes[i].isDefault == 'true' && $(noteId).find('.content-item').length > 0) {
			$(html).insertBefore($(noteId).find('.content-item')[0]);
		} else
			$(html).insertBefore(addId);*/
	}
}

function showConceptContent(concept_id){
	 var syllabus_id;
	 var grade_id;
	 var chapter_id;
	
	$.ajax({
			type: 'GET',
			url: '/getConceptData',
			data: {'concept_id':concept_id},
			success: function(res) {
				$(location).attr('href', '/concept?syllabus=' + res.syllabus + '&grade=' + res.grade + '&chapter=' + res.chapter +'&concept=' + concept_id);
			}
		});
	
	
	
}
