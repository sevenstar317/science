
$(document).ready(function(){
	var chapterId = $('#chapters-list').val();
	var userid = $('#userid').val();
	var page = $('#chapters-list');
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
			'lesson': 'true'
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
	

	$('[data-chapter-id]').on('click', onChapterChangedNew);
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

function onChapterChangedNew(e) {
	e.preventDefault();
	$('#test-title').text($(this).text());

	$('[data-chapter-id]').removeClass('active');
	$('.content-title').removeClass('hidden');
	$(this).addClass('active');
	var chapterId = $(this).data('chapter-id');
	var userid = $('#userid').val();
	var page = $(this).data('chapter-id');
	$('#chapters-list').val(chapterId);
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
			'lesson': 'true'
			},
		success: function(res) {
			if (res.status_code == 200) {
				parseTests(res,chapterId,userid);
			}
			else {
				$('#concepts .concept-group').append('<div class="no-data">Tests are not available.</div>');
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
	$('.content-title').removeClass('hidden');

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
	$('#concepts .concept-group').empty();
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
	$('.content-title').addClass('hidden');
	$("#test-list .test-title").text('Test #' + testNumber);
	var chapterId = $('#chapters-list').val();
	var html = '';
	var html1 = '';
	var maxLength = response.tests.length;

	$('.back').empty();
	$('.back').append('<a href="#" onclick="onExitClick(\'' + chapterId +  '\')">'+ 'Back' + '</a>');

	$.each(response.tests, function (i, test) {
		var arr = [test.option1,test.option2,test.option3,test.option4];
		shuffle(arr);
		
		var nTag = (i != 0 ? "hidden":"");

		html = 	'<div class="question-option question-outer-'+ i + ' '+nTag+'">'+
							/*'<p class="back">'+
									'<a href="#" onclick="onExitClick(\'' + chapterId +  '\')">'+ 'Back' + '</a>' +
							'</p>'+*/

		//'<button type="button" class="btn btn-success"  onclick="onExitClick(\'' + chapterId +  '\')" >Exit<i class="fa fa-sign-out"></i></button>'+


							'<a class="test-lesson-link pull-right" target="_blank" onclick="getHint(\''+test._id+'\')" ></a>'+
							'<input type="hidden" id="question-list question-' + i + '" value="'+ test._id +'" >'+
							'<div class="custom-button">'+
								'<div class="question-list question-' + i + '" id="'+ test._id +'">'+
									'<p class="question-question clearfix"><span class="question-icon"></span><span class="question-text">' + test.question + '</span></p>';
					
		html1 = '<div class="options">'+
							'<div class="options option1 option-answer">'+
								'<input type="radio" name="question-'+ i +'" value="'+arr[0]+'" class="question-option-'+ i +'"> ' +
								'<label class="answer-checkbox" for="question-'+ i +'"><i class="answer-checkbox-icon"></i><span class="answer-text answer-text-disabled">'+ arr[0] + '</span></label>'+
							'</div>'+
							'<div class="options option2 option-answer">'+
								'<input type="radio" name="question-'+ i +'" value="'+arr[1]+'" class="question-option-'+ i +'"> ' +
								'<label class="answer-checkbox" for="question-'+ i +'"><i class="answer-checkbox-icon"></i><span class="answer-text answer-text-disabled">'+ arr[1] + '</span></label>'+
							'</div>'+
							'<div class="options option3 option-answer">'+
								'<input type="radio" name="question-'+ i +'" value="'+arr[2]+'" class="question-option-'+ i +'"> ' +
								'<label class="answer-checkbox" for="question-'+ i +'"><i class="answer-checkbox-icon"></i><span class="answer-text answer-text-disabled">'+ arr[2] + '</span></label>'+
							'</div>'+
							'<div class="options option4 option-answer">'+
								'<input type="radio" id="2" name="question-'+ i +'" value="'+arr[3]+'" class="question-option-'+ i +'"> ' +
								'<label class="answer-checkbox" for="question-'+ i +'"><i class="answer-checkbox-icon"></i><span class="answer-text answer-text-disabled">'+ arr[3] + '</span></label>'+
							'</div>'+
							'<div class="options option5">'+
								'<div class="arrow-buttons clearfix">'+
									'<a href="#" onclick="CircleArrowLeft('+i+')" class="button-previous button-previous-'+ i + ' btn btn-orange2 pull-left hidden">&lt; Previous</a>'+
									//'<div class="button-next">'+
										'<a href="#" class="button-next button-next-'+ i + ' btn btn-default btn-orange2 pull-right" data-panel='+i+' onclick="CircleArrowRight('+i+')">Next &gt;</a>'+
									//'</div>' +
									'<div class="btn-toolbar hidden text-muted pull-right">'+
			 							'<a id="submit-answers" href="#" class="btn btn-warning pull-right" onclick="submitTest();_gaq.push([\'_trackEvent\', \'Tests\', \'Take Tests\']);">Submit</a>'+
				 					'</div>'+
									'<p>Question ' + (i + 1) + ' of '+ maxLength + '</p>'+
								'</div>'+
								
							'</div>'+
						'</div>';
		var a = $("#test-list .questions").append(html);
		var b = $('#test-list .question-' + i + '').append(html1);
		$('.answer-checkbox-icon').on('click', function (e) {
			var radio = $(this).parent().parent().find('input[type="radio"]');
			radio.prop('checked', true);
			console.log(radio);
		});
  });
}
function getHint(testID){

	$.ajax({
		type: 'GET',
		url: '/getHint',
		data: {
			'testID': testID
		},
		success: function(res) {
			
			$.ajax({
				type: 'GET',
				url: '/concept',
				data: {
					'syllabus': res.syllabus,'grade':res.grade,'chapter':res.chapter,'concept':res.concept
				},
				success: function(res) {
					window.open('/concept','_blank');
					//window.location='/concept'
				}
			});	
		}
	});	
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
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
	$('.content-title').addClass('hidden');

	
	var star = '';
	var i = 0;
	for(i=1; i<=score; i++) {
		star += '<img src="/images/star-on.png">';
	} 
	for(j=i; j<7; j++) {
		star += '<img src="/images/star-off.png">';
	} 
	
	/*html = '<div id="star-box">'+star+'</div><div class="score-group">You Scored ' + score + ' Points</div></div><div class="right-button text-muted pull-right"><button type="button" class="btn btn-success exit-button"  onclick="onExitClick(\'' + chapterId +  '\')" >Exit<i class="fa fa-sign-out"></i></button></div>';*/

	html = '<div class="score-group">You Scored ' + score + ' Points</div><div id="star-box">'+star+'</div><div class="review-button"><input type="button" class="btn btn-orange2 text-muted pull-left"  onclick="correctAnswer(\'' + chapterId +  '\',\'' + reviewAnsPage + '\',\'' + userid + '\')" value="Review Answer"></div>';
	
	$('#score').html(html);
}


function  glyphiconCircleArrowRight(i){
	var atLeastOneIsChecked = $('.question-option-'+i).is(':checked');
	if(atLeastOneIsChecked){
		var length= $(".question-option").length;
		//console.log("Original"+i);
		i = i + 1;
		var atLeastOneIsChecked2 = $('.question-option-'+i).is(':checked');
		//console.log("updated"+i);
		if(i<length){
				//console.log('atLeastOneIsChecked2:'+atLeastOneIsChecked2);
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
	//console.log(i);
}

function  glyphiconCircleArrowLeft(i){
	
	var atLeastOneIsChecked = $('.question-option-'+i).is(':checked');
	//if(atLeastOneIsChecked){
		var length= $(".question-option").length;
		//console.log("Original Left"+i);
		i = i - 1;
		//console.log("Updated Left"+i);
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
	$('#concepts .concept-group').empty();
	$('#concepts .concept-group .no-data').addClass('hidden');
	if (len <= 0) {
		testSetLen = 0;
		$('#concepts .concept-group').append('<div class="no-data">Tests are not available.</div>');	
	} 
	else {
		testSetLen = len;
		var j = 1;
		console.log(tests);
		
		for (var i = 0; i < testSetLen; i++) {
			$('#concepts .concept-group .no-data').addClass('hidden');
			html = '<a class="test-item" href="#" style="background: url(\'' + tests.images[i].image +'\'); background-size: cover;" class="test-link concept-' + j + ' " onclick="onTestClick(\'' + chapterId +  '\',\'' + i + '\',\'' + userid + '\')" data-page="' + j + '">'+
			'<div class="shadows"></div>' +
			'<p class="test-title">Test #' + (i + 1) + '</p></a>';
			$('#concepts .concept-group').append(html);
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
	var option1='';
	var option2='';
	var option3='';
	var option4='';
	var ques_id='';
	
	var tests123=[];
		
	$('.question-list').each(function() {
		var question=[];
		var testarray = {};
		$(".question-option-"+index).each(function(){
			
			
			if($(this).is(":checked")){
				question.push($(this).val());
				option1 = $(".option1 input.question-option-"+index).val();
				option2 = $(".option2 input.question-option-"+index).val();
				option3 = $(".option3 input.question-option-"+index).val();
				option4 = $(".option4 input.question-option-"+index).val();
				answer  = $(this).val();
				var x =  'question-list question-'+index;
				console.log(x);
				ques_id = document.getElementById(x).value;
				
			}
			testarray = {"ques_id" : ques_id,"answer" : answer,"option1":option1,"option2":option2,"option3":option3,"option4":option4};
			
		});
		tests123.push(testarray);
		
		tests12.push({"ques_id" : ques_id,"answer" : answer,"option1":option1,"option2":option2,"option3":option3,"option4":option4});
		
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
				console.log(res);
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
		for(j=0;j<myObject.length;j++){
			if(tests[i].ques_id == myObject[j].ques_id){
				if(tests[i].answer == myObject[j].answer) {
					score =score + 1;
				}
			}
		}		
	}
	
	$('.custom-button').addClass('hidden');
	$('.btn-review').removeClass('hidden');
	$('.btn-toolbar').addClass('hidden');
	//$('.content-title').addClass('hidden');
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
	//console.log(testNumber);

	/* // Next test previous functionality
		html = '<div class="score-group"><input type="button" class="btn btn-primary btn-xs text-muted pull-right"  onclick="onTestClick(\'' + chapterId +  '\',\'' + page + '\',\'' + userid + '\')" value="Next Test"><div id="star-box">'+star+'</div><div class="score-group">You Scored ' + score + ' Points</div>';
	$('#score').html(html);
	*/
	
	var reviewAnsPage = page - 1;
	
	html = 	'<div class="score-group">You Scored ' + score + ' Points</div>'+
					'<div id="star-box">'+star+'</div>'+
					'<div class="review-button">'+
						'<input type="button" class="btn btn-orange2 text-muted pull-left"  onclick="correctAnswer(\'' + chapterId +  '\',\'' + reviewAnsPage + '\',\'' + userid + '\')" value="Review Answers">'+
						'<input type="button" class="btn btn-primary btn-xs text-muted pull-right"  onclick="onTestClick(\'' + chapterId +  '\',\'' + page + '\',\'' + userid + '\')" value="Next Test">'+
					'</div>';
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
	
	//console.log("correctAnswer");
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
				//console.log("correctAnswer A");
				showCorrectAnswer(res, page);
			}
		}
	});
}



function showCorrectAnswer(response, page) {
	//console.log("showCorrectAnswer B");
	var testNumber = parseInt(page) + 1;
	$("#test-list .test-title").attr('data-test-number', testNumber);
	$("#test-list .test-title").text('Test #' + testNumber);
	var chapterId = $('#chapters-list').val();
	var html = '';
	var html1 = '';
	var html2 = '';
	
	var ab = '';
	var ca = '';
	//console.log(response.usertest_data);
	var maxLength = response.usertest_data.length;
	$.each(response.usertest_data, function (i, test) {
		var nTag = (i != 0 ? "hidden":"");
		html = 	'<div class="question-option question-outer-'+ i + ' '+nTag+'">'+
							'<div class="custom-button">'+
								'<div class="question-list question-' + i + '" id="'+ test._id +'">'+
									'<p class="question-question clearfix"><span class="question-icon"></span><span class="question-text">' + test.question + '</span></p>';
		$("#test-list .questions").append(html);
					
		html1 = '<div class="options">'+
							'<div class="options option1 option-answer">'+
								'<input type="radio" name="question-'+ i +'" value="'+test.option1+'" class="question-option-'+ i +'" '+ ((test.answer == test.option1) ? 'checked' : '') + ' disabled> ' +
								'<label class="answer-checkbox" for="question-'+ i +'"><i class="answer-checkbox-icon"></i><span class="answer-text answer-text-disabled">'+ test.option1 + '</span></label>'+
							'</div>'+
							'<div class="options option2 option-answer">'+
								'<input type="radio" name="question-'+ i +'" value="'+test.option2+'" class="question-option-'+ i +'" '+ ((test.answer == test.option2) ? 'checked' : '') +' disabled> ' +
								'<label class="answer-checkbox" for="question-'+ i +'"><i class="answer-checkbox-icon"></i><span class="answer-text answer-text-disabled">'+ test.option2 + '</span></label>'+
							'</div>'+
							'<div class="options option3 option-answer">'+
								'<input type="radio" name="question-'+ i +'" value="'+test.option3+'" class="question-option-'+ i +'" '+ ((test.answer == test.option3) ? 'checked' : '') +' disabled> ' +
								'<label class="answer-checkbox" for="question-'+ i +'"><i class="answer-checkbox-icon"></i><span class="answer-text answer-text-disabled">'+ test.option3 + '</span></label>'+
							'</div>'+
							'<div class="options option4 option-answer">'+
								'<input type="radio" id="2" name="question-'+ i +'" value="'+test.option4+'" class="question-option-'+ i +'" '+ ((test.answer == test.option4) ? 'checked' : '') +' disabled> ' +
								'<label class="answer-checkbox" for="question-'+ i +'"><i class="answer-checkbox-icon"></i><span class="answer-text answer-text-disabled">'+ test.option4 + '</span></label>'+
							'</div>'+
							'<div class="options option5">'+
								'<div class="correct-answer"><b>Correct Answer:</b> ' + test.correct_answer +
								'</div>'+
								'<div class="arrow-buttons clearfix">'+
									'<a href="#" onclick="CircleArrowLeft('+i+')" class="button-previous button-previous-'+ i + ' btn btn-orange2 pull-left hidden">&lt; Previous</a>'+
									'<a href="#" class="button-next button-next-'+ i + ' btn btn-default btn-orange2 pull-right" data-panel='+i+' onclick="CircleArrowRight('+i+')">Next &gt;</a>'+
									'<p>Question ' + (i + 1) + ' of '+ maxLength + '</p>'+
								'</div>'+
							'</div>'+
						'</div>';
					
			
				
			//$("#test-list .questions").append();
		//});
		var b = $('#test-list .question-' + i + '').append(html1);
	//});
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
		$('.button-next').addClass('hidden');
	}else{
		$('.btn-toolbar').addClass('hidden');
		$('.button-next').removeClass('hidden');
		
	}
	$('.button-previous').removeClass('hidden');
}

function  CircleArrowLeft(i){
	$('.button-next').removeClass('hidden');
	$('.btn-toolbar').addClass('hidden');
	
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

	if (i === 0) {
		$('.button-previous').addClass('hidden');
	}
}
