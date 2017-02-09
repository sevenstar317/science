/*
 * Index Controller
 * @Author zuogong
 */

var home = function () {
	
	var fbgraph = require('fbgraphapi');
	var newfbgraph = require('fbgraph');
	var facebook = require('./social-friend-list');
	var googleapis = require('googleapis');
	var DiscussionsController = require('./discussions');
    var UserModel = require('../models/users'),
		SyllabusModel = require('../models/syllabus'),
		GradeModel = require('../models/grades'),
		ChapterModel = require('../models/chapters'),
		ConceptModel = require('../models/concepts'),
		TestModel = require('../models/tests'),
		VideoModel = require('../models/videos'),
		ReferenceModel = require('../models/references'),
		NoteModel = require('../models/notes'),
		UpdateModel = require('../models/updates'),
		LogModel = require('../models/logs'),
		LinkModel = require('../models/links'),
		TestScoremodel = require('../models/testscore'),
		dateFormat = require('dateformat'),
		utils = require('../utils'),
		Common = require('./common'),
		async = require('async'),
		request = require('request'),
		logger = require('tracer').colorConsole(),
		google_key = 'AIzaSyCijF8bxiN85ZflIllbtrCXdG5RkUbwZXc',
		fromMailAddress = 'no-reply@scienceisfun.in',
		nodemailer = require('nodemailer'),
		transporter = nodemailer.createTransport({
			service: 'Gmail',
			connectionTimeout: 90000,
			auth: {
				user: 'scienceisfun01@gmail.com',
				pass: 'funisscience'
			}
		}),
		
		googleapis = require('googleapis'),
		plus = googleapis.plus('v1'),
		OAuth2 = googleapis.auth.OAuth2,
		oauth2Client = new OAuth2('25626773198-ldeub2pae5rjgk7hjlpt68jb0ppevmn6.apps.googleusercontent.com', 'GaoG2DDSbZ3R3NYW-fJQwSJa', 'http://scienceisfun.mobiloitte.org:3000/auth/google/callback');
		
		
		
    	/*
    	 *  Render to index page
    	 */
        index = function (req, res) {
			if (!req.session.user)
            	res.redirect('/grades');
			else {
				req.session.lesson.grade = req.session.user.grade;
				req.session.lesson.syllabus = req.session.user.syllabus;
				res.redirect('/myclass');
			}
        },
		renderGradesPage = function (req, res) {
						
			if (!req.session.lesson) {
				req.session.lesson = {
				'isLesson': 'false',
				'syllabus': '',
				'grade': '',
				'chapter': '',
				'concept': ''
			};
			}
			

			SyllabusModel.find({
				'enabled' : {$ne: 'false'}
			}, {
				'title': 1,
				'order': 1
			}, {
				sort: {'order': 1}
			}, function(err, syllabuses){
				if (err || !syllabuses || syllabuses.length <= 0) {
					console.log('Failed to get grades.');
					return res.render('grades');
				} else {
					//cb(null, syllabuses);
					console.log('Succeeded to get grades.');
					res.render('grades', {'syllabuses': syllabuses});
				}
			});
			/*
			GradeModel.find({}, {}, {sort: {'order':1}}, function(err, grades){
				if (err || !grades || grades.length <= 0) {
					console.log('Failed to get grades.');
					res.render('grades');
				} else {
					var len = grades.length;
					var resGrades = [];

					for (var i = 0; i < len; i++) {
						var grade = grades[i];
						resGrades.push({
							'id': grade._id,
							'grade': grade.grade,
							'enabled': grade.enabled
						});
					}

					console.log('Succeeded to get grades.');
					res.render('grades', {'grades': resGrades});
				}
			});*/
		},
		renderLastLessonPage = function (req, res) {
			res.redirect('/lessons');
			//res.redirect('/afterLogin');
		},
		renderLessonsPage = function (req, res) {
			if (req.param('syllabus') || req.param('grade') || req.param('chapter') ) {
				if (req.param('syllabus'))
					req.session.lesson.syllabus = req.param('syllabus');

				if (req.param('grade'))
					req.session.lesson.grade = req.param('grade');

				if (req.param('chapter'))
					req.session.lesson.chapter = req.param('chapter');

				res.redirect('/lessons');
				//res.redirect('/afterLogin');
				return;
			} else if (!req.session.lesson || req.session.lesson.grade == '') {
				res.redirect('/grades');
				return;
			}

			req.session.concept = {
				'syllabus': '',
				'grade': '',
				'chapter': '',
				'concept': ''
			};

			var chapterIds = [];
			var resChapters = [];
			var resClassmates = [];
			var resFriends = [];
			var gradeNames = [];
			var resScientists = [];

			var tempLst = Common.getScientists();
			for (var i = 0; i < tempLst.length; i++) {
				if (req.session.guest.name != tempLst[i].name)
					resScientists.push(tempLst[i]);
			}

			async.waterfall([
			function(cb) {
				LinkModel.find({
					'kind': 'chapter',
					'syllabus': req.session.lesson.syllabus,
					'grade': req.session.lesson.grade
				}, {}, {sort: {'order':1}}, function(err, links) {
					if (err || !links) {
						console.log('Failed to get chapters.');
						return res.redirect('/grades');
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
				GradeModel.find({}, function(err, grades){
					if (err || !grades || grades.length <= 0) {
						console.log('Failed to get grade name list.');
						return res.redirect('/grades');
					} else {
						var len = grades.length;
						for (var i = 0; i < len; i++) {
							var grade = grades[i];
							gradeNames[grade._id] = grade.grade;
						}
						cb(null);
					}
				});
			},
			function(cb) {

				Common.getSyllabus (req.session.lesson.syllabus, function(syllabus){
					
					if (syllabus)
						req.session.lesson.syllabus_name = syllabus.title;
						
					cb(null);
				});
			},
			function(cb) {

				Common.getGrade (req.session.lesson.grade, function(grade){
					
					if (grade)
						req.session.lesson.grade_name = grade.grade;
						
					cb(null);
				});
			},
			function(cb) {
				ChapterModel.find({'_id': {$in:chapterIds}/*'grade': req.session.lesson.grade*/, 'enabled' : {$ne: 'false'} },
								{}, {sort: {'order':1}}, function(err, chapters){
					if (err || !chapters || chapters.length <= 0) {
						console.log('Failed to get chpaters.');
						res.render('concepts', {'lesson': req.session.lesson, 'scientists': resScientists});
					} else {
						var len = chapters.length;
		
						for (var i = 0; i < len; i++) {
							var chapter = chapters[i];
							resChapters.push({
								'id': chapter._id,
								'title': utils.convertHtmlTagToSpecialChar(chapter.title)
							});
						}
		
						if (req.session.lesson.chapter == '') {
							req.session.lesson.chapter = chapters[0]._id;
							req.session.lesson.concept = '';
						}
		
						req.session.lesson.isLesson = 'false';
		
						console.log('Succeeded to get chpaters.');
						cb(null);
					}
				});
			},
			function(cb) { // get classmates
				if (req.session.user && req.session.user.id) { // logined user
					UserModel.find({
						'_id': {$ne: req.session.user.id},
						'school_name': req.session.user.school_name,
						'grade': req.session.user.grade,
						'section': req.session.user.section
					}, function(err, classmates) {

						var tmp = [];

						if (err || !classmates || classmates.length <= 0)
							resClassmates = [];
						else {
							tmp = utils.getRandomArray(classmates, 8);

							for (var i = 0; i < tmp.length; i++) {
								var item = tmp[i];
								var receive_update = 'false';
								var update_len = item.update_on_users.length;

								for (var k = 0; k < update_len; k++) {
									if (item.update_on_users[k] == req.session.user.id) {
										receive_update = 'true';
										break;
									}
								}

								resClassmates.push({
									'id': item._id,
									'name': item.name,
									'email': item.email,
									'school_name': item.school_name,
									'school_location': item.school_addr,
									'grade': gradeNames[item.grade],
									'section': item.section,
									'receive_update': receive_update,
									'photo': item.photo
								});
							}

						}

						cb(null);
					});
				}
				else { // guest user
					cb(null);
				}
			},
			function(cb) { // get friends
				if (req.session.user && req.session.user.id) {
					UserModel.find({
						$or: [
							{'school_name': {$ne: req.session.user.school_name}},
							{'grade': {$ne: req.session.user.grade}}
						],
						'friends': req.session.user.id
					}, function(err, friends) {
						var tmp = [];

						if (err || !friends || friends.length <= 0)
							resFriends = [];
						else {
							tmp = utils.getRandomArray(friends, 9);

							for (var i = 0; i < tmp.length; i++) {
								var item = tmp[i];
								var receive_update = 'false';
								var update_len = item.update_on_users.length;

								for (var k = 0; k < update_len; k++) {
									if (item.update_on_users[k] == req.session.user.id) {
										receive_update = 'true';
										break;
									}
								}

								resFriends.push({
									'id': item._id,
									'name': item.name,
									'email': item.email,
									'school_name': item.school_name,
									'school_location': item.school_addr,
									'grade': gradeNames[item.grade],
									'section': item.section,
									'receive_update': receive_update,
									'photo': item.photo
								});
							}
						}

						cb(null);
					});
				}
				else {
					cb(null);
				}
			},
			function(cb) {
				res.render('concepts', {
						'chapters': resChapters,
						'lesson': req.session.lesson,
						'classmates': resClassmates,
						'friends': resFriends,
						'scientists': resScientists}
						);
			}
			]);
		},
		renderConceptPage = function (req, res) {
			if (req.param('syllabus') || req.param('grade') || req.param('chapter') || req.param('concept')) {
				if (req.param('syllabus'))
					req.session.concept.syllabus = req.param('syllabus');

				if (req.param('grade'))
					req.session.concept.grade = req.param('grade');

				if (req.param('chapter'))
					req.session.concept.chapter = req.param('chapter');

				if (req.param('concept'))
					req.session.concept.concept = req.param('concept');

				res.redirect('/concept');
				return;
			} else if (!req.session.concept || req.session.concept.concept == '') {
				res.redirect('/lessons');
				return;
			}


			var conceptId = req.session.concept.concept;

			var chapterIds = [];
			var resChapters = [];
			var resConceptDetail;
			var resDefaultVideo;
			var resVideos = [];
			var resReference;
			var resNotes = [];
			var gradeNames = [];

			logger.trace();
			async.waterfall([
			function(cb) {
				LinkModel.find({
					'kind': 'chapter',
					'syllabus': req.session.concept.syllabus,
					'grade': req.session.concept.grade
				}, {}, {sort: {'order':1}}, function(err, links) {
					if (err || !links) {
						console.log('Failed to get chapters.');
						return res.redirect('/lessons');
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
				GradeModel.find({}, function(err, grades){
					if (err || !grades || grades.length <= 0) {
						console.log('Failed to get grade name list.');
						return res.redirect('/lessons');
					} else {
						var len = grades.length;
						for (var i = 0; i < len; i++) {
							var grade = grades[i];
							gradeNames[grade._id] = grade.grade;
						}
						cb(null);
					}
				});
			},
			function(cb) {
				ChapterModel.find({'_id': {$in:chapterIds}, 'enabled' : {$ne: 'false'} },
								{}, {sort: {'order':1}}, function(err, chapters){
					if (err || !chapters || chapters.length <= 0) {
						console.log('Failed to get chpaters.');
						res.render('concept_detail', {'concept': req.session.concept});
					} else {
						var len = chapters.length;
		
						for (var i = 0; i < len; i++) {
							var chapter = chapters[i];
							resChapters.push({
								'id': chapter._id,
								'title': utils.convertHtmlTagToSpecialChar(chapter.title)
							});
						}
		
						if (req.session.concept.chapter == '') {
							req.session.concept.chapter = chapters[0]._id;
							req.session.concept.concept = '';
						}
		
						console.log('Succeeded to get chpaters.');
						cb(null);
					}
				});
			},
			function(cb) {
				ConceptModel.findOne({'_id': conceptId}, function(err, concept){
					if (err || !concept) {
						console.log('Failed to get concept.');
						return res.render('concept_detail', {'concept': req.session.concept, 'chapters': resChapters});
					}
					
					resConceptDetail = {
						'id': concept._id,
						'title': utils.convertHtmlTagToSpecialChar(concept.title),
						'text': concept.text,
						'image': concept.image,
						'image_source': concept.image_source,
						'image_credit': concept.image_credit,
						'image2': concept.image2,
						'image2_source': concept.image2_source,
						'image2_credit': concept.image2_credit
					};
		
					cb(null);
				});
			},
			function(cb) {
				_getConceptDefaultVideo(req, conceptId, function(video){

					if (video) {
						resDefaultVideo = {
							'id': video._id,
							'url': video.url,
							'owner': video.owner,
							'date': dateFormat(video.date, "dd mmm yyyy")
						};
					}

					cb(null);
				});
			},
			function(cb) {
				_getConceptVideos(req, conceptId, function(videos){
					//console.log(videos);
					if (!videos) {
						cb(null);
					} else {
						var len = videos.length;
						for (var i = 0; i < len; i++) {
							var video = videos[i];
							var id = '' + video._id;

							if (resDefaultVideo && resDefaultVideo.id &&
								id == resDefaultVideo.id)
								continue;

							resVideos.push ({
								'id': video._id,
								'url': video.url,
								'date': dateFormat(video.date, "dd mmm yyyy"),
								'owner': video.owner,
								'owner_name': 'Admin',
								'owner_photo': '/images/guest.png',
								'owner_email': '',
								'owner_school': '',
								'owner_location': '',
								'owner_grade': '',
								'owner_section': '',
								'owner_rcv_update': ''
							});
						}
						console.log(resVideos);
						cb(null);
					}
				});
			},
			function(cb) {
				var len = resVideos.length;
				var cnt = 0;

				if (len <= 0) {
					cb(null);
				} else {
					
					for (var i = 0; i < len; i++) {
						video = resVideos[i];

						UserModel.findOne({'_id': video.owner}, function(err1, user){
							var videoLen = resVideos.length;
							for (var k = 0; k < videoLen; k++) {
								var resVideo = resVideos[k];

								if (err1 || !user) {
									console.log('Failed to get user.');
									resVideo.owner_name = 'Admin';
									resVideo.owner_photo = '/images/guest.png';
								} else if (resVideo.owner != user._id) {
									continue;
								} else {
									var receive_update = 'false';
									var update_len = user.update_on_users.length;

									for (var j = 0; j < update_len; j++) {
										if (user.update_on_users[j] == req.session.user.id) {
											receive_update = 'true';
											break;
										}
									}

									resVideo.owner_name = user.name;
									if (user.photo != '')
										resVideo.owner_photo = user.photo;
									else
										resVideo.owner_photo = '/images/guest.png';
									resVideo.owner_email = user.email;
									resVideo.owner_school = user.school_name;
									resVideo.owner_location = user.school_addr;
									resVideo.owner_grade = gradeNames[user.grade];
									resVideo.owner_section = user.section;
									resVideo.owner_rcv_update = receive_update;
								}
							}

							cnt++;
							if (cnt >= len) {
								console.log('Succeeded to get videos.');
								console.log(resVideos);
								cb(null);
							}
						});
					}
				}
			},
			function(cb) {
				_getConceptReference(req, conceptId, function(reference){

					if (!reference) {
						cb(null);
					} else {
						resReference = {
							'url': reference.url,
							'domain': utils.getDomainFromUrl(reference.url),
							'title': reference.title,
							'description': reference.description,
							'image': reference.image
						};
						cb(null);
					}
				});
			},
			function(cb) {
				if (req.session.user) {
					_getConceptNotes(req, conceptId, function(notes){

						if (!notes) {
							cb(null);
						} else {
							var len = notes.length;
							for (var i = 0; i < len; i++) {
								var note = notes[i];
								var isDefault = 'false';

								if (req.session.user) {
									var defLen = note.defaulted_user.length;
									for (var j = 0; j < defLen; j++) {
										if (note.defaulted_user[j] == req.session.user.id) {
											isDefault = 'true';
											break;
										}
									}
								}

								if (isDefault == 'false') {
									resNotes.push ({
										'id': note._id,
										'note': (note.note),
										'date': dateFormat(note.date, "dd mmm yyyy"),
										'isDefault': isDefault,
										'owner': note.owner,
										'owner_name': 'Admin',
										'owner_photo': '/images/guest.png',
										'owner_email': '',
										'owner_school': '',
										'owner_location': '',
										'owner_grade': '',
										'owner_section': '',
										'owner_rcv_update': ''
									});
								} else {
									// push into first
									resNotes.unshift ({
										'id': note._id,
										'note': (note.note),
										'date': dateFormat(note.date, "dd mmm yyyy"),
										'isDefault': isDefault,
										'owner': note.owner,
										'owner_name': 'Admin',
										'owner_photo': '/images/guest.png',
										'owner_email': '',
										'owner_school': '',
										'owner_location': '',
										'owner_grade': '',
										'owner_section': '',
										'owner_rcv_update': ''
									});
								}
							}
							cb(null);
						}
					});
				} else {
					cb(null);
				}
			},
			function(cb) {
				var len = resNotes.length;
				var cnt = 0;

				if (len <= 0) {
					cb(null);
				} else {
					
					for (var i = 0; i < len; i++) {
						note = resNotes[i];

						UserModel.findOne({'_id': note.owner}, function(err1, user){
							var noteLen = resNotes.length;
							for (var k = 0; k < noteLen; k++) {
								var resNote = resNotes[k];

								if (err1 || !user) {
									console.log('Failed to get user.');
									resNote.owner_name = 'Admin';
									resNote.owner_photo = '/images/guest.png';
								} else if (resNote.owner != user._id) {
									continue;
								} else {
									var receive_update = 'false';
									var update_len = user.update_on_users.length;

									for (var j = 0; j < update_len; j++) {
										if (user.update_on_users[j] == req.session.user.id) {
											receive_update = 'true';
											break;
										}
									}

									resNote.owner_name = user.name;
									if (user.photo != '')
										resNote.owner_photo = user.photo;
									else
										resNote.owner_photo = '/images/guest.png';
									resNote.owner_email = user.email;
									resNote.owner_school = user.school_name;
									resNote.owner_location = user.school_addr;
									resNote.owner_grade = gradeNames[user.grade];
									resNote.owner_section = user.section;
									resNote.owner_rcv_update = receive_update;
								}
							}

							cnt++;
							if (cnt >= len) {
								console.log('Succeeded to get notes.');
								cb(null);
							}
						});
					}
				}
			},
			function(cb) {

				return res.render('concept_detail', {
						'concept': req.session.concept,
						'chapters': resChapters,
						'details': resConceptDetail,
						'default_video': resDefaultVideo,
						'videos': resVideos,
						'reference': resReference,
						'notes': resNotes
				});
			}
			]);
		},
		renderSearchVideoPage = function (req, res) {
			if (!req.session || !req.session.concept)
				return res.redirect('/concept');

			var conceptId = req.session.concept.concept;

			var chapterIds = [];
			var resChapters = [];
			var resConceptDetail;
			var resVideos = [];

			async.waterfall([
			function(cb) {
				LinkModel.find({
					'kind': 'chapter',
					'syllabus': req.session.concept.syllabus,
					'grade': req.session.concept.grade
				}, {}, {sort: {'order':1}}, function(err, links) {
					if (err || !links) {
						console.log('Failed to get chapters.');
						return res.redirect('/concept');
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
				ChapterModel.find({'_id': {$in:chapterIds}, 'enabled' : {$ne: 'false'} },
								{}, {sort: {'order':1}}, function(err, chapters){
					if (err || !chapters || chapters.length <= 0) {
						console.log('Failed to get chpaters.');
						return res.redirect('/concept');
					} else {
						var len = chapters.length;
		
						for (var i = 0; i < len; i++) {
							var chapter = chapters[i];
							resChapters.push({
								'id': chapter._id,
								'title': utils.convertHtmlTagToSpecialChar(chapter.title)
							});
						}
		
						console.log('Succeeded to get chpaters.');
						cb(null);
					}
				});
			},
			function(cb) {
				ConceptModel.findOne({'_id': conceptId}, function(err, concept){
					if (err || !concept) {
						console.log('Failed to get concept.');
						return res.redirect('/concept');
					}
					
					resConceptDetail = {
						'id': concept._id,
						'title': utils.convertHtmlTagToSpecialChar(concept.title),
						'text': concept.text,
						'image': concept.image,
						'image_source': concept.image_source,
						'image_credit': concept.image_credit,
						'image2': concept.image2,
						'image2_source': concept.image2_source,
						'image2_credit': concept.image2_credit
					};
		
					cb(null);
				});
			},
			function(cb) {
				_getConceptVideos(req, conceptId, function(videos){

					if (!videos) {
						cb(null);
					} else {
						var len = videos.length;
						for (var i = 0; i < len; i++) {
							var video = videos[i];

							resVideos.push ({
								'id': video._id,
								'url': video.url,
								'date': dateFormat(video.date, "dd mmm yyyy"),
								'owner': video.owner
							});
						}
						cb(null);
					}
				});
			},
			function(cb) {

				return res.render('search_video', {
						'concept': req.session.concept,
						'chapters': resChapters,
						'details': resConceptDetail,
						'videos': resVideos
				});
			}
			]);
		},
		renderContentsRepositoryPage = function (req, res) {
			if (req.param('type') || req.param('chapter')) {
				if (req.param('type'))
					req.session.lesson.contents = req.param('type');

				if (req.param('chapter'))
					req.session.lesson.chapter = req.param('chapter');

				res.redirect('/contents');
				return;
			}

			var chapterIds = [];

			async.waterfall([
			function(cb) {
				LinkModel.find({
					'kind': 'chapter',
					'syllabus': req.session.lesson.syllabus,
					'grade': req.session.lesson.grade
				}, {}, {sort: {'order':1}}, function(err, links) {
					if (err || !links) {
						console.log('Failed to get chapters.');
						return res.redirect('/contents', {'lesson': req.session.lesson});
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
				ChapterModel.find({'_id': {$in:chapterIds} /*'grade': req.session.lesson.grade*/, 'enabled' : {$ne: 'false'} },
								{}, {sort: {'order':1}}, function(err, chapters){
					if (err || !chapters || chapters.length <= 0) {
						console.log('Failed to get chpaters.');
						res.render('contents', {'lesson': req.session.lesson});
					} else {
						var len = chapters.length;
						var resChapters = [];
		
						for (var i = 0; i < len; i++) {
							var chapter = chapters[i];
							resChapters.push({
								'id': chapter._id,
								'title': utils.convertHtmlTagToSpecialChar(chapter.title)
							});
						}
		
						var video_active = '';
						var reference_active = '';
						var note_active = '';
		
						if (req.session.lesson.contents == 'reference')
							reference_active = 'active';
						else if (req.session.lesson.contents == 'note')
							note_active = 'active';
						else
							video_active = 'active';
		
						console.log('Succeeded to get chpaters.');
						res.render('contents', 
							{
								'chapters': resChapters,
								'video_active': video_active,
								'reference_active': reference_active,
								'note_active': note_active,
								'lesson': req.session.lesson
							}
						);
					}
				});
			}
			]);
		},
		renderTest = function (req, res) {
				console.log("hello 123");
			if (req.param('type') || req.param('chapter')) {
				if (req.param('type'))
					req.session.lesson.contents = req.param('type');

				if (req.param('chapter'))
					req.session.lesson.chapter = req.param('chapter');

				res.redirect('/testSelection');
				return;
			}

			var chapterIds = [];

			async.waterfall([
			function(cb) {
				
				LinkModel.find({
					'kind': 'chapter',
					'syllabus': req.session.lesson.syllabus,
					'grade': req.session.lesson.grade
				}, {}, {sort: {'order':1}}, function(err, links) {
					if (err || !links) {
						console.log('Failed to get chapters.');
						return res.redirect('/contents', {'lesson': req.session.lesson});
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
				
				ChapterModel.find({'_id': {$in:chapterIds} /*'grade': req.session.lesson.grade*/, 'enabled' : {$ne: 'false'} },
								{}, {sort: {'order':1}}, function(err, chapters){
					if (err || !chapters || chapters.length <= 0) {
						console.log('Failed to get chpaters.');
						res.render('contents', {'lesson': req.session.lesson});
					} else {
						var len = chapters.length;
						var resChapters = [];
		
						for (var i = 0; i < len; i++) {
							var chapter = chapters[i];
							resChapters.push({
								'id': chapter._id,
								'title': utils.convertHtmlTagToSpecialChar(chapter.title)
							});
						}
		
						var video_active = '';
						var reference_active = '';
						var note_active = '';
		
						if (req.session.lesson.contents == 'reference')
							reference_active = 'active';
						else if (req.session.lesson.contents == 'note')
							note_active = 'active';
						else
							video_active = 'active';
		
						console.log('Succeeded to get chpaters.');
						res.render('contents', 
							{
								'chapters': resChapters,
								'video_active': video_active,
								'reference_active': reference_active,
								'note_active': note_active,
								'lesson': req.session.lesson
							}
						);
					}
				});
			}
			]);
		},
		/*
		 * param: lat
		 *        lng
		 */
		getSchools = function (req, res) {
			var geo = req.param('lat') + ',' + req.param('lng');

			request({
				uri: "https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=" + google_key + "&location=" + geo + "&radius=5000.0&sensor=false&types=school",
				method: "GET",
				timeout: 10000
			}, function(err, response, body){
				if (err) {
					console.log('Failed to get schools.');
					console.log(err);
					res.send({
						'status_code': 400,
						'message': 'Schools were not got successfully.'
					});
				} else {
					console.log('Succeeded to get schools.');
					var schools = JSON.parse(body);
					res.send({
						'status_code': 200,
						'message': 'Schools were got successfully.',
						'schools': schools.results
					});
				}
			});
		},
		/*
		 * param: query
		 */
		searchSchools = function (req, res) {
			request({
				uri: "https://maps.googleapis.com/maps/api/place/textsearch/json?key=" + google_key + "&query=" + req.param('query') + "&types=school",
				method: "GET",
				timeout: 10000
			}, function(err, response, body){
				if (err) {
					console.log('Failed to search schools.');
					res.send({
						'status_code': 400,
						'message': 'Schools were not got successfully.'
					});
				} else {
					console.log('Succeeded to search schools.');
					var schools = JSON.parse(body);
					res.send({
						'status_code': 200,
						'message': 'Schools were got successfully.',
						'schools': schools.results
					});
				}
			});
		},
		/*
		 * param: reference
		 */
		getSchool = function (req, res) {
			request({
				uri: "https://maps.googleapis.com/maps/api/place/details/json?key=" + google_key + "&reference=" + req.param('reference') + "&sensor=false",
				method: "GET",
				timeout: 10000
			}, function(err, response, body){
				if (err) {
					console.log('Failed to get school.');
					res.send({
						'status_code': 400,
						'message': 'School was not got successfully.'
					});
				} else {
					console.log('Succeeded to get school.');
					var school = JSON.parse(body);

					if (!school.result || !school.result.name){
						res.send({
							'status_code': 400,
							'message': 'School was not got successfully.'
						});
						return;
					}

					var info = {
						'name': school.result.name,
						'address': '',
						'city': '',
						'postal_code': '',
						'country': '',
						'location': school.result.geometry.location
					};

					if (school.result.vicinity) {
						var address = school.result.vicinity;
						var start = 0, pos;

						pos = address.indexOf(', ', start);
						if (pos != -1) {
							info.address = address.substring(start, pos);

							start = pos + 2;
							info.city = address.substring(start);
						}					
					}

					if (school.result.address_components) {
						var len = school.result.address_components.length;
						for (var i = 0; i < len; i++) {
							var address = school.result.address_components[i];
							var typeLen = address.types.length;
							for (var j = 0; j < typeLen; j++) {
								if (address.types[j] == 'country') {
									info.country = address.long_name;
									break;
								}

								if (address.types[j] == 'postal_code') {
									info.postal_code = address.long_name;
									break;
								}
							}
						}
					}

					res.send({
						'status_code': 200,
						'message': 'School was got successfully.',
						'school': info
					});
				}
			});
		},
		/*
		 * param: input
		 */
		autocomplete = function(req, res) {
			var timestamp = (new Date()).getTime();
			request({
				uri: "https://maps.googleapis.com/maps/api/place/autocomplete/json?key=" + google_key + "&input=" + req.param('input'),
				method: "GET",
				timeout: 10000
			}, function(err, response, body){
				if (err) {
					console.log('Failed to complete automatically.');
					res.send({
						'status_code': 400,
						'message': 'Schools were not got successfully.'
					});
				} else {
					console.log('Succeeded to complete automatically.');
					var data = JSON.parse(body);
					var len = data.predictions.length;
					var predictions = [];
					for (var i = 0; i < len; i++) {
						predictions.push(data.predictions[i].description);
					}

					res.send({
						'status_code': 200,
						'message': 'Schools were got successfully.',
						'input': req.param('input'),
						'predictions': predictions,
						'timestamp': timestamp
					});
				}
			});
		},
		/*
		 * param: chapter_id
		 */
		getConcepts = function(req, res){
			if (!req.param('chapter_id') || req.param('chapter_id') == '') {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the chapter id.'
				});
			}
			
			if (req.param('lesson') && req.param('lesson') == 'true') {
				req.session.lesson.chapter = req.param('chapter_id');
				if (req.session.user) {
					UserModel.update({'_id': req.session.user.id}, 
						{'last_showed_chapter': req.session.lesson.chapter}, 
						function(err, user) {
							if (err)
								console.log('Failed to remember last read chapter.');
							else
								console.log('Succeeded to remember last read chapter.');
						}
					);
				}
			}

			var conceptIds = [];
			var resConcepts = [];

			async.waterfall([
			function(cb) {
				LinkModel.find({
					'kind': 'concept',
					'syllabus': req.session.lesson.syllabus,
					'grade': req.session.lesson.grade,
					'chapter': req.session.lesson.chapter
				}, {}, {sort: {'order':1}}, function(err, links) {
					if (err || !links || links.length <= 0) {
						console.log('Failed to get concepts.');
						res.send({
							'status_code': 400,
							'message': 'Concepts not found.',
						});
					} else {
						var len = links.length;
						for (var i = 0; i < len; i++) {
							conceptIds.push(links[i].concept);
						}
						cb(null);
					}
				});
			},
			function(cb) {
				var len = conceptIds.length;
				var cnt = 0;

				for (var j = 0; j < len; j++) {
					var conceptId = conceptIds[j];

					ConceptModel.findOne({
						'_id': conceptId,
						'enabled' : {$ne: 'false'}
					}, function(err, concept){
						cnt ++;
						if (err || !concept) {
							console.log('Failed to get concept: ' + conceptId);
							/*res.send({
								'status_code': 400,
								'message': 'Concepts not found.',
							});*/
						} else {
							resConcepts.push({
								'id': concept._id,
								'title': utils.convertHtmlTagToSpecialChar(concept.title),
								'image': concept.image,
								'image_source': concept.image_source,
								'image_credit': concept.image_credit,
								'image2': concept.image2,
								'image2_source': concept.image2_source,
								'image2_credit': concept.image2_credit
							});
						}

						if (cnt >= len) {
							cb(null);
						}
					});
				}
			},
			/* Display Test Data
			function(cb) {
				var len = conceptIds.length;
				var cnt = 0;

				for (var j = 0; j < len; j++) {
					var conceptId = conceptIds[j];

					ConceptModel.findOne({
						'_id': conceptId,
						'enabled' : {$ne: 'false'}
					}, function(err, concept){
						cnt ++;
						if (err || !concept) {
							console.log('Failed to get concept: ' + conceptId);
							/*res.send({
								'status_code': 400,
								'message': 'Concepts not found.',
							});
						} else {
							resConcepts.push({
								'id': concept._id,
								'title': utils.convertHtmlTagToSpecialChar(concept.title),
								'image': concept.image,
								'image_source': concept.image_source,
								'image_credit': concept.image_credit,
								'image2': concept.image2,
								'image2_source': concept.image2_source,
								'image2_credit': concept.image2_credit
							});
						}

						if (cnt >= len) {
							cb(null);
						}
					});
				}
			},
			*/
			function(cb) {
				console.log('Succeeded to get concepts.');
				res.send({
					'status_code': 200,
					'message': 'Concepts were got successfully.',
					'concepts': resConcepts
				});
			}
			]);

		},
		/*
		 * param: concept_id
		 */
		getConcept = function(req, res, next) {
			if (!req.param('concept_id') || req.param('concept_id') == '') {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the concept id.'
				});
			}

			ConceptModel.findOne({'_id': req.param('concept_id')}, function(err, concept){
				if (err || !concept) {
					console.log('Failed to get concept.');
					return res.send({
						'status_code': 400,
						'message': 'Concepts not found.',
					});
				}
				
				req.concept = {
					'id': concept._id,
					'title': utils.convertHtmlTagToSpecialChar(concept.title),
					'text': utils.convertHtmlTagToSpecialChar(concept.text),
					'image': concept.image,
					'image_source': concept.image_source,
					'image_credit': concept.image_credit,
					'image2': concept.image2,
					'image2_source': concept.image2_source,
					'image2_credit': concept.image2_credit
				};

				next();
			});
		},
		/*
		 * param: concept_id
		 */
		getDefaultVideo = function(req, res, next) {
			// if Guest user
			if (!req.session.user) {
				VideoModel.find({
					'concept': req.param('concept_id'),
					'owner': 'admin',
					'enabled' : {$ne: 'false'}
				}, {}, {sort: {'defaulted_admin':-1, 'date':1}}, function(err, videos) {
					if (err || !videos || videos.length <= 0) {
						console.log('Failed to get default video.');
					} else {
						console.log('Succeeded to get default video.');
						req.concept.video = {
							'url': videos[0].url,
							'owner_name': 'Administrator',
							'owner_image': '/images/guest.png'
						};
					}
					next();
				});

				return;
			}

			// if Logged in user
			VideoModel.findOne({
				'concept': req.param('concept_id'),
				'enabled' : {$ne: 'false'},
				'defaulted_user':req.session.user.id
			}, function(err1, video) {
				if (!err1 && video) {
					console.log('Succeeded to get default video.');
					req.concept.video = {'url': video.url};
					if (video.owner == 'admin') {
						req.concept.video.owner_name = 'Administrator';
						req.concept.video.owner_image = '/images/guest.png';
						next();
						return;
					}

					UserModel.findOne({'_id': video.owner}, function(err2, user){
						if (err2 || !user) {
							console.log('Failed to get user.');
							req.concept.video.owner_name = 'Guest';
							req.concept.video.owner_image = '/images/guest.png';
						} else {
							req.concept.video.owner_name = user.name;
							if (user.photo != '')
								req.concept.video.owner_image = user.photo;
							else
								req.concept.video.owner_image = '/images/guest.png';
						}
						next();
					});

					return;
				}

				VideoModel.find({
					'concept': req.param('concept_id'),
					'enabled' : {$ne: 'false'},
					$or:[
						{'owner': 'admin'},
						{'shared_user': req.session.user.id}
					]
				}, {}, {sort: {'defaulted_admin':-1, 'date':1}}, function(err3, videos){
					if (err3 || !videos || videos.length <= 0) {
						console.log('Failed to get default video.');
						next();
						return;
					}

					console.log('Succeeded to get default video.');
					req.concept.video = {'url': videos[0].url};
					if (videos[0].owner == 'admin') {
						req.concept.video.owner_name = 'Administrator';
						req.concept.video.owner_image = '/images/guest.png';
						next();
						return;
					}

					UserModel.findOne({'_id': videos[0].owner}, function(err4, user){
						if (err4 || !user) {
							console.log('Failed to get user.');
							req.concept.video.owner_name = 'Guest';
							req.concept.video.owner_image = '/images/guest.png';
						} else {
							req.concept.video.owner_name = user.name;
							if (user.photo != '')
								req.concept.video.owner_image = user.photo;
							else
								req.concept.video.owner_image = '/images/guest.png';
						}
						next();
					});
				});
			});
		},
		/*
		 * param: concept_id
		 */
		getDefaultReference = function(req, res, next){
			// if Guest user
			if (!req.session.user) {
				ReferenceModel.find({
					'concept': req.param('concept_id'),
					'enabled' : {$ne: 'false'},
					'owner': 'admin'
				}, {}, {sort: {'defaulted_admin':-1, 'date':1}}, function(err, references) {
					if (err || !references || references.length <= 0) {
						console.log('Failed to get default reference.');
					} else {
						console.log('Succeeded to get default reference.');
						req.concept.reference = {
							'url': references[0].url,
							'title': utils.convertHtmlTagToSpecialChar(references[0].title),
							'description': utils.convertHtmlTagToSpecialChar(references[0].description),
							'image': references[0].image
						};
					}
					next();
				});

				return;
			}

			// if Logged in user
			ReferenceModel.findOne({
				'concept': req.param('concept_id'),
				'enabled' : {$ne: 'false'},
				'defaulted_user': req.session.user.id
			}, function(err1, reference) {
				if (!err1 && reference) {
					console.log('Succeeded to get default reference.');
					req.concept.reference = {
						'url': reference.url,
						'title': utils.convertHtmlTagToSpecialChar(reference.title),
						'description': utils.convertHtmlTagToSpecialChar(reference.description),
						'image': reference.image
					};

					next();
					return;
				}

				ReferenceModel.find({
					'concept': req.param('concept_id'),
					'enabled' : {$ne: 'false'},
					$or:[
						{'owner': 'admin'},
						{'shared_user': req.session.user.id}
					]
				}, {}, {sort: {'defaulted_admin':-1, 'date':1}}, function(err3, references){
					if (err3 || !references || references.length <= 0) {
						console.log('Failed to get default reference.');
						next();
						return;
					}

					console.log('Succeeded to get default reference.');
					req.concept.reference = {
						'url': references[0].url,
						'title': utils.convertHtmlTagToSpecialChar(references[0].title),
						'description': utils.convertHtmlTagToSpecialChar(references[0].description),
						'image': references[0].image
					};

					next();
				});
			});
		},
		/*
		 * param: concept_id
		 */
		getDefaultNote = function(req, res, next) {
			// if Guest user
			if (!req.session.user) {
				next();
				return;
			}

			req.concept.notes = [];

			var cnt = 0;
			var query = {
				'concept': req.param('concept_id'),
				'shared_user': req.session.user.id
			};

			async.waterfall([
			function(cb) {
				NoteModel.find(query, {}, {sort: {'date':1, '_id':1}}, function(err, notes){
					if (err) {
						console.log('Failed to get notes.');
						next();
					} else if ( !notes || notes.length <= 0) {
						console.log('Notes not found.');
						next();
					} else {
						var len = notes.length;
						for (var i = 0; i < len; i++) {
							var note = notes[i];
							var isDefault = 'false';
							var isPrivate = 'false';
							var shared_count = note.shared_user.length;

							for(var j = 0; j < shared_count; j++) {
								if (note.shared_user[j] == note.owner) {
									shared_count--;
									break;
								}
							}

							var defLen = note.defaulted_user.length;
							for (var j = 0; j < defLen; j++) {
								if (note.defaulted_user[j] == req.session.user.id) {
									isDefault = 'true';
									break;
								}
							}

							var priLen = note.privated_user.length;
							for (var j = 0; j < priLen; j++) {
								if (note.privated_user[j] == req.session.user.id) {
									isPrivate = 'true';
									break;
								}
							}

							req.concept.notes.push({
								'id': note._id,
								'note': utils.convertHtmlTagToSpecialChar(note.note),
								'owner': note.owner,
								'isDefault': isDefault,
								'isPrivate': isPrivate,
								'shared_count': shared_count,
								'date': dateFormat(note.date, "dd mmm yyyy"),
								'owner_name': 'Guest',
								'owner_image': '/images/guest.png'
							});

							UserModel.findOne({'_id': note.owner}, function(err1, user){
								if (!err1 && user) {
									var noteLen = req.concept.notes.length;
									for (var k = 0; k < noteLen; k++) {
										var resNote = req.concept.notes[k];
										if (resNote.owner != user._id)
											continue;

										resNote.owner_name = user.name;
										if (user.photo != '')
											resNote.owner_image = user.photo;
										else
											resNote.owner_image = '/images/guest.png';
									}
								} else {
									console.log('Failed to get user.');
								}

								cnt++;
								if (cnt >= len) {
									console.log('Succeeded to get notes.');
									next();
								}
							});
						}
					}
				});
			}]);
		},
		sendConcept = function(req, res){
			res.send({
				'status_code': 200,
				'message': 'Concept was got successfully.',
				'concept': req.concept
			});
		},
		getVideos = function(req, res) {
			if (!req.param('concept_id')) {
				return res.send({
					'status_code': 200,
					'message': 'Videos not found.',
					'concept_id': req.param('concept_id'),
					'videos': []
				});
			}

			var resVideos = [];
			var query;
			if (req.session.user) {
				query = {
					'concept': req.param('concept_id'),
					'enabled' : {$ne: 'false'},
					$or:[
						{'owner': 'admin'},
						{'shared_user': req.session.user.id}
					]
				};
			} else {
				query = {
					'concept': req.param('concept_id'),
					'enabled' : {$ne: 'false'},
					'owner': 'admin'
				};
			}

			VideoModel.find(query, {}, {sort: {'date':1, '_id':1}}, function(err, videos){
				if (err) {
					console.log('Failed to get videos.');
					return res.send({
						'status_code': 200,
						'message': 'Videos not found.',
						'concept_id': req.param('concept_id'),
						'videos': []
					});
				} else if ( !videos || videos.length <= 0) {
					console.log('Videos not found.');
					return res.send({
						'status_code': 200,
						'message': 'Videos not found.',
						'concept_id': req.param('concept_id'),
						'videos': []
					});
				} else {
					var admin_default_index = -1;
					var existUserDefault = 'false';
					var len = videos.length;
					for (var i = 0; i < len; i++) {
						var video = videos[i];
						var isDefault = 'false';
						var isPrivate = 'false';
						var shared_count = video.shared_user.length;

						for(var j = 0; j < shared_count; j++) {
							if (video.shared_user[j] == video.owner) {
								shared_count--;
								break;
							}
						}

						if (req.session.user) {
							var defLen = video.defaulted_user.length;
							for (var j = 0; j < defLen; j++) {
								if (video.defaulted_user[j] == req.session.user.id) {
									isDefault = 'true';
									existUserDefault = 'true';
									break;
								}
							}

							var priLen = video.privated_user.length;
							for (var j = 0; j < priLen; j++) {
								if (video.privated_user[j] == req.session.user.id) {
									isPrivate = 'true';
									break;
								}
							}
						}

						if (video.defaulted_admin == 'true')
							admin_default_index = i;

						resVideos.push({
							'id': video._id,
							'url': video.url,
							'owner': video.owner,
							'isDefault': isDefault,
							'isPrivate': isPrivate,
							'shared_count': shared_count,
							'date': video.date
						});
					}

					if (existUserDefault == 'false' && admin_default_index >= 0)
						resVideos[admin_default_index].isDefault = 'true';

					console.log('Succeeded to get videos.');
					res.send({
						'status_code': 200,
						'message': 'Videos were got successfully.',
						'concept_id': req.param('concept_id'),
						'videos': resVideos
					});
				}
			});
		},
		getReferences = function(req, res) {
			if (!req.param('concept_id')) {
				return res.send({
					'status_code': 200,
					'message': 'References not found.',
					'concept_id': req.param('concept_id'),
					'references': []
				});
			}

			var resReferences = [];
			var query;
			if (req.session.user) {
				query = {
					'concept': req.param('concept_id'),
					'enabled' : {$ne: 'false'},
					$or:[
						{'owner': 'admin'},
						{'shared_user': req.session.user.id}
					]
				};
			} else {
				query = {
					'concept': req.param('concept_id'),
					'enabled' : {$ne: 'false'},
					'owner': 'admin'
				};
			}

			ReferenceModel.find(query, {}, {sort: {'date':1, '_id':1}}, function(err, references){
				if (err) {
					console.log('Failed to get references.');
					return res.send({
						'status_code': 200,
						'message': 'References not found.',
						'concept_id': req.param('concept_id'),
						'references': []
					});
				} else if ( !references || references.length <= 0) {
					console.log('References not found.');
					return res.send({
						'status_code': 200,
						'message': 'References not found.',
						'concept_id': req.param('concept_id'),
						'references': []
					});
				} else {
					var admin_default_index = -1;
					var existUserDefault = 'false';
					var len = references.length;
					for (var i = 0; i < len; i++) {
						var reference = references[i];
						var isDefault = 'false';
						var isPrivate = 'false';
						var shared_count = reference.shared_user.length;

						for(var j = 0; j < shared_count; j++) {
							if (reference.shared_user[j] == reference.owner) {
								shared_count--;
								break;
							}
						}

						if (req.session.user) {
							var defLen = reference.defaulted_user.length;
							for (var j = 0; j < defLen; j++) {
								if (reference.defaulted_user[j] == req.session.user.id) {
									isDefault = 'true';
									existUserDefault = 'true';
									break;
								}
							}

							var priLen = reference.privated_user.length;
							for (var j = 0; j < priLen; j++) {
								if (reference.privated_user[j] == req.session.user.id) {
									isPrivate = 'true';
									break;
								}
							}
						}

						if (reference.defaulted_admin == 'true')
							admin_default_index = i;

						resReferences.push({
							'id': reference._id,
							'url': reference.url,
							'title': utils.convertHtmlTagToSpecialChar(reference.title),
							'description': utils.convertHtmlTagToSpecialChar(reference.description),
							'image': reference.image,
							'owner': reference.owner,
							'isDefault': isDefault,
							'isPrivate': isPrivate,
							'shared_count': shared_count,
							'date': reference.date
						});
					}

					if (existUserDefault == 'false' && admin_default_index >= 0)
						resReferences[admin_default_index].isDefault = 'true';

					console.log('Succeeded to get references.');
					res.send({
						'status_code': 200,
						'message': 'References were got successfully.',
						'concept_id': req.param('concept_id'),
						'references': resReferences
					});
				}
			});
		},
		getNotes = function(req, res) {
			
			if (!req.param('concept_id') || !req.session.user) {
				return res.send({
					'status_code': 200,
					'message': 'Notes not found.',
					'concept_id': req.param('concept_id'),
					'notes': []
				});
			}

			var cnt = 0;
			var resNotes = [];
			var query = {
				'concept': req.param('concept_id'),
				'shared_user': req.session.user.id
			};

			NoteModel.find(query, {}, {sort: {'date':1, '_id':1}}, function(err, notes){
				if (err) {
					console.log('Failed to get notes.');
					return res.send({
						'status_code': 200,
						'message': 'Notes not found.',
						'concept_id': req.param('concept_id'),
						'notes': []
					});
				} else if ( !notes || notes.length <= 0) {
					console.log('Notes not found.');
					return res.send({
						'status_code': 200,
						'message': 'Notes not found.',
						'concept_id': req.param('concept_id'),
						'notes': []
					});
				} else {
					var len = notes.length;
					for (var i = 0; i < len; i++) {
						var note = notes[i];
						var isDefault = 'false';
						var isPrivate = 'false';
						var shared_count = note.shared_user.length;

						for(var j = 0; j < shared_count; j++) {
							if (note.shared_user[j] == note.owner) {
								shared_count--;
								break;
							}
						}

						if (req.session.user) {
							var defLen = note.defaulted_user.length;
							for (var j = 0; j < defLen; j++) {
								if (note.defaulted_user[j] == req.session.user.id) {
									isDefault = 'true';
									break;
								}
							}

							var priLen = note.privated_user.length;
							for (var j = 0; j < priLen; j++) {
								if (note.privated_user[j] == req.session.user.id) {
									isPrivate = 'true';
									break;
								}
							}
						}

						resNotes.push({
							'id': note._id,
							'note': utils.convertHtmlTagToSpecialChar(note.note),
							'owner': note.owner,
							'isDefault': isDefault,
							'isPrivate': isPrivate,
							'shared_count': shared_count,
							'date': dateFormat(note.date, "dd mmm yyyy")
						});

						UserModel.findOne({'_id': note.owner}, function(err1, user){
							var noteLen = resNotes.length;
							for (var k = 0; k < noteLen; k++) {
								var resNote = resNotes[k];

								if (err1 || !user) {
									console.log('Failed to get user.');
									resNote.owner_name = 'Guest';
									resNote.owner_photo = '/images/guest.png';
								} else if (resNote.owner != user._id) {
									continue;
								} else {
									resNote.owner_name = user.name;
									if (user.photo != '')
										resNote.owner_photo = user.photo;
									else
										resNote.owner_photo = '/images/guest.png';
								}
							}

							cnt++;
							if (cnt >= len) {
								console.log('Succeeded to get notes.');
								res.send({
									'status_code': 200,
									'message': 'Notes were got successfully.',
									'concept_id': req.param('concept_id'),
									'notes': resNotes
								});
							}
						});
					}
				}
			});
		},
		getNotes2 = function(req, res) {
			var cnt = 0;
			var resNotes = [];
			

			NoteModel.find({},{}, {sort: {'date':-1, '_id':-1}}, function(err, notes){
				if (err) {
					console.log('Failed to get notes.');
					return res.send({
						'status_code': 200,
						'message': 'Notes not found.',
						'concept_id': req.param('concept_id'),
						'notes': []
					});
				} else if ( !notes || notes.length <= 0) {
					console.log('Notes not found.');
					return res.send({
						'status_code': 200,
						'message': 'Notes not found.',
						'concept_id': req.param('concept_id'),
						'notes': []
					});
				} else {
					var len = notes.length;
					for (var i = 0; i < len; i++) {
						var note = notes[i];
						var isDefault = 'false';
						var isPrivate = 'false';
						var shared_count = note.shared_user.length;

						for(var j = 0; j < shared_count; j++) {
							if (note.shared_user[j] == note.owner) {
								shared_count--;
								break;
							}
						}

						if (req.session.user) {
							var defLen = note.defaulted_user.length;
							for (var j = 0; j < defLen; j++) {
								if (note.defaulted_user[j] == req.session.user.id) {
									isDefault = 'true';
									break;
								}
							}

							var priLen = note.privated_user.length;
							for (var j = 0; j < priLen; j++) {
								if (note.privated_user[j] == req.session.user.id) {
									isPrivate = 'true';
									break;
								}
							}
						}

						resNotes.push({
							'id': note._id,
							'concept_id': note.concept,
							'note': utils.convertHtmlTagToSpecialChar(note.note),
							'owner': note.owner,
							'isDefault': isDefault,
							'isPrivate': isPrivate,
							'shared_count': shared_count,
							'date': dateFormat(note.date, "dd mmm yyyy")
						});

						UserModel.findOne({'_id': note.owner}, function(err1, user){
							var noteLen = resNotes.length;
							for (var k = 0; k < noteLen; k++) {
								var resNote = resNotes[k];

								if (err1 || !user) {
									console.log('Failed to get user.');
									resNote.owner_name = 'Guest';
									resNote.owner_photo = '/images/guest.png';
								} else if (resNote.owner != user._id) {
									continue;
								} else {
									resNote.owner_name = user.name;
									if (user.photo != '')
										resNote.owner_photo = user.photo;
									else
										resNote.owner_photo = '/images/guest.png';
								}
							}

							cnt++;
							if (cnt >= len) {
								console.log('Succeeded to get notes.');
								res.send({
									'status_code': 200,
									'message': 'Notes were got successfully.',
									'notes': resNotes
								});
							}
						});
					}
				}
			});
		},
		setDefault = function(req, res) {
			if (!req.param('concept_id')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the concept identifier.'
				});
			}

			if (!req.param('content_type') || req.param('content_type') == '') {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the content type.'
				});
			}

			if (!req.param('content_id') || req.param('content_id') == '') {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the content identifier.'
				});
			}

			var SuperModel = null;
			var content_type = req.param('content_type');
			if (content_type == 'video')
				SuperModel = VideoModel;
			else if (content_type == 'reference')
				SuperModel = ReferenceModel;
			else if (content_type == 'note') {
				SuperModel = NoteModel;
			}

			if (SuperModel == null) {
				console.log('Failed to set default ' + content_type);
				return res.send({
					'status_code': 400,
					'message': 'Sorry. Something went wrong. Default settings were not changed. Please try again later.'
				});
			}

			async.waterfall([
			function(cb) {
				SuperModel.update({
					'concept': req.param('concept_id'),
					'defaulted_user': req.session.user.id
				}, {
					$pull:{'defaulted_user': req.session.user.id},
					'updated_date': new Date()
				}, {
					multi: true
				}, function(err, result) {
					cb(null);
				});
			},
			function(cb) {
				SuperModel.update({
					'_id': req.param('content_id')
				}, {
					$push: {'defaulted_user':req.session.user.id},
					'updated_date': new Date()
				}, {
					multi: true
				}, function(err, result){
					if (err) {
						console.log('Failed to set default ' + content_type);
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Default settings were not changed. Please try again later.'
						});
					} else {
						console.log('Succeeded to set default ' + content_type);
						res.send({
							'status_code': 200,
							'message': 'Default setting of the content was changed successfully.'
						});

						cb(null);
					}
				});
			},
			function(cb) {
				SuperModel.findOne({
					'_id': req.param('content_id')
				}, {
					'concept': 1,
					'url': 1,
					'note': 1
				}, function(err, content) {
					if (!err && content)
						cb(null, content);
				});
			},
			function(content, cb) {
				ConceptModel.findOne({'_id': content.concept}, {'title': 1, 'chapter': 1}, function(err, concept) {
					if (!err && concept)
						cb(null, content, concept);
				});
			},
			/*
			function(content, concept, cb) {
				ChapterModel.findOne({'_id': concept.chapter}, {'title': 1}, function(err, chapter) {
					if (!err && chapter)
						cb(null, content, concept, chapter);
				});
			},
			*/
			function(content, concept, cb) {
				var logSchema = {
					'user': req.session.user.id,
					'type': 'change default',
					'log': req.session.user.name + ' has changed the default ' + content_type + ' for \"' + concept.title + '\".',
					'content': content._id
				};

				LogModel.create(logSchema, function(err, log, result){});
			}]);
		},
		setPrivate = function(req, res) {
			if (!req.param('concept_id')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the concept identifier.'
				});
			}

			if (!req.param('content_type') || req.param('content_type') == '') {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the content type.'
				});
			}

			if (!req.param('content_id') || req.param('content_id') == '') {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the content identifier.'
				});
			}

			if (!req.param('isPrivate') || req.param('isPrivate') == '') {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the privacy setting.'
				});
			}

			var SuperModel = null;
			var content_type = req.param('content_type');
			if (content_type == 'video')
				SuperModel = VideoModel;
			else if (content_type == 'reference')
				SuperModel = ReferenceModel;
			else if (content_type == 'note') {
				SuperModel = NoteModel;
			}

			if (SuperModel == null) {
				console.log('Failed to set privacy ' + content_type);
				return res.send({
					'status_code': 400,
					'message': 'Sorry. Something went wrong. Privacy settings were not changed. Please try again later.'
				});
			}

			var update;
			if (req.param('isPrivate') == 'true')
				update = {$push: {'privated_user': req.session.user.id}, 'updated_date': new Date()};
			else
				update = {$pull: {'privated_user': req.session.user.id}, 'updated_date': new Date()};

			async.waterfall([
			function(cb) {
				SuperModel.update({
					'_id': req.param('content_id'),
				}, update , {multi: true}, function(err, content) {
					if (err || !content) {
						console.log('Failed to set privacy ' + content_type);
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Privacy settings were not changed. Please try again later.'
						});
					} else {
						console.log('Succeeded to set privacy ' + content_type);
						res.send({
							'status_code': 200,
							'message': 'Privacy setting of the content was changed successfully.'
						});

						cb(null);
					}
				});
			},
			function(cb) {
				SuperModel.findOne({
					'_id': req.param('content_id')
				}, {
					'concept': 1,
					'url': 1,
					'note': 1
				}, function(err, content) {
					if (!err && content)
						cb(null, content);
				});
			},
			function(content, cb) {
				ConceptModel.findOne({'_id': content.concept}, {'title': 1, 'chapter': 1}, function(err, concept) {
					if (!err && concept)
						cb(null, content, concept);
				});
			},
			function(content, concept, cb) {
				ChapterModel.findOne({'_id': concept.chapter}, {'title': 1}, function(err, chapter) {
					if (!err && chapter)
						cb(null, content, concept, chapter);
				});
			},
			function(content, concept, chapter, cb) {
				var privacy = 'public';
				if (req.param('isPrivate') == 'true')
					privacy = 'private';

				var logSchema = {
					'user': req.session.user.id,
					'type': 'change privacy',
					'log': req.session.user.name + ' has set the ' + content_type + ' to ' + privacy + ' for \"' + concept.title + '\" in \"' + chapter.title + '\".',
					'content': content._id
				};

				LogModel.create(logSchema, function(err, log, result){});
			}]);
		},
		addNote = function(req, res) {
			if (!req.param('concept_id')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the concept identifier.'
				});
			}

			if (!req.param('note') || req.param('note') == '') {
				return res.send({
					'status_code': 400,
					'message': 'Please enter your note.'
				});
			}

			if (!req.param('isPrivate') || req.param('isPrivate') == '') {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the privacy setting.'
				});
			}

			var schema = {
				'note': req.param('note'),
				'owner': req.session.user.id,
				'concept': req.param('concept_id'),
				'shared_user': [req.session.user.id]
			};

			if (req.param('isPrivate') == 'true') {
				schema.privated_user = [req.session.user.id];
			}

			async.waterfall([
			function(cb) {
				ConceptModel.findOne({'_id': req.param('concept_id')}, function(err, concept) {
					if (err || !concept) {
						console.log('Failed to get concept.');
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. The note was not added. Please try again later.'
						});
					}
					
					schema.grade = concept.grade;
					schema.chapter = concept.chapter;
					cb(null);
				});
			},
			function(cb) {
				NoteModel.create(schema, function(error, note, result) {
					if (error || !note) {
						console.log('Failed to add note.');
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. The notes were not added. Please try again later.'
						});
					} else {
						cb(null, note);
					}
				});
			},
			function(note, cb) {
				UserModel.findOne({'_id': req.session.user.id}, function(err, user) {
					if (err | !user) {
						console.log('Succeeded to add note.');
						return res.send({
							'status_code': 200,
							'message': 'Note was added successfully.'
						});
					} else {
						cb(null, note, user);
					}
				});
			},
			function(note, user, cb) {
				ConceptModel.findOne({'_id': schema.concept}, function(err, concept) {
					if (err || !concept) {
						console.log('Succeeded to add note.');
						return res.send({
							'status_code': 200,
							'message': 'Note was added successfully.'
						});
					} else {
						cb(null, note, user, concept);
					}
				});
			},
			function(note, user, concept, cb) {
				ChapterModel.findOne({'_id':req.session.concept.chapter}, function(err, chapter) {
					if (err || !chapter) {
						console.log('Succeeded to add note.');
						return res.send({
							'status_code': 200,
							'message': 'Note was added successfully.'
						});
					} else {
						cb(null, note, user, concept, chapter);
					}
				});
			},
			function(note, user, concept, chapter, cb) {
				var privacy = 'public';
				if (req.param('isPrivate') == 'true')
					privacy = 'private';

				var logSchema = {
					'user': req.session.user.id,
					'type': 'add note',
					'log': req.session.user.name + ' has added a new ' + privacy + ' Note for \"' + concept.title + '\" in \"' + chapter.title + '\".',
					'content': note._id
				};

				LogModel.create(logSchema, function(err, log, result){});
				cb(null, note, user, concept, chapter);
			},
			function(note, user, concept, chapter, cb) {
				if (req.param('isPrivate') == 'true') {
					console.log('Succeeded to add note.');
					return res.send({
						'status_code': 200,
						'message': 'Note was added successfully.'
					});
				} else {
					cb(null, note, user, concept, chapter);
				}
			},
			function(note, user, concept, chapter, cb) {
				var text = user.name + ' has added a new Note for ';
				text += '"' + concept.title + '" in "' + chapter.title + '".';

				UpdateModel.create({
					'type': 'added note',
					'content': schema.note,
					'content_id': note._id,
					'text': text,
					'owner': user._id,
					'allowed_users': user.update_on_users,
					'unread_users': user.update_on_users,
				}, function(err, update, result) {
					console.log('Succeeded to add note.');
					res.send({
						'status_code': 200,
						'message': 'Note was added successfully.'
					});

					sendNotification(user.update_on_users, update.text);
				});
			}]);
		},
		addReference = function(req, res) {
			if (!req.param('concept_id')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the concept identifier.'
				});
			}

			if (!req.param('reference') || req.param('reference') == '') {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the URL of the reference website.'
				});
			}

			if (!req.param('isPrivate') || req.param('isPrivate') == '') {
				return res.send({
					'status_code': 400,
					'message': 'Please enter privacy setting.'
				});
			}

			var url = req.param('reference');
			if (url.indexOf('//') === 0)
				url = 'http:' + url;
			else if (url.indexOf('http://') != 0 &&
					 url.indexOf('https://') != 0)
				url = 'http://' + url;
				
			var schema = {
				'url': url,
				'title': req.newRef.title,
				'description': req.newRef.description,
				'image': req.newRef.image,
				'owner': req.session.user.id,
				'concept': req.param('concept_id'),
				'shared_user': [req.session.user.id]
			};

			if (req.param('isPrivate') == 'true') {
				schema.privated_user = [req.session.user.id];
			}

			async.waterfall([
			function(cb) {
				ConceptModel.findOne({'_id': req.param('concept_id')}, function(err, concept) {
					if (err || !concept) {
						console.log('Failed to get concept.');
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. The reference was not added. Please try again later.'
						});
					}

					cb(null);
				});
			},
			function(cb) {
				ReferenceModel.create(schema, function(error, reference, result) {
					if (error || !reference) {
						console.log('Failed to add reference.');
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. The reference was not added. Please try again later.'
						});
					} else {
						cb(null, reference);
					}
				});
			},
			function(reference, cb) {
				UserModel.findOne({'_id': req.session.user.id}, function(err, user) {
					if (err | !user) {
						console.log('Succeeded to add reference.');
						return res.send({
							'status_code': 200,
							'message': 'Reference was added successfully.'
						});
					} else {
						cb(null, reference, user);
					}
				});
			},
			function(reference, user, cb) {
				ConceptModel.findOne({'_id': schema.concept}, function(err, concept) {
					if (err || !concept) {
						console.log('Succeeded to add reference.');
						return res.send({
							'status_code': 200,
							'message': 'Reference was added successfully.'
						});
					} else {
						cb(null, reference, user, concept);
					}
				});
			},
			function(reference, user, concept, cb) {
				ChapterModel.findOne({'_id':req.session.concept.chapter}, function(err, chapter) {
					if (err || !chapter) {
						console.log('Succeeded to add reference.');
						return res.send({
							'status_code': 200,
							'message': 'Reference was added successfully.'
						});
					} else {
						cb(null, reference, user, concept, chapter);
					}
				});
			},
			function(reference, user, concept, chapter, cb) {
				var privacy = 'public';
				if (req.param('isPrivate') == 'true')
					privacy = 'private';

				var logSchema = {
					'user': req.session.user.id,
					'type': 'add reference',
					'log': req.session.user.name + ' has added a new ' + privacy + ' Reference for \"' + concept.title + '\" in \"' + chapter.title + '\".',
					'content': reference._id
				};

				LogModel.create(logSchema, function(err, log, result){});
				cb(null, reference, user, concept, chapter);
			},
			function(reference, user, concept, chapter, cb) {
				if (req.param('isPrivate') == 'true') {
					console.log('Succeeded to add reference.');
					return res.send({
						'status_code': 200,
						'message': 'Reference was added successfully.'
					});
				} else {
					cb(null, reference, user, concept, chapter);
				}
			},
			function(reference, user, concept, chapter, cb) {
				var text = user.name + ' has added a new Reference for ';
				text += '"' + concept.title + '" in "' + chapter.title + '".';

				UpdateModel.create({
					'type': 'added reference',
					'content': schema.url,
					'content_id': reference._id,
					'text': text,
					'owner': user._id,
					'allowed_users': user.update_on_users,
					'unread_users': user.update_on_users,
				}, function(err, update, result) {
					console.log('Succeeded to add reference.');
					res.send({
						'status_code': 200,
						'message': 'Reference was added successfully.'
					});

					sendNotification(user.update_on_users, update.text);
				});
			}])
		},
		addVideo = function(req, res) {
			if (!req.param('concept_id')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the concept identifier.'
				});
			}

			if (!req.param('url') || req.param('url') == '') {
				return res.send({
					'status_code': 400,
					'message': 'Please enter a valid Youtube URL.'
				});
			}

			var url = getYoutubeEmbedUrl(req.param('url'));
			if (url == '') {
				return res.send({
					'status_code': 400,
					'message': 'Please enter a valid Youtube URL.'
				});
			}

			if (!req.param('isPrivate') || req.param('isPrivate') == '') {
				return res.send({
					'status_code': 400,
					'message': 'Please enter privacy setting.'
				});
			}

			var schema = {
				'url': url,
				'owner': req.session.user.id,
				'concept': req.param('concept_id'),
				'shared_user': [req.session.user.id]
			};

			if (req.param('isPrivate') == 'true') {
				schema.privated_user = [req.session.user.id];
			}

			logger.trace();

			async.waterfall([
			function(cb) {
				ConceptModel.findOne({'_id': req.param('concept_id')}, function(err, concept) {
					if (err || !concept) {
						console.log('Failed to get concept.');
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. The video was not added. Please try again later.'
						});
					}

					cb(null);
				});
			},
			function(cb) {
				VideoModel.find({
					'concept': schema.concept,
					'url': schema.url,
					'shared_user': req.session.user.id,
				}, {}, {},
				function(err, videos){
					if (err || !videos || videos.length <= 0) {
						cb(null);
					} else {
						console.log('Failed to add video. Already exists.');
						return res.send({
							'status_code': 200,
							'id': videos[0]._id,
							'message': 'Video was added successfully.'
						});
					}
				});
			},
			function(cb) {
				VideoModel.create(schema, function(error, video, result) {
					if (error || !video) {
						console.log('Failed to add video.');
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. The video was not added. Please try again later.'
						});
					} else {
						cb(null, video);
					}
				});
			},
			function(video, cb) {
				UserModel.findOne({'_id': req.session.user.id}, function(err, user) {
					if (err | !user) {
						console.log('Succeeded to add video.');
						return res.send({
							'status_code': 200,
							'id': video._id,
							'message': 'Video was added successfully.'
						});
					} else {
						cb(null, video, user);
					}
				});
			},
			function(video, user, cb) {
				ConceptModel.findOne({'_id': schema.concept}, function(err, concept) {
					if (err || !concept) {
						console.log('Succeeded to add video.');
						return res.send({
							'status_code': 200,
							'id': video._id,
							'message': 'Video was added successfully.'
						});
					} else {
						cb(null, video, user, concept);
					}
				});
			},
			function(video, user, concept, cb) {
				ChapterModel.findOne({'_id': req.session.concept.chapter}, function(err, chapter) {
					if (err || !chapter) {
						console.log('Succeeded to add video.');
						return res.send({
							'status_code': 200,
							'id': video._id,
							'message': 'Video was added successfully.'
						});
					} else {
						cb(null, video, user, concept, chapter);
					}
				});
			},
			function(video, user, concept, chapter, cb) {
				var privacy = 'public';
				if (req.param('isPrivate') == 'true')
					privacy = 'private';

				var logSchema = {
					'user': req.session.user.id,
					'type': 'add video',
					'log': req.session.user.name + ' has added a new ' + privacy + ' Video for \"' + concept.title + '\" in \"' + chapter.title + '\".',
					'content': video._id
				};

				LogModel.create(logSchema, function(err, log, result){});
				cb(null, video, user, concept, chapter);
			},
			function(video, user, concept, chapter, cb) {
				if (req.param('isPrivate') == 'true') {
					console.log('Succeeded to add video.');
					return res.send({
						'status_code': 200,
						'id': video._id,
						'message': 'Video was added successfully.'
					});
				} else {
					cb(null, video, user, concept, chapter);
				}
			},
			function(video, user, concept, chapter, cb) {
				var text = user.name + ' has added a new Video for ';
				text += '"' + concept.title + '" in "' + chapter.title + '".';

				UpdateModel.create({
					'type': 'added video',
					'content': schema.url,
					'content_id': video._id,
					'text': text,
					'owner': user._id,
					'allowed_users': user.update_on_users,
					'unread_users': user.update_on_users,
				}, function(err, update, result) {
					console.log('Succeeded to add video.');
					res.send({
						'status_code': 200,
						'id': video._id,
						'message': 'Video was added successfully.'
					});

					sendNotification(user.update_on_users, update.text);
				});
			}]);
		},
		getDataFromRefUrl = function(req, res, next){
			if (!req.param('reference') || req.param('reference') == '') {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the URL of the reference website.'
				});
			}

			req.newRef = {
				'title': '',
				'description': '',
				'image': ''
			};

			var url = req.param('reference');
			var start, end;
			var domain;

			if (url.indexOf('//') === 0)
				url = 'http:' + url;
			else if (url.indexOf('http://') != 0 &&
					 url.indexOf('https://') != 0)
				url = 'http://' + url;

			start = url.indexOf('//') + 2;
			end = url.indexOf('/', start);
			if (end == -1)
				domain = url.substring(start);
			else
				domain = url.substring(start, end);

			if (domain == '' || domain.indexOf('/') === 0) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the valid URL of the reference website.'
				});
			}

			var title_flag = 'false';
			var shortcut_icon = '';
			var fluid_icon = '';

			var charset = 'utf8';
			var htmlparser = require('htmlparser2');
			var parser = new htmlparser.Parser({
    			onopentag: function(name, attribs){
					name = name.toLowerCase();
        			if(name === 'title')
						title_flag = 'true';
					else if (name === 'meta' && attribs.name && attribs.name.toLowerCase() === 'description') {
						if (charset.indexOf('Shift_JIS') != 0 && attribs.content)
							req.newRef.description = utils.trim(attribs.content);
					} else if (name === 'meta' && 
							   attribs.itemprop && 
							   attribs.itemprop.toLowerCase() === 'image' && 
							   shortcut_icon === '')
					{
						if (attribs.content)
							shortcut_icon = attribs.content;
					} else if (name === 'link' && attribs.rel && attribs.href) {
						if (attribs.rel.toLowerCase() === 'icon' && shortcut_icon === '')
							shortcut_icon = attribs.href;
						else if (attribs.rel.toLowerCase() === 'shortcut icon')
							shortcut_icon = attribs.href;
						else if (attribs.rel.toLowerCase() === 'fluid-icon')
							fluid_icon = attribs.href;
					}
				},
				ontext: function(text){
					if (title_flag == 'true') {
						req.newRef.title = utils.trim(text);
						title_flag = 'false';
					}
				},
				onclosetag: function(name){
					if(name === 'title'){
						title_flag = 'false';
					}
				}
			});

			request({
				uri: url,
				method: "GET",
				timeout: 10000
			}, function(err, response, body){
				if (!err) {
					var contentType = response.headers['content-type'];
					charset = contentType.substring(contentType.indexOf('charset=') + 8);

					parser.write(body);
					parser.end();
					
					if (fluid_icon != '')
						req.newRef.image = fluid_icon;
					else
						req.newRef.image = shortcut_icon;

					if (req.newRef.image == '')
						req.newRef.image = '/images/reference.png';
					else if (req.newRef.image.indexOf('//') == 0)
						req.newRef.image = 'http:' + req.newRef.image;
					else if (req.newRef.image.indexOf('http') != 0) {
						if (url.indexOf('https://') === 0)
							req.newRef.image = 'https://' + domain + req.newRef.image;
						else
							req.newRef.image = 'http://' + domain + req.newRef.image;
					}
				}

				next();
			});
		},
		getYoutubeEmbedUrl = function(url) {
			var start, id, end, cnt;

			if (url.indexOf('http') != 0)
				url = 'https://' + url;

			start = url.indexOf('http://www.youtube.com/watch?v=');
			cnt = 31;

			if (start == -1) {
				start = url.indexOf('https://www.youtube.com/watch?v=');
				cnt = 32;
			}

			if (start == -1) {
				start = url.indexOf('http://www.youtube.com/embed/');
				cnt = 29;
			}

			if (start == -1) {
				start = url.indexOf('https://www.youtube.com/embed/');
				cnt = 30
			}

			if (start == -1) {
				start = url.indexOf('http://youtu.be/');
				cnt = 16;
			}

			if (start == -1) {
				start = url.indexOf('https://youtu.be/');
				cnt = 17;
			}

			if (start == -1)
				return '';

			id = url.substring(start + cnt);
			end = id.indexOf('/');

			if (end == -1)
				end = id.indexOf('?');

			if (end == -1)
				end = id.indexOf('#');

			if (end == -1)
				return id;
			else
				return id.substring(0, end);
		},
		/*
		 * param: concept_id
		 */
		selectConcept = function(req, res){
			if (req.param('concept_id')) {
				req.session.lesson.concept = req.param('concept_id');
				if (req.session.user) {
					UserModel.update({'_id': req.session.user.id}, 
						{'last_showed_concept': req.session.lesson.concept}, 
						function(err, user) {
							if (err)
								console.log('Failed to remember last read concept.');
							else
								console.log('Successed to remember last read concept.');
						}
					);
				}
			}

			return res.send({
				'status_code': 200,
				'message': 'Last read concept was remembered successfully.'
			});
		},
		/*
		 * param: type
		 */
		changeContentType = function(req, res) {
			if (req.param('type'))
				req.session.lesson.contents = req.param('type');

			return res.send({
				'status_code': 200,
				'message': 'Content type was changed successfully.'
			});
		},
		/*
		 * param: content_type
		 *        content_id
		 */
		deleteContent = function(req, res) {
			if (!req.param('content_type')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the content type.'
				});
			}

			if (!req.param('content_id') || req.param('content_id') == '') {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the content identifier.'
				});
			}

			var SuperModel = null;
			var content_id = req.param('content_id');
			var content_type = req.param('content_type');
			if (content_type == 'video')
				SuperModel = VideoModel;
			else if (content_type == 'reference')
				SuperModel = ReferenceModel;
			else if (content_type == 'note') {
				SuperModel = NoteModel;
			}

			if (SuperModel == null) {
				console.log('Failed to delete ' + content_type);
				return res.send({
					'status_code': 400,
					'message': 'Sorry. Something went wrong. The ' + content_type + ' was not deleted. Please try again later.'
				});
			}

			async.waterfall([
			function(cb) {
				SuperModel.update({
					'_id': req.param('content_id')
				}, {
					$pull: {'shared_user': req.session.user.id},
					'updated_date': new Date()
				}, {
					multi: true
				}, function(err, result) {
					if (err) {
						console.log('Failed to delete ' + content_type);
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. The ' + content_type + ' was not deleted. Please try again later.'
						});
					}

					cb(null);
				});
			},
			function(cb){
				SuperModel.findOne({'_id': req.param('content_id')}, function(err, content) {
					if (err || !content) {
						console.log('Failed to delete ' + content_type);
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. The ' + content_type + ' was not deleted. Please try again later.'
						});
					}

					cb(null, content);
				});
			},
			function(content, cb) {
				SuperModel.remove({'_id':content._id}, function(err, result) {
					if (err) {
						console.log('Failed to delete ' + content_type);
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. The ' + content_type + ' was not deleted. Please try again later.'
						});
					}

					console.log('Succeeded to delete ' + content_type);
					res.send({
						'status_code': 200,
						'message': 'The ' + content_type + ' was deleted successfully.'
					});
					
					cb(null, content.concept);
				});
			},
			/*
			function(content, cb) {
				if (content.shared_user.length > 0) {
					console.log('Succeeded to delete ' + content_type);
					res.send({
						'status_code': 200,
						'message': 'The ' + content_type + ' was deleted successfully.'
					});
				} else {
					SuperModel.update({'_id': req.param('content_id')}, {'deleted': true}, function(err, result) {
						console.log('Succeeded to delete ' + content_type);
						res.send({
							'status_code': 200,
							'message': 'The ' + content_type + ' was deleted successfully.'
						});
					});
				}

				cb(null, content);
			},*/
			function(concept_id, cb) {
				ConceptModel.findOne({'_id': concept_id}, {'title': 1, 'chapter': 1}, function(err, concept) {
					if (err || !concept) {
						console.log('Failed to find the concept for content.');
					} else {
						cb(null, concept);
					}
				});
			},
			/*
			function(content, concept, cb) {
				ChapterModel.findOne({'_id':concept.chapter}, {'title': 1}, function(err, chapter) {
					if (err || !chapter) {
						console.log('Succeeded to add video.');
						return res.send({
							'status_code': 200,
							'message': 'The ' + content_type + ' was deleted successfully.'
						});
					} else {
						cb(null, content, concept, chapter);
					}
				});
			},
			*/
			function(concept, cb) {
				var logSchema = {
					'user': req.session.user.id,
					'type': 'delete ' + content_type,
					'log': req.session.user.name + ' has deleted the ' + content_type + ' for \"' + concept.title + '\".',
					'content': content_id
				};

				LogModel.create(logSchema, function(err, log, result){});
			}]);
		},
		sendNotification = function(update_on_users, text){
			logger.trace();
			async.waterfall([
			function(cb) {
				UserModel.find({
						'_id': {$in: update_on_users},
					}, function(err, classmates) {
						if (err || !classmates || classmates.length <= 0) {
							return;
						}

						var receivers = '';
						var len = classmates.length;
						for (var i = 0; i < len; i++) {
							receivers += classmates[i].email + ', ';
						}

						logger.trace(receivers);
						var mailOptions = {
	    					from: fromMailAddress,
    						to: receivers,
    						subject: '[ScienceisFun] Updates',
    						text: text,
    						html: text
						};

						transporter.sendMail(mailOptions, function(error, info){
							if (error) {
								console.log('Failed to send notification mail.');
								console.log(error);
								console.log(info);
							} else {
								console.log('Succeeded to send notification mail.');
								console.log(info);
							}
						});

					});
			},
			/* function(cb) {
				var TokenModel = require('../models/tokens');
				TokenModel.find({'userid': {$in: update_on_users}}, function(err, tokens){
					if (err || !tokens | tokens.length <= 0)
						return;

					var registration_ids = [];
					var len = tokens.length;
					for (var i = 0; i < len; i++) {
						registration_ids.push(tokens[i].registration_id);
					}

					cb(null, registration_ids);
				});
			},
			function(registration_ids, cb) {
				var gcm = require('node-gcm-service');
				var message = new gcm.Message();
				message.setDataWithObject({'text': text});
				message.setCollapseKey('scienceisfun');
				message.setDryRun(false);
				message.setDelayWhileIdle(true);

				var sender = new gcm.Sender();
				sender.setAPIKey('AIzaSyAzPYLRYina5ozWsy1673GD0JiOVl9BDSQ');

				var len = registration_ids.length;
				for (var i = 0; i < len; i++) {
					var reg_ids = [registration_ids[i]];
					sender.sendMessage(message.toString(), reg_ids, true, function(err, data) {
						if (err) {
							console.log('Failed to send notification.');
							console.log(err);
						} else {
							console.log('Succeeded to send notification.');
							console.log(data);
						}
					});
				}
			}*/
			]);
		},
		_getConceptDefaultVideo = function(req, conceptId, callback) {

			if (!conceptId) {
				if (callback)
					callback(null);
				return;
			}

			// if Guest user
			if (!req.session.user) {
				VideoModel.find({
					'concept': conceptId,
					'owner': 'admin',
					'enabled' : {$ne: 'false'}
				}, {}, {sort: {'defaulted_admin':-1, 'date':1}}, function(err, videos) {
					if (err || !videos || videos.length <= 0) {
						console.log('Failed to get default video.');
						if (callback)
							callback(null);
						return;
					} else {
						console.log('Succeeded to get default video.');
						if (callback)
							callback(videos[0]);
						return;
					}
				});
			} else {

				// if Logged in user
				VideoModel.findOne({
					'concept': conceptId,
					'enabled' : {$ne: 'false'},
					'defaulted_user':req.session.user.id
				}, function(err1, video) {
					if (!err1 && video) {
						console.log('Succeeded to get default video.');
		
						if (callback)
							callback(video);
		
						return;
					}
		
					VideoModel.find({
						'concept': conceptId,
						'enabled' : {$ne: 'false'},
						$or:[
							{'owner': 'admin'},
							{'shared_user': req.session.user.id}
						]
					}, {}, {sort: {'defaulted_admin':-1, 'date':1}}, function(err3, videos){
						if (err3 || !videos || videos.length <= 0) {
							console.log('Failed to get default video.');
		
							if (callback)
								callback(null);
		
							return;
						}
		
						console.log('Succeeded to get default video.');
		
						if (callback)
							callback(videos[0]);
		
						return;
		
					});
				});
			}
		},
		_getConceptVideos = function(req, conceptId, callback) {
			var resVideos = [];
			var query;
			var users = [];

			async.waterfall([
			function(cb) {
				if (req.session.user) {
					var classmate_query = {
						'_id': {$ne: req.session.user.id},
						//'school_name': req.session.user.school_name,
						'grade': req.session.user.grade,
						'section': req.session.user.section,
						'activation': ''
					};

					UserModel.find(classmate_query, function(err, classmates){

						users.push(req.session.user.id);

						if (err || !classmates || classmates.length <= 0)  {

						} else {
							for (var i = 0; i < classmates.length; i++) {
								users.push(classmates[i]._id);
							}
						}

						query = {
							'concept': conceptId,
							'enabled' : {$ne: 'false'},
							$or:[
								{'owner': 'admin'},
								{'shared_user': {$in: users}}
							]
						};
					
						cb(null);
					});
				} else {
					query = {
						'concept': conceptId,
						'enabled' : {$ne: 'false'},
						'owner': 'admin'
					};

					cb(null);
				}
			},
			function(cb) {
				VideoModel.find(query, {}, {sort: {'date':1, '_id':1}}, function(err, videos){
					if (err) {
						console.log('Failed to get videos.');
						if (callback)
							callback(null);
						return;
					} else if ( !videos || videos.length <= 0) {
						console.log('Videos not found.');
						if (callback)
							callback(null);
						return;
					} else {
						console.log('Succeeded to get videos.');
						if (callback)
							callback(videos);
						return;
					}
				});
			}
			]);
		},
		_getConceptReference = function(req, conceptId, callback) {
			
			if (!conceptId) {
				if (callback)
					callback(null);
				return;
			}

			// if Guest user
			if (!req.session.user) {
				ReferenceModel.find({
					'concept': conceptId,
					'enabled' : {$ne: 'false'},
					'owner': 'admin'
				}, {}, {sort: {'defaulted_admin':-1, 'date':1}}, function(err, references) {
					if (err || !references || references.length <= 0) {
						console.log('Failed to get default reference.');
						if (callback)
							callback(null);
						return;
					} else {
						console.log('Succeeded to get default reference.');
						if (callback)
							callback(references[0]);
						return;
					}
				});

				return;
			} else {

				// if Logged in user
				ReferenceModel.findOne({
					'concept': conceptId,
					'enabled' : {$ne: 'false'},
					'defaulted_user': req.session.user.id
				}, function(err1, reference) {
					if (!err1 && reference) {
						console.log('Succeeded to get default reference.');
		
						if (callback)
							callback(reference);
		
						return;
					}
		
					ReferenceModel.find({
						'concept': conceptId,
						'enabled' : {$ne: 'false'},
						$or:[
							{'owner': 'admin'},
							{'shared_user': req.session.user.id}
						]
					}, {}, {sort: {'defaulted_admin':-1, 'date':1}}, function(err3, references){
						if (err3 || !references || references.length <= 0) {
							console.log('Failed to get default reference.');
		
							if (callback)
								callback(null);
		
							return;
						}
		
						console.log('Succeeded to get default reference.');
						
						if (callback)
							callback(references[0]);
		
						return;
					});
				});
			}
		},
		_getConceptNotes = function(req, conceptId, callback) {

			if (!conceptId) {
				if (callback)
					callback(null);
				return;
			}

			var cnt = 0;
			var resNotes = [];
			var query;
			var users = [];

			async.waterfall([
			function(cb) {
				if (req.session.user) {
					var classmate_query = {
						'_id': {$ne: req.session.user.id},
						'school_name': req.session.user.school_name,
						'grade': req.session.user.grade,
						'section': req.session.user.section,
						'activation': ''
					};

					UserModel.find(classmate_query, function(err, classmates){

						users.push(req.session.user.id);

						if (err || !classmates || classmates.length <= 0)  {

						} else {
							for (var i = 0; i < classmates.length; i++) {
								users.push(classmates[i]._id);
							}
						}

						query = {
							'concept': conceptId,
							'shared_user': {$in: users}
						};
					
						cb(null);
					});
				} else {
					if (callback)
							callback(null);
					return;
				}
			},
			function(cb) {
				NoteModel.find(query, {}, {sort: {'date':-1, '_id':1}}, function(err, notes){
					if (err || !notes || notes.length <= 0) {
						console.log('Failed to get notes or note found');
						if (callback)
							callback(null);
						return;
					} else {
						if (callback)
							callback(notes);
						return;
					}
				});
			}
			]);
		};
		// After Login Page Controller
		renderAfterLoginPage = function (req, res) {
			
			res.render('afterLogin');
			
			},
		renderGooglePage = function (req, res) {
			
			res.render('google');
			
			},
		
		
		
		// render test page
		renderTestsPage = function (req, res) {
			console.log('okokokok');

			if (!req.session.user) {
				return res.redirect('/signin');
			}

			if (req.param('syllabus') || req.param('grade') || req.param('chapter')) {
				if (req.param('syllabus'))
					req.session.lesson.syllabus = req.param('syllabus');

				if (req.param('grade'))
					req.session.lesson.grade = req.param('grade');

				if (req.param('chapter'))
					req.session.lesson.chapter = req.param('chapter');

				res.redirect('/tests');
				return;
			} else if (!req.session.lesson || req.session.lesson.grade == '') {
				res.redirect('/grades');
				return;
			}


			
			req.session.concept = {
				'syllabus': '',
				'grade': '',
				'chapter': '',
				'concept': ''
			};

			var chapterIds = [];
			var resChapters = [];
			var resClassmates = [];
			var resFriends = [];
			var gradeNames = [];
			var resScientists = [];

			var tempLst = Common.getScientists();
			for (var i = 0; i < tempLst.length; i++) {
				if (req.session.guest.name != tempLst[i].name)
					resScientists.push(tempLst[i]);
			}

			async.waterfall([
				function(cb) {
					LinkModel.find({
						'kind': 'chapter',
						'syllabus': req.session.lesson.syllabus,
						'grade': req.session.lesson.grade
					}, {}, {sort: {'order':1}}, function(err, links) {
						if (err || !links) {
							console.log('Failed to get chapters.');
							return res.redirect('/grades');
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
					GradeModel.find({}, function(err, grades){
						if (err || !grades || grades.length <= 0) {
							console.log('Failed to get grade name list.');
							return res.redirect('/grades');
						} else {
							var len = grades.length;
							for (var i = 0; i < len; i++) {
								var grade = grades[i];
								gradeNames[grade._id] = grade.grade;
							}
							cb(null);
						}
					});
				},
				function(cb) {

					Common.getSyllabus (req.session.lesson.syllabus, function(syllabus){
						
						if (syllabus)
							req.session.lesson.syllabus_name = syllabus.title;
							
						cb(null);
					});
				},
				function(cb) {

					Common.getGrade (req.session.lesson.grade, function(grade){
						
						if (grade)
							req.session.lesson.grade_name = grade.grade;
							
						cb(null);
					});
				},
				function(cb) {
					ChapterModel.find({'_id': {$in:chapterIds}/*'grade': req.session.lesson.grade*/, 'enabled' : {$ne: 'false'} },
									{}, {sort: {'order':1}}, function(err, chapters){
						if (err || !chapters || chapters.length <= 0) {
							console.log('Failed to get chapters.');
							res.render('tests', {'lesson': req.session.lesson});
						} else {
							var len = chapters.length;
			
							for (var i = 0; i < len; i++) {
								var chapter = chapters[i];
								resChapters.push({
									'id': chapter._id,
									'title': utils.convertHtmlTagToSpecialChar(chapter.title)
								});
							}
			
							if (req.session.lesson.chapter == '') {
								req.session.lesson.chapter = chapters[0]._id;
								req.session.lesson.concept = '';
							}
			
							req.session.lesson.isLesson = 'false';
			
							console.log('Succeeded to get chpaters.');
							cb(null);
						}
					});
				},
				function(cb) {
					res.render('testsold', {
							'chapters': resChapters,
							'lesson': req.session.lesson,
							
						});
				}
			]);
		}
		
		getTests = function(req, res) {
			testIds = [];
			var conceptsIds = [];
			var images = [];
			chapterId = req.param('chapterid');
			userId = req.session.user.id;
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
						'chapter': chapterId
					}, {}, {sort: {'order':1}}, function(err, links) {
						if (err || !links) {
							console.log('Failed to get chapters.');
							
						} else {
							var len = links.length;
							var rem = Math.ceil(len / 6);
							var testCounts = len - rem;

							for (var i = 0; i < rem; i++) {
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
				userId = req.param('userid'),
				pagetitle = req.param('page');
			var test_title = parseInt(pagetitle) + 1;
			var giveTestID = [];
			var perPage = 6;
			var	skip_result = perPage * req.param('page');
			
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
					}, {}).limit(perPage).skip(skip_result).exec(function(err, links) {
						if (err || !links) {
							console.log('Failed to get chapters.');							
						} else {
							var len = links.length;
							var rem = len % 6;
							var testCounts = len - rem;
							
							for (var i = 0; i < len; i++) {
								testIds.push(links[i].test);
								console.log(links[i].test);
							}
							//console.log(testIds);
							 
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
							//console.log(tests);

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
							//console.log(tests);
							testsInfo = {'status_code':200, 'test_count':testIds.length, 'testIds':testIds, "tests":tests}
						}
						res.send(testsInfo);
						
					});
				}
			]);
		},
		getGroupTestsList = function(req, res) {			
			var testIds = [];
				testIds = req.param('testids');
				
			
			async.waterfall([	
				function(callb) {
					TestModel.find({
						'_id': {$in:testIds},
					}, {}, function(err, tests) {
						var testsInfo = {};
						if (err || !tests) {
							testsInfo = {'status_code':400, 'message':"Sorry. Something went wrong."}
						} else {
							testsInfo = {'status_code':200, 'test_count':testIds.length, 'testIds':testIds, "tests":tests}
						}
						res.send(testsInfo);
						
					});
				}
			]);
		},
		saveTestScore = function (req, res) {
			//console.log(req);
			
			
		
            var schema = {
				'user': req.session.user.id,
				'chapter': req.param('chapter-id'),
				'test_title': req.param('test-title'),
				'score': req.param('score'),
				'user_answer':req.param('user-answer'),
            };
           
			
			async.waterfall([
				function(cb) {
					TestScoremodel.find({'user':schema.user,'chapter':schema.chapter,'test_title':schema.test_title}, function (err,result) {
                    	if (err) {
                        	console.log(err);
                        	/* 
							 *  MongoError Check: Errors triggered from MongoDB.
                         	 *  Error code: 11000 shows already same value is existed for unique indexed field.
                         	 */
							var message = '';
                        	
							res.send({
								'status_code': 400,
								'message': err
							});
                    	}
                    	if(result){
                    		if(result.length > 0){
                    			res.send({
									'status_code': 400,
									'message': 'Same test cannot be taken again.'
								});
                    		} else {
                    			cb(null);
                    		}
                		}
                		if(!result){
                			cb(null);
                		}
					});
				},
				function(cb) {
					TestScoremodel.create(schema, function (err, test_score, result) {
                    	if (err) {
                        	console.log(err);
                        	/* 
							 *  MongoError Check: Errors triggered from MongoDB.
                         	 *  Error code: 11000 shows already same value is existed for unique indexed field.
                         	 */
							var message = '';
                        	
							res.send({
								'status_code': 400,
								'message': err
							});
                    	} else {
							console.log('result');
							console.log(result);
						}
					});
				}
			]);	
        },
		
		
		// for review answer
		getReviewAnswerList = function(req, res) {
						
			var testIds = [];
				chapterId = req.param('chapterid'),
				userId = req.param('userid'),
				pagetitle = req.param('page'),
				//testtitle = pagetitle + 1,
				perPage = 6,
				skip_result = perPage * req.param('page');
			var test_title = parseInt(pagetitle) + 1;
			//console.log('test_title:'+test_title);
			async.waterfall([
				function(callb){
					TestScoremodel.find({'user': userId,'test_title':test_title,'chapter': chapterId,}, {},
					function(err, testdata) {
						if (err || !testdata) {
							console.log('Failed to get chapters.');
							//callb(null)
						} else {
							var len = testdata.length;
								if(len>0){
									for(var i = 0;i<testdata.length;i++){
										for(var j=0;j<testdata[i].user_answer.length;j++){
											testIds.push(testdata[i].user_answer[j].ques_id);
										}
									}
									callb(null,testIds);
								} else {
									callb(null,testIds);
								}	
							}	
						});
				},/*
				function(callb) {
					var q = LinkModel.find({
						'kind': 'test',
						'chapter': chapterId,
					}, {}).skip(skip_result).limit(perPage)
					.exec(function(err, links) {
						if (err || !links) {
							console.log('Failed to get chapters.');
							
						} else {
							var len = links.length;
							var rem = len % 6;
							var testCounts = len - rem;
							for (var i = 0; i < testCounts; i++) {
								testIds.push(links[i].test);
							}	
						}
						callb(null, testIds);
					});
				},*/
				function(testIds, callb) {
					TestModel.find({
						'_id': {$in:testIds},
					}, {}, {sort: {'order':1}}, function(err, tests) {
						var testsInfo = {};
						if (err || !tests) {
							//testsInfo = {'status_code':400, 'message':"Sorry. Something went wrong."}
						} else {
							callb(null,testIds,tests);
						}
						//res.send(testsInfo);
						
						//console.log(testsInfo);
					});
				},
				function(testIds,tests,callb){
					TestScoremodel.find({'user':userId,'test_title':test_title,'chapter':chapterId},function(err,testscore){
						if(err||!testscore){
							
							testsInfo = {'status_code':200, 'test_count':testIds.length, 'testIds':testIds, "tests":tests, "usertest_data":""}
							}	else {
								var testObj = {};
								var testArr = [];
								for(var i=0;i<testscore[0].user_answer.length;i++){
									for(var j=0;j<tests.length;j++){
										if(testscore[0].user_answer[i].ques_id == tests[j]._id){
											testObj = {'_id':tests[j]._id,'question':tests[j].question,'option1':testscore[0].user_answer[i].option1,'option2':testscore[0].user_answer[i].option2,'option3':testscore[0].user_answer[i].option3,'option4':testscore[0].user_answer[i].option4,'answer':testscore[0].user_answer[i].answer,'correct_answer':tests[j].answer};
											testArr.push(testObj);
											
										}
									}									
									
								}
								testsInfo = {'status_code':200, 'test_count':testIds.length, 'testIds':testIds, "tests":tests, "usertest_data":testArr}
								}
								res.send(testsInfo);
						});
				}
			]);
		}
		
		
		
		renderMytestsignup = function(req,res){
			res.render('testsignup');
			}
		renderMyclassPage = function (req, res) {
			
			if (req.param('syllabus') || req.param('grade') || req.param('chapter') ) {
				if (req.param('syllabus'))
					req.session.lesson.syllabus = req.param('syllabus');

				if (req.param('grade'))
					req.session.lesson.grade = req.param('grade');

				if (req.param('chapter'))
					req.session.lesson.chapter = req.param('chapter');

				res.redirect('/lessons');
				//res.redirect('/afterLogin');
				return;
			} else if (!req.session.lesson || req.session.lesson.grade == '') {
				res.redirect('/signin');
				return;
			}

			if (!req.session.user) {
				return res.redirect('/signin');
			}

			req.session.concept = {
				'syllabus': '',
				'grade': '',
				'chapter': '',
				'concept': ''
			};

			var chapterIds = [];
			var resChapters = [];
			var resClassmates = [];
			var resFriends = [];
			var gradeNames = [];
			var resScientists = [];
			var resSocialfriends = [];
			var resDiscussions = [];

			var tempLst = Common.getScientists();
			for (var i = 0; i < tempLst.length; i++) {
				if (req.session.guest.name != tempLst[i].name)
					resScientists.push(tempLst[i]);
			}
			
			
			
			
			

			async.waterfall([
			function(cb) {
				LinkModel.find({
					'kind': 'chapter',
					'syllabus': req.session.lesson.syllabus,
					'grade': req.session.lesson.grade
				}, {}, {sort: {'order':1}}, function(err, links) {
					if (err || !links) {
						console.log('Failed to get chapters.');
						return res.redirect('/grades');
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
				GradeModel.find({}, function(err, grades){
					if (err || !grades || grades.length <= 0) {
						console.log('Failed to get grade name list.');
						return res.redirect('/grades');
					} else {
						var len = grades.length;
						for (var i = 0; i < len; i++) {
							var grade = grades[i];
							gradeNames[grade._id] = grade.grade;
						}
						cb(null);
					}
				});
			},
			function(cb) {

				Common.getSyllabus (req.session.lesson.syllabus, function(syllabus){
					
					if (syllabus)
						req.session.lesson.syllabus_name = syllabus.title;
						
					cb(null);
				});
			},
			function(cb) {

				Common.getGrade (req.session.lesson.grade, function(grade){
					
					if (grade)
						req.session.lesson.grade_name = grade.grade;
						
					cb(null);
				});
			},
			function(cb) {
				ChapterModel.find({'_id': {$in:chapterIds}/*'grade': req.session.lesson.grade*/, 'enabled' : {$ne: 'false'} },
								{}, {sort: {'order':1}}, function(err, chapters){
					if (err || !chapters || chapters.length <= 0) {
						console.log('Failed to get chpaters.');
						res.render('concepts', {'lesson': req.session.lesson, 'scientists': resScientists});
					} else {
						var len = chapters.length;
		
						for (var i = 0; i < len; i++) {
							var chapter = chapters[i];
							resChapters.push({
								'id': chapter._id,
								'title': utils.convertHtmlTagToSpecialChar(chapter.title)
							});
						}
		
						if (req.session.lesson.chapter == '') {
							req.session.lesson.chapter = chapters[0]._id;
							req.session.lesson.concept = '';
						}
		
						req.session.lesson.isLesson = 'false';
		
						console.log('Succeeded to get chpaters.');
						cb(null);
					}
				});
			},
			function(cb) { // get classmates
				if (req.session.user && req.session.user.id) { // logined user
					console.log(req.session.user.school_name);
					UserModel.find({
						'_id': {$ne: req.session.user.id},
						'syllabus': req.session.user.syllabus,
						'school_name': req.session.user.school_name,
						'grade': req.session.user.grade,
						'section': req.session.user.section
					}, function(err, classmates) {

						var tmp = [];

						if (err || !classmates || classmates.length <= 0)
							resClassmates = [];
						else {
							tmp = utils.getRandomArray(classmates, 8);

							for (var i = 0; i < tmp.length; i++) {
								var item = tmp[i];
								var receive_update = 'false';
								var update_len = item.update_on_users.length;

								for (var k = 0; k < update_len; k++) {
									if (item.update_on_users[k] == req.session.user.id) {
										receive_update = 'true';
										break;
									}
								}

								resClassmates.push({
									'id': item._id,
									'name': item.name,
									'email': item.email,
									'school_name': item.school_name,
									'school_location': item.school_addr,
									'grade': gradeNames[item.grade],
									'section': item.section,
									'receive_update': receive_update,
									'photo': item.photo
								});
							}

						}

						cb(null);
					});
				}
				else { // guest user
					cb(null);
				}
			},
			function(cb) { // get friends
				if (req.session.user && req.session.user.id) {
					UserModel.find({
						$or: [
							{'school_name': {$ne: req.session.user.school_name}},
							{'grade': {$ne: req.session.user.grade}}
						],
						'friends': req.session.user.id
					}, function(err, friends) {
						var tmp = [];

						if (err || !friends || friends.length <= 0)
							resFriends = [];
						else {
							tmp = utils.getRandomArray(friends, 9);

							for (var i = 0; i < tmp.length; i++) {
								var item = tmp[i];
								var receive_update = 'false';
								var update_len = item.update_on_users.length;

								for (var k = 0; k < update_len; k++) {
									if (item.update_on_users[k] == req.session.user.id) {
										receive_update = 'true';
										break;
									}
								}

								resFriends.push({
									'id': item._id,
									'name': item.name,
									'email': item.email,
									'school_name': item.school_name,
									'school_location': item.school_addr,
									'grade': gradeNames[item.grade],
									'section': item.section,
									'receive_update': receive_update,
									'photo': item.photo
								});
							}
						}

						cb(null);
					});
				}
				else {
					cb(null);
				}
			},
			function(cb) {	
				if (typeof  req.user !== 'undefined') {
					if (req.user.provider == "facebook") {
						var fb = new fbgraph.Facebook(req.user.accessToken, 'v2.2');
						
						
						facebook.get(req.user.accessToken, '/me/friends', function(data) {
							
							var friends = JSON.parse(data);
							len = friends.data.length;
							var users_info = {};
							var abc = [];
							var id = 0;
							var arr = [];
							var resT;
							resT = friends.data;
							
							test(id);

							function test(id){
								
						        
						        if(id<resT.length){
						        	
						        	fb.graph('/' + resT[id].id + '/picture?redirect=false', function(err, me) {
										if(err) throw err;
										//photourl = {'photo':me.data.url};
										resSocialfriends.push({'name': resT[id].name,'photo':me.data.url,'type':'facebook'});
										test(++id);
									});

						        } else {
						           	 console.log('Got Facebook Friends');
						           	 cb(null);	
						           	 
						        }
						    }

							
													
						});
					}
					else {
						resSocialfriends = [];
						oauth2Client.setCredentials({
							access_token: req.user.accessToken,
							refresh_token: req.user.refreshToken
						});
						plus.people.list({ userId: 'me','collection': 'visible', auth: oauth2Client }, function(err, response) {
							var numItems = response.items.length;
							console.log("inside google fr");
							for(i=0; i < numItems; i++) {
								resSocialfriends.push({'name':response.items[i].displayName,'photo':response.items[i].image.url,'otherinfo':response.items[i]});
							}
							cb(null);	
						});
					}
				}
				else {
					cb(null);
				}
			},
					function (cb) {
						console.log(typeof cb);
						if (req.session.user) {
							DiscussionsController._getDiscussions({
								syllabus: req.session.user.syllabus,
								grade: req.session.user.grade,
								school_name: req.session.user.school_name
							}, function (err, discussions) {
								//console.log(err.message);
								resDiscussions = discussions;
								cb(null);
							});
						} else {
							cb(null);
						}

					},
			function(cb) {
				console.log("resSocialfriends google");
				console.log(resSocialfriends);
				
				if(resSocialfriends && resSocialfriends.length > 0){
					res.render('myclass', {
						'chapters': resChapters,
						'lesson': req.session.lesson,
						'classmates': resClassmates,
						'friends': resFriends,
						'resDiscussions': resDiscussions,
						'scientists': resSocialfriends
					});
				}	else {
					res.render('myclass', {
					'chapters': resChapters,
					'lesson': req.session.lesson,
					'classmates': resClassmates,
					'friends': resFriends,
					'resDiscussions': resDiscussions,
					'scientists': resScientists}
					);
				}
			}
			]);
		},
				renderDiscussionPage = function (req, res) {

					if (req.param('syllabus') || req.param('grade') || req.param('chapter') ) {
						if (req.param('syllabus'))
							req.session.lesson.syllabus = req.param('syllabus');

						if (req.param('grade'))
							req.session.lesson.grade = req.param('grade');

						if (req.param('chapter'))
							req.session.lesson.chapter = req.param('chapter');

						res.redirect('/lessons');
						//res.redirect('/afterLogin');
						return;
					} else if (!req.session.lesson || req.session.lesson.grade == '') {
						res.redirect('/grades');
						return;
					}

					req.session.concept = {
						'syllabus': '',
						'grade': '',
						'chapter': '',
						'concept': ''
					};

					var chapterIds = [];
					var resChapters = [];
					var resClassmates = [];
					var resFriends = [];
					var gradeNames = [];
					var resScientists = [];
					var resSocialfriends = [];
					var discussion = null;

					var tempLst = Common.getScientists();
					for (var i = 0; i < tempLst.length; i++) {
						if (req.session.guest.name != tempLst[i].name)
							resScientists.push(tempLst[i]);
					}






					async.waterfall([
						function(cb) {
							LinkModel.find({
								'kind': 'chapter',
								'syllabus': req.session.lesson.syllabus,
								'grade': req.session.lesson.grade
							}, {}, {sort: {'order':1}}, function(err, links) {
								if (err || !links) {
									console.log('Failed to get chapters.');
									return res.redirect('/grades');
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
							GradeModel.find({}, function(err, grades){
								if (err || !grades || grades.length <= 0) {
									console.log('Failed to get grade name list.');
									return res.redirect('/grades');
								} else {
									var len = grades.length;
									for (var i = 0; i < len; i++) {
										var grade = grades[i];
										gradeNames[grade._id] = grade.grade;
									}
									cb(null);
								}
							});
						},
						function(cb) {

							Common.getSyllabus (req.session.lesson.syllabus, function(syllabus){

								if (syllabus)
									req.session.lesson.syllabus_name = syllabus.title;

								cb(null);
							});
						},
						function(cb) {

							Common.getGrade (req.session.lesson.grade, function(grade){

								if (grade)
									req.session.lesson.grade_name = grade.grade;

								cb(null);
							});
						},
						function(cb) {
							ChapterModel.find({'_id': {$in:chapterIds}/*'grade': req.session.lesson.grade*/, 'enabled' : {$ne: 'false'} },
									{}, {sort: {'order':1}}, function(err, chapters){
										if (err || !chapters || chapters.length <= 0) {
											console.log('Failed to get chpaters.');
											res.render('concepts', {'lesson': req.session.lesson, 'scientists': resScientists});
										} else {
											var len = chapters.length;

											for (var i = 0; i < len; i++) {
												var chapter = chapters[i];
												resChapters.push({
													'id': chapter._id,
													'title': utils.convertHtmlTagToSpecialChar(chapter.title)
												});
											}

											if (req.session.lesson.chapter == '') {
												req.session.lesson.chapter = chapters[0]._id;
												req.session.lesson.concept = '';
											}

											req.session.lesson.isLesson = 'false';

											console.log('Succeeded to get chpaters.');
											cb(null);
										}
									});
						},
						function(cb) { // get classmates
							if (req.session.user && req.session.user.id) { // logined user
								UserModel.find({
									'_id': {$ne: req.session.user.id},
									'school_name': req.session.user.school_name,
									'grade': req.session.user.grade,
									'section': req.session.user.section
								}, function(err, classmates) {

									var tmp = [];

									if (err || !classmates || classmates.length <= 0)
										resClassmates = [];
									else {
										tmp = utils.getRandomArray(classmates, 8);

										for (var i = 0; i < tmp.length; i++) {
											var item = tmp[i];
											var receive_update = 'false';
											var update_len = item.update_on_users.length;

											for (var k = 0; k < update_len; k++) {
												if (item.update_on_users[k] == req.session.user.id) {
													receive_update = 'true';
													break;
												}
											}

											resClassmates.push({
												'id': item._id,
												'name': item.name,
												'email': item.email,
												'school_name': item.school_name,
												'school_location': item.school_addr,
												'grade': gradeNames[item.grade],
												'section': item.section,
												'receive_update': receive_update,
												'photo': item.photo
											});
										}

									}

									cb(null);
								});
							}
							else { // guest user
								cb(null);
							}
						},
						function(cb) { // get friends
							if (req.session.user && req.session.user.id) {
								UserModel.find({
									$or: [
										{'school_name': {$ne: req.session.user.school_name}},
										{'grade': {$ne: req.session.user.grade}}
									],
									'friends': req.session.user.id
								}, function(err, friends) {
									var tmp = [];

									if (err || !friends || friends.length <= 0)
										resFriends = [];
									else {
										tmp = utils.getRandomArray(friends, 9);

										for (var i = 0; i < tmp.length; i++) {
											var item = tmp[i];
											var receive_update = 'false';
											var update_len = item.update_on_users.length;

											for (var k = 0; k < update_len; k++) {
												if (item.update_on_users[k] == req.session.user.id) {
													receive_update = 'true';
													break;
												}
											}

											resFriends.push({
												'id': item._id,
												'name': item.name,
												'email': item.email,
												'school_name': item.school_name,
												'school_location': item.school_addr,
												'grade': gradeNames[item.grade],
												'section': item.section,
												'receive_update': receive_update,
												'photo': item.photo
											});
										}
									}

									cb(null);
								});
							}
							else {
								cb(null);
							}
						},
						function(cb) {
							if (typeof  req.user !== 'undefined') {
								if (req.user.provider == "facebook") {
									var fb = new fbgraph.Facebook(req.user.accessToken, 'v2.2');


									facebook.get(req.user.accessToken, '/me/friends', function(data) {

										var friends = JSON.parse(data);
										len = friends.data.length;
										var users_info = {};
										var abc = [];
										var id = 0;
										var arr = [];
										var resT;
										resT = friends.data;

										test(id);

										function test(id){


											if(id<resT.length){

												fb.graph('/' + resT[id].id + '/picture?redirect=false', function(err, me) {
													if(err) throw err;
													//photourl = {'photo':me.data.url};
													resSocialfriends.push({'name': resT[id].name,'photo':me.data.url,'type':'facebook'});
													test(++id);
												});

											} else {
												console.log('Got Facebook Friends');
												cb(null,resSocialfriends);

											}
										}



									});
								}
								else {
									resSocialfriends = [];
									oauth2Client.setCredentials({
										access_token: req.user.accessToken,
										refresh_token: req.user.refreshToken
									});
									plus.people.list({ userId: 'me','collection': 'visible', auth: oauth2Client }, function(err, response) {
										var numItems = response.items.length;
										console.log("inside google fr");
										for(i=0; i < numItems; i++) {
											resSocialfriends.push({'name':response.items[i].displayName,'photo':response.items[i].image.url,'otherinfo':response.items[i]});
										}
										cb(null,resSocialfriends);
									});
								}
							}
							else {
								cb(null);
							}
						},
						function (cb) {
							//console.log('discussion id '+ req.params.discussion);
							DiscussionsController._getDiscussion(req.params.discussion, function (err, discussions) {
								console.log(err);
								discussion = discussions;
								cb(null);
							});
						},
						function(cb) {
							console.log("resSocialfriends google");

							if(resSocialfriends && resSocialfriends.length > 0){
								res.render('discussion', {
									'chapters': resChapters,
									'lesson': req.session.lesson,
									'classmates': resClassmates,
									'friends': resFriends,
									'discussion': discussion,
									'scientists': resSocialfriends
								});
							}
							else {
								res.render('discussion', {
									'chapters': resChapters,
									'lesson': req.session.lesson,
									'classmates': resClassmates,
									'friends': resFriends,
									'discussion': discussion,
									'scientists': resScientists}
								);
							}
						}
					]);
				},
		getDetails = function(req,res){
			var grade = req.param('grade');
			var syllabus = req.param('syllabus');
			var userid = req.param('userid');
			
			async.waterfall([
			
			function(cb) {
				
				var syllabusName = [];
				
				SyllabusModel.find({
					'_id': syllabus				
				}, {}, function(err, syllabuses) {
					if (err || !syllabuses) {
						console.log('Failed to get syllabus.');
						
					} else {
						var len = syllabuses.length;
						for(i=0;i<len; i++) {
							syllabusName.push({"syllabus_title":syllabuses[i].title});
						}
						
						cb(null,syllabusName);
						}
						
					});
				
			},
			function(syllabusName,cb) {
				var gradeName = [];
				
				GradeModel.find({
					'_id': grade				
				}, {}, function(err, grades) {
					if (err || !grades) {
						console.log('Failed to get grade.');
						
					} else {
						for(i=0;i<grades.length; i++) {
							gradeName.push({"grade_title":grades[i].grade});
						}
						
						cb(null,syllabusName,gradeName);					
						}
						console.log(gradeName);
					});
				},
			function(syllabusName,gradeName,cb){
				//console.log(syllabuses);
				testsInfo = {'status_code':200, 'syllabusname':syllabusName, 'gradename':gradeName}
				res.send(testsInfo);
				}
				
				]);
			},
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

							percentageInfo.push({'userid':userid,'percentage':Math.floor(percentage)});
							res.send(percentageInfo);
							
							
						});
			            
			        }
			    }

			},
			
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
			        	percentileInfo.push({'userid':userid,'percentile':percentile});
			        	res.send(percentileInfo);

			        }
			    }


			
			},
		
		getConceptData = function(req,res){
				var concept = req.param('concept_id');
				LinkModel.find({'kind':'concept','concept':concept},function (err, links){
					if(err) throw err;
					for(var i = 0;i<links.length;i++){
						res.send({
							'syllabus':links[i].syllabus,
							'grade':links[i].grade,
							'chapter':links[i].chapter
							});
						}
					});
			},
			getHint = function (req, res) {
				console.log('req.session.user');
				console.log(req.session.user);
				/*
				async.waterfall([
					function(cb){
						UserModel.find({'_id':req.session.user.id},function(err,user){
							if(err) throw err;
							if(user){
								
								cb(null,user);
							}
						});
					},
					function(user,cb){*/
						LinkModel.findOne({'kind':'test','test': req.param('testID')}, function(err, link){
				
							if (err || !link) {
								console('could not find');
								} else {									

									res.locals.userid = req.session.user.id;
									res.locals.username = req.session.user.name;
									res.locals.schoolname = req.session.user.school_name;
									res.locals.gradename = req.session.user.grade;
									res.locals.syllabusname = req.session.user.syllabus;
									res.locals.userphoto = req.session.user.photo;									
									req.session.lesson.chapter = link.chapter;
									req.session.lesson.concept = link.concept;
									

									res.send({
									'syllabus':link.syllabus,
									'grade':link.grade,
									'chapter':link.chapter,
									'concept':link.concept
									});
								}
							});
				/*	}

				]);*/

			
			
    },
    getChapter = function (id, cb) {
        ChapterModel.findOne({
            _id: id
        }, function (err, chapter) {
            if (err) {
                return cb(err);
            }

            cb(null, chapter);
        });
    }
			
		
    return {
		getConceptData:getConceptData,
		renderMytestsignup:renderMytestsignup,
		renderGooglePage:renderGooglePage,
		getDetails:getDetails,
		getPercentile:getPercentile,
		getPercentage:getPercentage,
        index: index,
        renderMyclassPage: renderMyclassPage,
		renderGradesPage: renderGradesPage,
		renderLastLessonPage: renderLastLessonPage,
		renderLessonsPage: renderLessonsPage,
		renderAfterLoginPage: renderAfterLoginPage,
		renderConceptPage: renderConceptPage,
		renderSearchVideoPage: renderSearchVideoPage,
		renderContentsRepositoryPage: renderContentsRepositoryPage,
		renderTest: renderTest,
		getSchools: getSchools,
		searchSchools: searchSchools,
		getSchool: getSchool,
		autocomplete: autocomplete,
		getConcepts: getConcepts,
		getConcept: getConcept,
		getDefaultVideo: getDefaultVideo,
		getDefaultReference: getDefaultReference,
		getDefaultNote: getDefaultNote,
		sendConcept: sendConcept,
		getVideos: getVideos,
		getReferences: getReferences,
		getNotes: getNotes,
		getNotes2: getNotes2,
		setDefault: setDefault,
		setPrivate: setPrivate,
		addNote: addNote,
		addReference: addReference,
		addVideo: addVideo,
		getDataFromRefUrl: getDataFromRefUrl,
		getYoutubeEmbedUrl: getYoutubeEmbedUrl,
		selectConcept: selectConcept,
		changeContentType: changeContentType,
		deleteContent: deleteContent,
		sendNotification: sendNotification,
		renderTestsPage: renderTestsPage,
		getTests: getTests,
		getTestsList: getTestsList,
		getReviewAnswerList: getReviewAnswerList,
		getGroupTestsList: getGroupTestsList,
		saveTestScore: saveTestScore,
		renderDiscussionPage: renderDiscussionPage,
		getHint:getHint
    };
}();

module.exports = home;
