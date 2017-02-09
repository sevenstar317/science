
$(document).ready(function(){
	document.getElementById('2').checked = true;
	
});

function renderLesson(URL){
	$(location).attr('href', '/' + URL + '');
}
function renderMyclass(URL){
	$(location).attr('href', '/' + URL + '');
}
function renderTest(URL){
	$(location).attr('href', '/' + URL + '');
}



function showConceptContent(chapterId, page_number){
	var chapter_id = chapterId;
	var page_number = page_number;	
	$(location).attr('href', '/test?chapterid=' + chapter_id +'&page=' + page_number);
}


function showConcepts() {
	$('#concepts .concept-group').removeClass('hidden');
	$('#concepts .concept-content-group').addClass('hidden');
	$('#show-concepts').addClass('hidden');
}

function onChapterChanged(element) {
	console.log(element);
	var chapterId = $(element).val();
	var userid = $('#userid').val();
	var page = $(element).val();
	$('#concepts .concept-group .column').empty();
	$('#test-list').addClass('hidden');
	$('.btn-toolbar').addClass('hidden');
	$('#score').addClass('hidden');
	showConcepts();
	$.ajax({
		type: 'GET',
		url: '/test-list',
		data: {
			'chapterid': chapterId,
			},
		success: function(res) {
			if (res.status_code == 200) {
				parseTests(res,chapterId,userid);
			}
			else {
				$('#concepts .concept-group').append('<div class="no-data">Test is not available.</div>');
			}
		}
	});
}


// reload test on exit button
function onExitClick(element) {
	var chapterId = element;
	var userid = $('#userid').val();
	$('#concepts .concept-group .column').empty();
	$('#test-list').addClass('hidden');
	$('.btn-toolbar').addClass('hidden');
	$('#score').addClass('hidden');

	showConcepts();
	$.ajax({
		type: 'GET',
		url: '/test-list',
		data: {
			'chapterid': chapterId,
			},
		success: function(res) {
			if (res.status_code == 200) {
				parseTests(res,chapterId,userid);
			}
			else {
				$('#concepts .concept-group').append('<div class="no-data">Test is not available.</div>');
			}
		}
	});
}



function onTestClick(chapterId, page, userid) {
	$('#test-list').removeClass('hidden');
	$('#concepts .concept-group .column').empty();
	$('#concepts .concept-content-group').addClass('hidden');
	$("#test-list .questions").empty();
	$("#test-list .questions").empty();
	$('#score').addClass('hidden');
	$.ajax({
		type: 'GET',
		url: '/test',
		data: {
			'chapterid': chapterId,
			'page': page,
			'userid':userid
			},
		success: function(res) {
			if (res.status_code == 200) {
				parseTestList(res, page);
			}
			if (res.status_code == 201) {
				parseTestList2(res,page);
			}
			if(res.status_code == 200 && res.test_count == 0){
				var a = $("#test-list .test-title").html('<div class="questions">No test found.</div>');
			}
		}
	});
}


function parseTestList(response, page) {
	var testNumber = parseInt(page) + 1;
	$("#test-list .test-title").attr('data-test-number', testNumber);
	$("#test-list .test-title").text('Test# ' + testNumber);
	var chapterId = $('#chapters-list').val();
	var html = '';
	var html1 = '';
	$.each(response.tests, function (i, test) {
		var nTag = (i != 0 ? "hidden":"");
		html = '<div class="question-option question-outer-'+ i + ' '+nTag+'"><div class="custom-button"><div class="arrow-buttons"><i onclick="glyphiconCircleArrowLeft('+i+')" class="button-previous-'+ i + ' fa fa-chevron-circle-left"></i><i class="button-next-'+ i + ' fa fa-chevron-circle-right" data-panel='+i+' onclick="glyphiconCircleArrowRight('+i+')"></i></div><div class="question-list question-' + i + '" id="'+ test._id +'"><span class="fa fa-question-circle"></span> ' + test.question + '';
		html1 = '<div class="options""><div class="options option1"><input type="radio" name="question-'+ i +'" value="option1" class="question-option-'+ i +'"> ' + test.option1 + '</div><div class="options option2"><input type="radio" name="question-'+ i +'" value="option2" class="question-option-'+ i +'"> ' + test.option2 + '</div><div class="options option3"><input type="radio" name="question-'+ i +'" value="option3" class="question-option-'+ i +'"> ' + test.option3 + '</div><div class="options option4"><input type="radio" name="question-'+ i +'" value="option4" class="question-option-'+ i +'"> ' + test.option4 + '</div><div class="test-buttons"><div class="btn-toolbar hidden text-muted pull-left"><input type="button" class="button btn btn-warning" onclick="submitTest()" value="submit"></div><div class="right-button text-muted pull-right"><button type="button" class="btn btn-success"  onclick="onExitClick(\'' + chapterId +  '\')" >Exit<i class="fa fa-sign-out"></i></button></div></div>';
		var a = $("#test-list .questions").append(html);
		var b = $('#test-list .question-' + i + '').append(html1);
		
    });
}





function parseTestList2(response,page) {
	$.each(response.testdata,function (i, testDATA) {
		score = testDATA.score;
	});
	tests = [];
	var html = '';
	var reviewAnsPage = parseInt(page);
	var test_number = parseInt(page) + 1;
	chapterId = $('#chapters-list').val();
	userid = $('#userid').val();
	$("#test-list .test-title").text('Test# ' + test_number);
	page = $("#test-list .test-title").attr('data-test-number');
	var testNumber = parseInt(page) - 1;
	$('.custom-button').addClass('hidden');
	$('.btn-review').removeClass('hidden');
	$('.btn-toolbar').addClass('hidden');
	$('.test-title').removeClass('hidden');
	$('#score').removeClass('hidden');
	
	var star = '';
	var i = 0;
	for(i=1; i<=score; i++) {
		star += '<img src="/images/star-on.png">';
	} 
	for(j=i; j<7; j++) {
		star += '<img src="/images/star-off.png">';
	} 
	
	/*html = '<div id="star-box">'+star+'</div><div class="score-group">You Scored ' + score + ' Points</div></div><div class="right-button text-muted pull-right"><button type="button" class="btn btn-success exit-button"  onclick="onExitClick(\'' + chapterId +  '\')" >Exit<i class="fa fa-sign-out"></i></button></div>';*/

	html = '<div id="star-box">'+star+'</div><div class="score-group">You Scored ' + score + ' Points</div><div class="review-button"><input type="button" class="btn btn-primary text-muted pull-left"  onclick="correctAnswer(\'' + chapterId +  '\',\'' + reviewAnsPage + '\',\'' + userid + '\')" value="Review Answer"></div>';
	
	$('#score').html(html);
}


function  glyphiconCircleArrowRight(i){
	var atLeastOneIsChecked = $('.question-option-'+i).is(':checked');
	if(atLeastOneIsChecked){
		var length= $(".question-option").length;
		console.log("Original"+i);
		i = i + 1;
		var atLeastOneIsChecked2 = $('.question-option-'+i).is(':checked');
		console.log("updated"+i);
		if(i<length){
				console.log('atLeastOneIsChecked2:'+atLeastOneIsChecked2);
			if(i == (length-1) && atLeastOneIsChecked2 == true){
				$('.btn-toolbar').removeClass('hidden');
				$(".question-outer-"+i).removeClass("hidden");
				$(".question-option").hide();
				$(".question-outer-"+i).show();	
			} else {
				$('.btn-toolbar').addClass('hidden');
				$(".question-outer-"+i).removeClass("hidden");
				$(".question-option").hide();
				$(".question-outer-"+i).show();
				}
		}	
	}else{
		alert("Please select an option!");	
	}
	if(i==length){
		$('.btn-toolbar').removeClass('hidden');
	}else{
		$('.btn-toolbar').addClass('hidden');
	}
	var atLeastOneIsChecked5 = $('.question-option-5').is(':checked');
	if(atLeastOneIsChecked5){
		$('.btn-toolbar').removeClass('hidden');
	}else{
		$('.btn-toolbar').addClass('hidden');
	}
	console.log(i);
}

function  glyphiconCircleArrowLeft(i){
	
	var atLeastOneIsChecked = $('.question-option-'+i).is(':checked');
	//if(atLeastOneIsChecked){
		var length= $(".question-option").length;
		console.log("Original Left"+i);
		i = i - 1;
		console.log("Updated Left"+i);
		if(i<length && i>=0){
			$(".question-outer-"+i).removeClass("hidden");
			$(".question-option").hide();
			$(".question-outer-"+i).show();	
		}
	//}else{
	//	alert("Please select an option!");	
	//}
	if(i==length){
		$('.btn-toolbar').removeClass('hidden');
	}else{
		$('.btn-toolbar').addClass('hidden');
	}
	
	var atLeastOneIsChecked5 = $('.question-option-5').is(':checked');
	if(atLeastOneIsChecked5){
		$('.btn-toolbar').removeClass('hidden');
	}else{
		$('.btn-toolbar').addClass('hidden');
	}
}


function parseTests(tests,chapterId,userid) {
	var len = tests.test_count;
	//var pagetitle = $("#test-list .test-title").attr('data-test-number');
	var testSetLen = '';
	var html = '';
	$('#concepts .concept-group .no-data').addClass('hidden');
	if (len <= 0) {
		testSetLen = 0;
		$('#concepts .concept-group').append('<div class="no-data">Test is not available.</div>');	
	} 
	else {
		if(len < 6) {
			testSetLen = 1;
		}
		else {
			if(len % 6 !== 0) {
				testSetLen = Math.floor(len/6) + 1;
			}
			else {
				testSetLen = len/6;
			}
		}
		var j = 1;
		for (var i = 0; i < testSetLen; i++) {
			$('#concepts .concept-group .no-data').addClass('hidden');
			html = '<button class="concept-' + j + '  btn btn-success" onclick="onTestClick(\'' + chapterId +  '\',\'' + i + '\',\'' + userid + '\')" data-page="' + j + '">Test# ' + j + '</button>';
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
			j++;
		}
		var id = '#concepts .concept-' + j;
		$(id).append(html);
	}
}

function submitTest() {
	var myObject = new Object();
	var testIds = [];
	var mainArray=[];
	var tests12=[];
	var index=0;
	var answer='';
	$('.question-list').each(function() {
		var question=[];
		$(".question-option-"+index).each(function(){
			
			if($(this).is(":checked")){
				question.push($(this).val());
				answer =$(this).val();
				
			}
		})
		tests12.push({"ques_id" : this.id,"answer" : answer});
		question.push(this.id);
		mainArray.push(question);
		index++;
		testIds.push(this.id);
	});
	myObject.id=mainArray;
	$.ajax({
		type: 'GET',
		url: '/group-tests',
		data: {
			'testids': testIds
			},
		success: function(res) {
			if (res.status_code == 200) {
				parseGroupTestList(res, tests12);
			}
			else {
			
			}
		}
	});
}

function parseGroupTestList(res, myObject) {
	tests = [];
	var html = '';
	chapterId = $('#chapters-list').val();
	userid = $('#userid').val();
	page = $("#test-list .test-title").attr('data-test-number');
	var testNumber = parseInt(page) - 1;
	$.each(res.tests, function (i, test) {
		tests.push({"ques_id" : test._id,"answer" : test.answer});
	});
	var score=0;
	for(i=0; i< tests.length; i++) {
		
		if(tests[i].answer == myObject[i].answer) {
			score =score + 1;
		}
	}
	$('.custom-button').addClass('hidden');
	$('.btn-review').removeClass('hidden');
	$('.btn-toolbar').addClass('hidden');
	$('.test-title').removeClass('hidden');
	$('#score').removeClass('hidden');
	
	var star = '';
	var i = 0;
	for(i=1; i<=score; i++) {
		star += '<img src="/images/star-on.png">';
	} 
	for(j=i; j<7; j++) {
		star += '<img src="/images/star-off.png">';
	} 
	
		var a = '';
		var testNumber = [];
	$("#test-list .test-title").each(function() {
		a = $(this).attr('data-test-number');
		testNumber.push({"ab" : a})
	})
	console.log(testNumber);

	/* // Next test previous functionality
		html = '<div class="score-group"><input type="button" class="btn btn-primary btn-xs text-muted pull-right"  onclick="onTestClick(\'' + chapterId +  '\',\'' + page + '\',\'' + userid + '\')" value="Next Test"><div id="star-box">'+star+'</div><div class="score-group">You Scored ' + score + ' Points</div>';
	$('#score').html(html);
	*/
	
	var reviewAnsPage = page - 1;
	
	html = '<div class="score-group"><input type="button" class="btn btn-primary btn-xs text-muted pull-right"  onclick="onTestClick(\'' + chapterId +  '\',\'' + page + '\',\'' + userid + '\')" value="Next Test"><div id="star-box">'+star+'</div><div class="score-group">You Scored ' + score + ' Points</div><div class="review-button"><input type="button" class="btn btn-primary text-muted pull-left"  onclick="correctAnswer(\'' + chapterId +  '\',\'' + reviewAnsPage + '\',\'' + userid + '\')" value="Review Answer"></div>';
	$('#score').html(html);

	var data = {};
	data = {'chapter-id' : chapterId, 'test-title' : page, 'score' : score, 'user-answer' :myObject};
	
	$.ajax({
		type: 'POST',
		url: '/save-test-user',
		data: data,
		success: function(res) {
			if (res.status_code == 200) {
				
			}
			else {
				
			}
		}
	});
	
}


function correctAnswer(chapterId, page, userid) {
	
	console.log("correctAnswer");
	$('#test-list').removeClass('hidden');
	$('#concepts .concept-group .column').empty();
	$('#concepts .concept-content-group').addClass('hidden');
	$("#test-list .questions").empty();
	$("#test-list .questions").empty();
	$('#score').addClass('hidden');
	$.ajax({
		type: 'GET',
		url: '/reviewanswer',
		data: {
			'chapterid': chapterId,
			'page': page,
			'userid':userid
			},
		success: function(res) {
			if (res.status_code == 200) {
				console.log("correctAnswer A");
				showCorrectAnswer(res, page);
			}
		}
	});
}



function showCorrectAnswer(response, page) {
	console.log("showCorrectAnswer B");
	var testNumber = parseInt(page) + 1;
	$("#test-list .test-title").attr('data-test-number', testNumber);
	$("#test-list .test-title").text('Test# ' + testNumber);
	var chapterId = $('#chapters-list').val();
	var html = '';
	var html1 = '';
	var html2 = '';
	
	var ab = '';
	var ca = '';
	
	
	$.each(response.tests, function (i, test) {
		var nTag = (i != 0 ? "hidden":"");
		html = '<div class="question-option question-outer-'+ i + ' '+nTag+'"><div class="custom-button"><div class="arrow-buttons"><i onclick="CircleArrowLeft('+i+')" class="button-previous-'+ i + ' fa fa-chevron-circle-left"></i><i class="button-next-'+ i + ' fa fa-chevron-circle-right" data-panel='+i+' onclick="CircleArrowRight('+i+')"></i></div><div class="question-list question-' + i + '" id="'+ test._id +'"><span class="fa fa-question-circle"></span> ' + test.question + '';
		var a = $("#test-list .questions").append(html);
		$.each(response.usertest_data, function (j, test1) {
		$.each(test1.user_answer, function (k, test2) {
			if(test2.ques_id == test._id){
			
				if(test2.answer == "option1") {
					
					html1 = '<div class="options"><div class="options option1"><input type="radio" name="question-'+ i +'" value="option1" class="question-option-'+ i +'" checked disabled> ' + test.option1 + '</div><div class="options option2"><input type="radio" name="question-'+ i +'" value="option2" class="question-option-'+ i +'" disabled> ' + test.option2 + '</div><div class="options option3"><input type="radio" name="question-'+ i +'" value="option3" class="question-option-'+ i +'" disabled> ' + test.option3 + '</div><div class="options option4"><input type="radio" id="2" name="question-'+ i +'" value="option4" class="question-option-'+ i +'" disabled> ' + test.option4 + '</div><div class="options option5"><div class="correct-answer"><b>Correct Answer:</b> ' + test.answer + '</div><div class="right-button text-muted pull-right"><button type="button" class="btn btn-success"  onclick="onExitClick(\'' + chapterId +  '\')" >Exit<i class="fa fa-sign-out"></i></button></div></div>';
					
				}
							
				if(test2.answer == "option2") {
					html1 = '<div class="options"><div class="options option1"><input type="radio" name="question-'+ i +'" value="option1" class="question-option-'+ i +'" disabled> ' + test.option1 + '</div><div class="options option2"><input type="radio" name="question-'+ i +'" value="option2" class="question-option-'+ i +'" checked disabled> ' + test.option2 + '</div><div class="options option3"><input type="radio" name="question-'+ i +'" value="option3" class="question-option-'+ i +'" disabled> ' + test.option3 + '</div><div class="options option4"><input type="radio" id="2" name="question-'+ i +'" value="option4" class="question-option-'+ i +'" disabled> ' + test.option4 + '</div><div class="options option5"><div class="correct-answer"><b>Correct Answer:</b> ' + test.answer + '</div><div class="right-button text-muted pull-right"><button type="button" class="btn btn-success"  onclick="onExitClick(\'' + chapterId +  '\')" >Exit<i class="fa fa-sign-out"></i></button></div></div>';
				}
				
				if(test2.answer == "option3") {
					html1 = '<div class="options"><div class="options option1"><input type="radio" name="question-'+ i +'" value="option1" class="question-option-'+ i +'" disabled> ' + test.option1 + '</div><div class="options option2"><input type="radio" name="question-'+ i +'" value="option2" class="question-option-'+ i +'" disabled> ' + test.option2 + '</div><div class="options option3"><input type="radio" name="question-'+ i +'" value="option3" class="question-option-'+ i +'" checked disabled> ' + test.option3 + '</div><div class="options option4"><input type="radio" id="2" name="question-'+ i +'" value="option4" class="question-option-'+ i +'" disabled> ' + test.option4 + '</div><div class="options option5"><div class="correct-answer"><b>Correct Answer:</b> ' + test.answer + '</div><div class="right-button text-muted pull-right"><button type="button" class="btn btn-success"  onclick="onExitClick(\'' + chapterId +  '\')" >Exit<i class="fa fa-sign-out"></i></button></div></div>';
				}
				
				
				if(test2.answer == "option4") {
					html1 = '<div class="options"><div class="options option1"><input type="radio" name="question-'+ i +'" value="option1" class="question-option-'+ i +'" disabled> ' + test.option1 + '</div><div class="options option2"><input type="radio" name="question-'+ i +'" value="option2" class="question-option-'+ i +'" disabled> ' + test.option2 + '</div><div class="options option3"><input type="radio" name="question-'+ i +'" value="option3" class="question-option-'+ i +'" disabled> ' + test.option3 + '</div><div class="options option4"><input type="radio" id="2" name="question-'+ i +'" value="option4" class="question-option-'+ i +'" checked disabled> ' + test.option4 + '</div><div class="options option5"><div class="correct-answer"><b>Correct Answer:</b> ' + test.answer + '</div><div class="right-button text-muted pull-right"><button type="button" class="btn btn-success"  onclick="onExitClick(\'' + chapterId +  '\')" >Exit<i class="fa fa-sign-out"></i></button></div></div>';
				}
				
			}
		});
		var b = $('#test-list .question-' + i + '').append(html1);
	});
    });
	
}


function  CircleArrowRight(i){
	var atLeastOneIsChecked = $('.question-option-'+i).is(':checked');
	
		var length= $(".question-option").length;
		i = i + 1;
		if(i<length){
			$(".question-outer-"+i).removeClass("hidden");
			$(".question-option").hide();
			$(".question-outer-"+i).show();	
		}	
	
	if(i==length){
		$('.btn-toolbar').removeClass('hidden');
	}else{
		$('.btn-toolbar').addClass('hidden');
	}
	console.log(i);
}

function  CircleArrowLeft(i){
	
	var atLeastOneIsChecked = $('.question-option-'+i).is(':checked');
		var length= $(".question-option").length;
		i = i - 1;
		if(i<length && i>=0){
			$(".question-outer-"+i).removeClass("hidden");
			$(".question-option").hide();
			$(".question-outer-"+i).show();	
		}
	if(i==length){
		$('.btn-toolbar').removeClass('hidden');
	}else{
		$('.btn-toolbar').addClass('hidden');
	}
}
