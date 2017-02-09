/*
 * Test Api Controller
 * @Author Rajkumar Soy
 */

var contentApi = function () {
	var async = require('async');
	var fs = require('fs');
	var utils = require('../utils');
    var UserModel = require('../models/users'),
		TokenModel = require('../models/tokens'),
		SyllabusModel = require('../models/syllabus'),
		GradeModel = require('../models/grades'),
		ChapterModel = require('../models/chapters'),
		ConceptModel = require('../models/concepts'),
		TestModel = require('../models/tests'),
		LinkModel = require('../models/links');
		VideoModel = require('../models/videos'),
		TestScoremodel = require('../models/testscore'),
		ReferenceModel = require('../models/references'),
		NoteModel = require('../models/notes'),
		UpdateModel = require('../models/updates'),
		LogModel = require('../models/logs'),
		logger = require('tracer').colorConsole(),
		fromMailAddress = 'no-reply@scienceisfun.in',
		nodemailer = require('nodemailer'),
		transporter = nodemailer.createTransport({
			service: 'Gmail',
			connectionTimeout: 90000,
			auth: {
				user: 'scienceisfun01@gmail.com',
				pass: 'romi2345'
			}
		}),
		
		getTests = function(req, res) {
			testIds = [];
			var conceptsIds = [];
			chapterId = req.param('chapterid');
			userId = req.user.id;
			async.waterfall([
				function(callb){
					UserModel.find({'_id':userId},function(err, user){
						if(err) throw err;
						if(user){
							callb(null,user);
						}
					});
				},
				function(user,callb) {
					LinkModel.find({
						'kind': 'test',
					}, {}, {sort: {'order':1}}, function(err, links) {
						if (err || !links) {
							console.log('Failed to get chapters.');
							
						} else {
							var len = links.length;
							for (var i = 0; i < len; i++) {
								testIds.push(links[i].test);
								conceptsIds.push(links[i].concept);
							}
						}
						//console.log(links);
						callb(null, testIds, conceptsIds);
					});
				},
				function (testIds, conceptsIds, callb) {
					ConceptModel.find({'_id': {$in:conceptsIds}}, {image: true}, function (err, concepts) {
						callb(null, testIds, concepts);
					});
				},
				function(testIds, concepts, callb) {
					TestModel.find({'_id': {$in:testIds}}, function(err, tests) {
						//console.log(tests);
						var testsInfo = {};
						if (err || !tests) {
							testsInfo = {'status_code':400, 'message':"Sorry. Something went wrong."}
						} else {
							
							//var tests = tests;
							testsInfo = {'status_code':200, 'test_count':testIds.length, 'testIds':testIds, "tests":tests, "images": concepts}
						}
						res.send(testsInfo);
						//callb(null, testIds, tests);
					});
				}
			]);
		}
		
		getTestsList = function(req, res) {
						
			var testIds = [];
				chapterId = req.param('chapterid'),
				userId = req.user.id,
				pagetitle = 1;
			var test_title = parseInt(pagetitle) + 1;
			var giveTestID = [];
			//console.log('test_title:'+test_title);
			async.waterfall([
				function(callb) {
					TestScoremodel.find({'user': userId,'chapter': chapterId,'test_title':test_title}, {},
					function(err, testdata) {
						if (err || !testdata) {
							console.log('Failed to get chapters.');
							//callb(null)
						} else {
							var len = testdata.length;
							if(len>0){
								testsInfo = {'status_code':201, 'testdata':testdata}
								res.send(testsInfo);
							}	else {
								callb(null);
								}
							}	
						});
				},
				function(callb) {
					var q = LinkModel.find({
						'kind': 'test',
						'chapter': chapterId
					}, {}).exec(function(err, links) {
						if (err || !links) {
							console.log('Failed to get chapters.');							
						} else {
							var len = links.length;
							var rem = len % 6;
							var testCounts = len - rem;
							
							for (var i = 0; i < len; i++) {
								testIds.push(links[i].test);
							}
							 
						}
						callb(null, testIds);
					});
				},
				function(testIds, callb) {
					TestModel.find({
						'_id': {$in:testIds},
					}, function(err, tests) {
						var testsInfo = {};
						if (err || !tests) {
							testsInfo = {'status_code':400, 'message':"Sorry. Something went wrong."}
						} else {

							shuffle(tests);
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
							
							testsInfo = {'status_code':200, 'test_count':testIds.length, 'testIds':testIds, "tests":tests}
						}
						res.send(testsInfo);
						
					});
				}
			]);
		},
		
		saveTestScore = function (req, res) {
			
            var schema = {
				'user': req.param('userid'),
				'chapter': req.param('chapterid'),
				'test_title': req.param('testtitle'),
				'score': req.param('score'),
				'user_answer':req.param('user_answer'),
            };
			console.log(schema);
			
			async.waterfall([
				function() {
					TestScoremodel.create(schema, function (err, test_score, result) {
                    	if (err) {
                        	console.log(err);
                        	
							var message = '';
                        	testsInfo = {'status_code':400, 'message': err}
							res.send(testsInfo);
                    	} else {
							testsInfo = {'status_code':200, 'message': 'Score Saved.'}
							res.send(testsInfo);
							console.log(result);
						}
					});
				}
			]);	
        },
        /*PARAM:
        *	syllabusid
        * 	gradeid
        * 	chapterid
        * 	questionid
        * 	
        * 	
        * */
		getHint = function(req, res) {

			var conceptIds = [];
			var resConcepts = [];
			console.log('hint');
			async.waterfall([
			function(cb) {
				LinkModel.find({
					'kind': 'test',
					'syllabus': req.param('syllabusid'),
					'grade': req.param('gradeid'),
					'chapter': req.param('chapterid'),
					'test': req.param('questionid'),
				}, {},
				function(err, links){
					if (err || !links || links.length <= 0) {
						console.log('Failed to get concepts.');
						res.send({
							'status_code': 200,
							'message': 'Concepts not found.',
							'grade': req.param('grade'),
							'concepts': '',
							'eof': 'true'
						});
					} else {
						links.forEach( function(k) {
							res.send({
								'status_code': 200,
								'message': 'Concepts found.',
								'concept': k.concept
							});
						});
					}
				});
			}
			]);				
		},
		
		/*
		 * Parameter:
		 * 	userid
		 * 	grade
		 * 	syllabus
		 */ 
		getPercentage = function(req,res){
			
			var percentage = 0;
			var testlen= 0;
			var totaltest= 0;
			var percentageInfo = [];
			var userid = req.param('userid');
			var grade = req.param('grade');
			var syllabus = req.param('syllabus');
			var id=0;
		    var resT;
			
			LinkModel.distinct('chapter',{'kind':'test','grade':grade,'syllabus':syllabus},function (err, tests){
				if(err||!tests)
				console.log('Did not get score');
				else {
					resT=tests;
    				test(id);
				}
			});

				function test(id){
			        if(id<resT.length)
			        {
			             
			            LinkModel.find({'kind':'test','grade':grade,'syllabus':syllabus,'chapter':resT[id]},function (err,res){
			                if(err) throw err;
								if(res){
									var testmade = Math.floor(res.length/6);
									totaltest+=testmade;
									test(++id);
								}
			               
			            });

			        }
			        else{
			        	
			        	TestScoremodel.find({'user':userid},function (err, testscore){
							if(err||!testscore)
							console.log('Did not get score');
							else
							testlen = testscore.length;
							percentage = Math.floor((testlen/totaltest)*100);

							res.send({
									'status_code': 200,
									'message': 'Success.',
									'percentage':percentage
									});
							
							
						});
			            
			        }
			    }

			},
		/*
		 *	Parameter:
		 * grade
		 * syllabus
		 * userid
		 * school
		 */
		getPercentile = function(req,res){
			var grade = req.param('grade');
			var syllabus = req.param('syllabus');
			var userid = req.param('userid');
			var userschool = req.param('school');
			var percentileInfo = [];
			var id=0;
			var arr=[];
		    var resT;
			
			UserModel.find({'syllabus':syllabus,'grade':grade,'school_name':userschool},function(err,users){
				if(err) throw err;
				if(users){
					resT=users;
    				test(id);
				}
			});

			function test(id){
			        if(id<resT.length)
			        {
			        	var userID = String(resT[id]._id);
			            TestScoremodel.aggregate([{ $match : {'user': userID } },{ $group: { _id: userID, count: { $sum: '$score' } } }],function (err, testscore){
			            	if(err) throw err;
			            	if(testscore){
			            		if(testscore.length > 0){
			            			arr.push({'userid':testscore[0]._id,'totalscore':testscore[0].count});
			            		} else {
			            			arr.push({'userid':userID,'totalscore':0});
			            		}

			            		
			            		test(++id);
			            	}
			            });
			        } else 
			        {
			        	var totalStudent = arr.length;
			        	var userScore = 0;
			        	var counterx = 0;
			        	var percentile = 0;

			        	for(var i = 0;i<totalStudent;i++){
			        		if(userid == arr[i].userid){
			        			userScore = arr[i].totalscore;
			        		}
			        	}
			        	

			        	for(var j = 0;j<totalStudent;j++){
			        		if(arr[j].totalscore <= userScore){
			        			counterx+=1;
			        		}
			        	}

			        	percentile = Math.floor((Number(counterx)/Number(totalStudent))*100);
			        	
			        	res.send({
                                            'status_code': 200,
                                            'message': 'Success.',
                                            'percentile':percentile
                                            });

			        }
			    }
			
			},
        getCategoriesTest = function (req, res) {

                var chapterIds = [];
                var resChapters = [];


                async.waterfall([
                        function(cb) {
                                LinkModel.find({
                                        'kind': 'chapter',
                                        'syllabus': req.user.syllabus,
                                        'grade': req.user.grade
                                }, {}, {sort: {'order':1}}, function(err, links) {
                                        if (err || !links) {
                                            res.send({'status_code':400, 'message': 'Failed to get chapters.'});
                                        } else {
                                                var len = links.length;
                                                for (var i = 0; i < len; i++) {
                                                        chapterIds.push(links[i].chapter);
                                                }
                                                cb(null);
                                        }
                                });
                        },
                        function(cb) {
                                ChapterModel.find({'_id': {$in:chapterIds}/*'grade': req.session.lesson.grade*/, 'enabled' : {$ne: 'false'} },
                                                                {}, {sort: {'order':1}}, function(err, chapters){
                                        if (err || !chapters || chapters.length <= 0) {
                                                res.send({'status_code':400, 'message': 'Failed to get chapters.'});
                                        } else {
                                                var len = chapters.length;

                                                for (var i = 0; i < len; i++) {
                                                        var chapter = chapters[i];
                                                        resChapters.push({
                                                            'id': chapter._id,
                                                            'title': utils.convertHtmlTagToSpecialChar(chapter.title)
                                                        });
                                                }



                                                cb(null);
                                        }
                                });
                        },
                        function(cb) {
                            res.send({
                                'status_code':200, 
                                'message': 'Succeeded to get chpaters.',
                                'categories': resChapters
                            });
                        }
                ]);
        },
        getSubCategories = function(req, res) {
                testIds = [];
                var conceptsIds = [];
                chapterId = req.param('chapterid');
                userId = req.user.id;
                async.waterfall([
                        function(callb) {
                                LinkModel.find({
                                        'kind': 'test',
                                }, {}, {sort: {'order':1}}, function(err, links) {
                                        if (err || !links) {
                                                console.log('Failed to get chapters.');

                                        } else {
                                                var len = links.length;
                                                for (var i = 0; i < len; i++) {
                                                        testIds.push(links[i].test);
                                                        conceptsIds.push(links[i].concept);
                                                }
                                        }
                                        //console.log(links);
                                        callb(null, testIds, conceptsIds);
                                });
                        },
                        function (testIds, conceptsIds, callb) {
                                ConceptModel.find({'_id': {$in:conceptsIds}}, {image: true}, function (err, concepts) {
                                    if(err || !concepts.length){
                                        res.send({
                                            'status_code':400,
                                            'message': 'Failed to get chapters.',
                                        });
                                    }
                                    else{
                                        res.send({
                                            'status_code':200,
                                            'message': 'Failed to get chapters.',
                                            'subCagtegories' : concepts   
                                       });
                                    }
                                });
                        },
                ]);
        }
		
	return {	
		getPercentile:getPercentile,
		getPercentage:getPercentage,
		getTests:getTests,
		getTestsList:getTestsList,
		saveTestScore:saveTestScore,
		getHint:getHint,
		getCategoriesTest:getCategoriesTest,
                getSubCategories:getSubCategories
		
		
	};

}();

module.exports = contentApi;

