/*
 * classmates Controller
 * @Author zuogong
 */

var classmate = function () {
	var fromMailAddress = 'no-reply@scienceisfun.in';
	var nodemailer = require('nodemailer');
	var transporter = nodemailer.createTransport({
		service: 'Gmail',
		connectionTimeout: 90000,
		auth: {
			user: 'scienceisfun01@gmail.com',
			pass: 'funisscience'
		}
	});

	var UserModel = require('../models/users'),
		GradeModel = require('../models/grades'),
		ChapterModel = require('../models/chapters'),
		ConceptModel = require('../models/concepts'),
		VideoModel = require('../models/videos'),
		ReferenceModel = require('../models/references'),
		NoteModel = require('../models/notes'),
		UpdateModel = require('../models/updates'),
		LogModel = require('../models/logs'),
		async = require('async'),
		dateFormat = require('dateformat'),
		logger = require('tracer').colorConsole(),
		utils = require('../utils'),
		facebook = require('./social-friend-list');
		var fbgraph = require('fbgraphapi');
		
		
		
		
		getClassmates = function(req, res) {
			
			console.log( "testpath" + req.url);
			console.log(req);
			console.log('AccessToken:' + req.user.accessToken);
			var fb = new fbgraph.Facebook(req.user.accessToken, 'v2.2');
			/*
			fb.graph('/me/friends?fields=id,name', function(err, me) {
				console.log('inside me');
				console.log(me);
				//console.log(me.summary.total_count);
				var friends = JSON.parse(me);
				//console.log(friends);
				
				len = friends.summary.total_count;
				
				for (i = 0; i < len; i++ ) {
					console.log("ab" + friends.data[i].name);
					fb.graph('/' + friends.data[i].id + '/picture?redirect=false', function(err, me) {
						
					});
				}
				
				
			});
			*/
			function fbuser(callback) {
				facebook.get(req.user.accessToken, '/me/friends', function(data){
					console.log('inside friends');
					
					var friends = JSON.parse(data);
					len = friends.summary.total_count;
					var users_info = {};
					var abc = [];
					var t = 0;	
					for (i = 0; i < len; i++ ) {
						console.log("i" + i);
						console.log("t" + t);
						users_info.name = friends.data[t].name;
						users_info.id = friends.data[t].id;
						var t = 0
						function setC(call){
							fb.graph('/' + friends.data[t].id + '/picture?redirect=false', function(err, me) {
								
								/*
								abc.push({
									name: users_info.name,
									id :users_info.id,
									photo :me.data.url
								});
								*/
								call(me)
							callback(me)	
								
							});
						}
						
						
						abc.push({
								name: users_info.name,
								id :users_info.id,
								
							});
						t++;
				
					}
					console.log("hgfhxgh");
					console.log(abc);
					setC(function(model){
							console.log(model);				
					}); 
			
					var friends=[];
					var photos=[];
					var t=0;
					var photo="";
					for(j=0; j < abc.length; j++) {
						
						
						function setC(call){
							fb.graph('/' + friends.data[t].id + '/picture?redirect=false', function(err, me) {
								
								console.log(abc[t].id)
								friends.push({
									name: abc.name,
									id :abc.id,
									photo :me.data.url
								});
								/*
								abc.push({
									name: users_info.name,
									id :users_info.id,
									photo :me.data.url
								});
								*/
								call(friends)
							
								call(me)
							callback(me)	
								
							});
						}
						
						
						/*
						fb.graph('/' + abc[j].id + '/picture?redirect=false', function(err, me) {
							var photo = me.data.url;
							
							photos.push(photo);
							
							
							t++;
						});
						*/
						
					}
					console.log(photos);
					
				
				});
				
			}
			
			fbuser(function(model){
				console.log(model);				
			}); 
			
			
			
			async.waterfall([
			function(cb) {
				GradeModel.findOne({'_id': req.session.user.grade}, function(err, grade) {
					if (err || !grade) {
						console.log('Failed to get classmates.');
						res.send({
							'status_code': 400,
							'message': 'Classmates were not got successfully.'
						});
					} else {
						cb(null, grade);
					}
				});
			},
			function(grade, cb) {
				var query = {
					'_id': {$ne: req.session.user.id},
					'school_name': req.session.user.school_name,
					'grade': req.session.user.grade,
					'section': req.session.user.section,
					'activation': ''
				};

				UserModel.find(query, function(err, classmates){
					if (err){
						console.log('Failed to get classmates.');
						return res.send({
							'status_code': 400,
							'message': 'Classmates were not got successfully.'
						});
					} else if( !classmates || classmates.length <= 0) {
						console.log('Not found classmates.');
						return res.send({
							'status_code': 400,
							'message': 'Not found classmates.'
						});
					} else {
						var resClassmates = [];
						var len = classmates.length;
						for (var i = 0; i < len; i++) {
							var photo = classmates[i].photo;
							if (photo == '')
								photo = '/images/guest.png';
							var receive_update = 'false';
							var update_len = classmates[i].update_on_users.length;

							for (var k = 0; k < update_len; k++) {
								if (classmates[i].update_on_users[k] == req.session.user.id) {
									receive_update = 'true';
									break;
								}
							}

							resClassmates.push({
								'id': classmates[i]._id,
								'name': classmates[i].name,
								'email': classmates[i].email,
								'school_name': classmates[i].school_name,
								'school_location': classmates[i].school_addr,
								'grade': grade.grade,
								'section': classmates[i].section,
								'receive_update': receive_update,
								'photo': photo
							});
						}

						res.send({
							'status_code': 200,
							'message': 'Classmates were got successfully.',
							'school_name': req.session.user.school_name,
							'grade': grade.grade,
							'section': req.session.user.section,
							'classmates': resClassmates
						});
					}
				});
			}]);
		},
		getGrademates = function(req, res) {
			async.waterfall([
			function(cb) {
				GradeModel.findOne({'_id': req.session.user.grade}, function(err, grade) {
					if (err || !grade) {
						console.log('Failed to get grademates.');
						res.send({
							'status_code': 400,
							'message': 'Grademates were not got successfully.'
						});
					} else {
						cb(null, grade);
					}
				});
			},
			function(grade, cb) {
				var query = {
					'_id': {$ne: req.session.user.id},
					'school_name': req.session.user.school_name,
					'grade': req.session.user.grade,
					'section': {$ne: req.session.user.section},
					'activation': ''
				};

				UserModel.find(query, function(err, grademates){
					if (err){
						console.log('Failed to get grademates.');
						return res.send({
							'status_code': 400,
							'message': 'Grademates were not got successfully.'
						});
					} else if( !grademates || grademates.length <= 0) {
						console.log('Not found grademates.');
						return res.send({
							'status_code': 400,
							'message': 'Not found grademates.'
						});
					} else {
						var resGrademates = [];
						var len = grademates.length;
						for (var i = 0; i < len; i++) {
							var photo = grademates[i].photo;
							if (photo == '')
								photo = '/images/guest.png';

							resGrademates.push({
								'id': grademates[i]._id,
								'name': grademates[i].name,
								'photo': photo
							});
						}

						res.send({
							'status_code': 200,
							'message': 'Grademates were got successfully.',
							'school_name': req.session.user.school_name,
							'grade': grade.grade,
							'grademates': resGrademates
						});
					}
				});
			}]);
		},
		getFriends = function(req, res) {
			var gradeNames = [];

			async.waterfall([
			function(cb) {
				GradeModel.find({}, function(err, grades){
					if (err || !grades || grades.length <= 0) {
						console.log('Failed to get grade name list.');
						return res.send({
							'status_code': 400,
							'message': 'Friends were not got successfully.'
						});
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
				UserModel.find({
					$or: [
						{'school_name': {$ne: req.session.user.school_name}},
						{'grade': {$ne: req.session.user.grade}}
					],
					'friends': req.session.user.id
				}, function(err, friends) {
					if (err) {
						console.log('Failed to get friends.');
						res.send({
							'status_code': 400,
							'message': 'Friends were not got successfully.'
						});
					} else if (!friends || friends.length <= 0) {
						console.log('Not found friends.');
						res.send({
							'status_code': 400,
							'message': 'Not found friends'
						});
					} else {
						var resFriends = [];
						var len = friends.length;
						for (var i = 0; i < len; i++) {
							var photo = friends[i].photo;
							if (photo == '')
								photo = '/images/guest.png';
	
							var receive_update = 'false';
							var update_len = friends[i].update_on_users.length;

							for (var k = 0; k < update_len; k++) {
								if (friends[i].update_on_users[k] == req.session.user.id) {
									receive_update = 'true';
									break;
								}
							}

							resFriends.push({
								'id': friends[i]._id,
								'name': friends[i].name,
								'email': friends[i].email,
								'school_name': friends[i].school_name,
								'school_location': friends[i].school_addr,
								'grade': gradeNames[friends[i].grade],
								'section': friends[i].section,
								'receive_update': receive_update,
								'photo': photo
							});
						}
		
						console.log('Succeeded to get friends.');
						res.send({
							'status_code': 200,
							'message': 'Friends were got successfully.',
							'friends': resFriends
						});
					}
				});
			}
			]);
		},
		searchUsers = function(req, res) {
			if (!req.param('search_text') || req.param('search_text') == ''){
				return res.send({
					'status_code': 400,
					'message': 'Please enter string to search.',
					'search_text': ''
				});
			}

			var search_text = req.param('search_text');
			var regexp = new RegExp('.*' + search_text + '.*', "i");
			var gradeNames = [];

			async.waterfall([
			function(cb) {
				GradeModel.find({}, function(err, grades){
					if (err || !grades || grades.length <= 0) {
						console.log('Failed to get grade name list.');
						return res.send({
							'status_code': 400,
							'message': 'Friends were not got successfully.'
						});
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
				UserModel.find({
					$or: [
						{'name': {$regex: regexp}},
						{'email': search_text}
					],
					'_id': {$ne: req.session.user.id}
				}, function(err, users) {
					if (err) {
						console.log('Failed to search users.');
						res.send({
							'status_code': 200,
							'message': 'Not found users.',
							'search_text': search_text,
							'users': []
						});
					} else if (!users || users.length <= 0) {
						console.log('Not found users.');
						res.send({
							'status_code': 200,
							'message': 'Not found users.',
							'search_text': search_text,
							'users': []
						});
					} else {
						var resUsers = [];
						var len = users.length;
						for (var i = 0; i < len; i++) {
							var photo = users[i].photo;
							if (photo == '')
								photo = '/images/guest.png';
		
							var isFriend = 'false';
							if (users[i].school_name == req.session.user.school_name &&
								users[i].grade == req.session.user.grade)
							{
								isFriend = '';
							} else {
								var friendLen = users[i].friends.length;
								for (var j = 0; j < friendLen; j++) {
									if (users[i].friends[j] == req.session.user.id) {
										isFriend = 'true';
										break;
									}
								}
							}
		
							resUsers.push({
								'id': users[i]._id,
								'name': users[i].name,
								'email': users[i].email,
								'school_name': users[i].school_name,
								'school_location': users[i].school_addr,
								'grade': gradeNames[users[i].grade],
								'section': users[i].section,
								'photo': photo,
								'isFriend': isFriend
							});
						}
		
						console.log('Succeeded to search users.');
						res.send({
							'status_code': 200,
							'message': 'Users were searched successfully.',
							'search_text': search_text,
							'users': resUsers
						});
					}
				});
			}
			]);
		},
		renderClassmatesPage = function(req, res){
			res.render('classmates');
		},
		renderClassmatePage = function(req, res){
			if (req.param('id') || req.param('chapter')) {
				if (req.param('id')) {
					req.session.classmate = {
						'id': req.param('id'),
						'chapter': ''
					};
				}

				if (!req.session.classmate) {
					res.redirect('/classmates');
					return;
				}

				if (req.param('chapter'))
					req.session.classmate.chapter = req.param('chapter');

				res.redirect('/classmate');
				return;
			} else if (!req.session.classmate) {
				res.redirect('/classmates');
				return;
			}

			async.waterfall([
			function(cb) {
				UserModel.findOne({'_id': req.session.classmate.id}, function(err, classmate){
					if (err) {
						console.log('Failed to get classmate.');
						res.redirect('/classmates');
					} else if (!classmate) {
						console.log('Not found Classmate.');
						res.redirect('/classmates');
					} else {
						cb(null, classmate);
					}
				});
			},
			function(classmate, cb) {
				GradeModel.findOne({'_id': classmate.grade}, function(err, grade) {
					if (err || !grade) {
						console.log('Failed to get grademates.');
						res.redirect('/classmates');
					} else {
						cb(null, classmate, grade);
					}
				});
			},
			function(classmate, grade, cb) {
				ChapterModel.find({'grade': classmate.grade}, {}, {sort: {'order': 1}}, function(err, chapters){
					if (err) {
						console.log('Failed to get chpaters.');
						res.redirect('/classmates');
					} else {
						var len = chapters.length;
						var resChapters = [];

						if (chapters && chapters.length > 0) {
							for (var i = 0; i < len; i++) {
								var chapter = chapters[i];
								resChapters.push({
									'id': chapter._id,
									'title': utils.convertHtmlTagToSpecialChar(chapter.title)
								});
							}
						}

						var receive_update = 'false';
						len = classmate.update_on_users.length;
						for (var i = 0; i < len; i++) {
							if (classmate.update_on_users[i] == req.session.user.id) {
								receive_update = 'true';
								break;
							}
						}

						var resClassmate = {
							'id': classmate._id,
							'name': classmate.name,
							'email': classmate.email,
							'school_name': classmate.school_name,
							'grade': grade.grade,
							'section': classmate.section,
							'photo': classmate.photo,
							'receive_update': receive_update
						};

						if (resClassmate.photo == '')
							resClassmate.photo = '/images/guest.png';

						console.log('Succeeded to get chpaters.');
						res.render('classmate', {
							'classmate': resClassmate, 
							'chapters': resChapters,
							'selected_chapter': req.session.classmate.chapter
						});
					}
				});
			}]);
		},
		renderSearchFriendPage = function(req, res){
			res.render('search_friend');
		},
		renderClassInvitePage = function(req, res){
			res.render('class_invite');
		}
		getClassmateInfo = function(req, res){
			if (!req.param('classmate_id')) {
			logger.trace();
				return res.send({
					'status_code': 400,
					'message': 'Not found user.'
				});
			}

			classmateId = req.param('classmate_id');

			async.waterfall([
			function(cb) {
				UserModel.findOne({'_id': classmateId}, function(err, classmate){
					if (err) {
						console.log('Failed to get user.');
						return res.send({
							'status_code': 400,
							'message': 'Failed to get user.'
						});
					} else if (!classmate) {
						console.log('Not found Classmate.');
						return res.send({
							'status_code': 400,
							'message': 'Not found user.'
						});
					} else {
						cb(null, classmate);
					}
				});
			},
			function(classmate, cb) {
				GradeModel.findOne({'_id': classmate.grade}, function(err, grade) {
					if (err || !grade) {
						console.log('Failed to get grade.');
						cb(null, classmate, '--');
					} else {
						cb(null, classmate, grade.grade);
					}
				});
			},
			function(classmate, grade_name, cb) {

				var receive_update = 'false';
				len = classmate.update_on_users.length;
				for (var i = 0; i < len; i++) {
					if (classmate.update_on_users[i] == req.session.user.id) {
						receive_update = 'true';
						break;
					}
				}

				var resClassmate = {
					'id': classmate._id,
					'name': classmate.name,
					'email': classmate.email,
					'school_name': classmate.school_name,
					'grade': grade_name,
					'section': classmate.section,
					'photo': classmate.photo,
					'receive_update': receive_update
				};

				if (resClassmate.photo == '')
					resClassmate.photo = '/images/guest.png';

				res.send({
					'status_code': 200,
					'message': 'Success to get user.',
					'userinfo': resClassmate
				});
			}
			]);
		},
		getVideos = function(req, res) {
			if (!req.param('concept_id')) {
				return res.send({
					'status_code': 200,
					'message': 'Not found videos.',
					'concept_id': req.param('concept_id'),
					'videos': []
				});
			}

			if (!req.param('classmate_id')) {
				return res.send({
					'status_code': 200,
					'message': 'Not found videos.',
					'concept_id': req.param('concept_id'),
					'videos': []
				});
			}

			var resVideos = [];
			var query = {
				'concept': req.param('concept_id'),
				'enabled' : {$ne: 'false'},
				'shared_user': req.param('classmate_id'),
				'privated_user': {$ne: req.param('classmate_id')}
			};

			VideoModel.find(query, {}, {sort: {'date':1, '_id':1}}, function(err, videos){
				if (err) {
					console.log('Failed to get videos.');
					return res.send({
						'status_code': 200,
						'message': 'Videos were not got successfully.',
						'concept_id': req.param('concept_id'),
						'videos': []
					});
				} else if ( !videos || videos.length <= 0) {
					console.log('Not found videos.');
					return res.send({
						'status_code': 200,
						'message': 'Not found videos.',
						'concept_id': req.param('concept_id'),
						'videos': []
					});
				} else {
					var len = videos.length;
					for (var i = 0; i < len; i++) {
						var video = videos[i];
						var is_shared = 'false';
						var shared_count = video.shared_user.length;

						for(var j = 0; j < shared_count; j++) {
							if (video.shared_user[j] == video.owner) {
								shared_count--;
								break;
							}
						}

						if (video.owner == req.session.user.id){
							is_shared = true;
						} else {
							var sharedLen = video.shared_user.length;
							for (var j = 0; j < sharedLen; j++) {
								if (video.shared_user[j] == req.session.user.id) {
									is_shared = 'true';
									break;
								}
							}
						}

						resVideos.push({
							'id': video._id,
							'url': video.url,
							'owner': video.owner,
							'is_shared': is_shared,
							'shared_count': shared_count,
							'date': video.date
						});
					}

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
					'message': 'Not found references.',
					'concept_id': req.param('concept_id'),
					'references': []
				});
			}

			if (!req.param('classmate_id')) {
				return res.send({
					'status_code': 200,
					'message': 'Not found references.',
					'concept_id': req.param('concept_id'),
					'references': []
				});
			}

			var resReferences = [];
			var query = {
				'concept': req.param('concept_id'),
				'shared_user': req.param('classmate_id'),
				'privated_user': {$ne: req.param('classmate_id')}
			};

			ReferenceModel.find(query, {}, {sort: {'date':1, '_id':1}}, function(err, references){
				if (err) {
					console.log('Failed to get references.');
					return res.send({
						'status_code': 200,
						'message': 'Not found references.',
						'concept_id': req.param('concept_id'),
						'references': []
					});
				} else if ( !references || references.length <= 0) {
					console.log('Not found references.');
					return res.send({
						'status_code': 200,
						'message': 'Not found references.',
						'concept_id': req.param('concept_id'),
						'references': []
					});
				} else {
					var len = references.length;
					for (var i = 0; i < len; i++) {
						var reference = references[i];
						var is_shared = 'false';
						var shared_count = reference.shared_user.length;

						for(var j = 0; j < shared_count; j++) {
							if (reference.shared_user[j] == reference.owner) {
								shared_count--;
								break;
							}
						}

						if (reference.owner == req.session.user.id) {
						} else {
							var sharedLen = reference.shared_user.length;
							for (var j = 0; j < sharedLen; j++) {
								if (reference.shared_user[j] == req.session.user.id) {
									is_shared = 'true';
									break;
								}
							}
						}

						resReferences.push({
							'id': reference._id,
							'url': reference.url,
							'title': utils.convertHtmlTagToSpecialChar(reference.title),
							'description': utils.convertHtmlTagToSpecialChar(reference.description),
							'image': reference.image,
							'owner': reference.owner,
							'is_shared': is_shared,
							'shared_count': shared_count,
							'date': reference.date
						});
					}

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
			if (!req.param('concept_id')) {
				return res.send({
					'status_code': 200,
					'message': 'Not found notes.',
					'concept_id': req.param('concept_id'),
					'notes': []
				});
			}

			if (!req.param('classmate_id')) {
				return res.send({
					'status_code': 200,
					'message': 'Not found notes.',
					'concept_id': req.param('concept_id'),
					'notes': []
				});
			}

			var cnt = 0;
			var resNotes = [];
			var query = {
				'concept': req.param('concept_id'),
				'shared_user': req.param('classmate_id'),
				'privated_user': {$ne: req.param('classmate_id')}
			};

			NoteModel.find(query, {}, {sort: {'date':1, '_id':1}}, function(err, notes){
				if (err) {
					console.log('Failed to get notes.');
					return res.send({
						'status_code': 200,
						'message': 'Not found notes.',
						'concept_id': req.param('concept_id'),
						'notes': []
					});
				} else if ( !notes || notes.length <= 0) {
					console.log('Not found notes.');
					return res.send({
						'status_code': 200,
						'message': 'Not found notes.',
						'concept_id': req.param('concept_id'),
						'notes': []
					});
				} else {
					var len = notes.length;
					for (var i = 0; i < len; i++) {
						var note = notes[i];
						var is_shared = 'false';
						var shared_count = note.shared_user.length;

						for(var j = 0; j < shared_count; j++) {
							if (note.shared_user[j] == note.owner) {
								shared_count--;
								break;
							}
						}

						if (note.owner == req.session.user.id) {
							is_shared = 'true';
						} else {
							var sharedLen = note.shared_user.length;
							for (var j = 0; j < sharedLen; j++) {
								if (note.shared_user[j] == req.session.user.id) {
									is_shared = 'true';
									break;
								}
							}
						}

						resNotes.push({
							'id': note._id,
							'note': utils.convertHtmlTagToSpecialChar(note.note),
							'owner': note.owner,
							'is_shared': is_shared,
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
		shareContent = function(req, res) {
			if (!req.param('content_type') || req.param('content_type') == '') {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the content type.',
				});
			}

			if (!req.param('content_id') || req.param('content_id') == '') {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the content identifier.',
				});
			}

			if (!req.param('user_id') || req.param('user_id') == '') {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the user identifier.',
				});
			}

			var SuperModel = null;
			var type = '';
			var content_type = req.param('content_type');
			if (content_type == 'video') {
				SuperModel = VideoModel;
				type = 'Video';
			} else if (content_type == 'reference') {
				SuperModel = ReferenceModel;
				type = 'Reference';
			} else if (content_type == 'note') {
				SuperModel = NoteModel;
				type = 'Note';
			}

			if (SuperModel == null) {
				console.log('Failed to share ' + content_type);
				return res.send({
					'status_code': 400,
					'message': 'The ' + content_type + ' was not shared successfully.'
				});
			}

			async.waterfall([
			function(cb) {
				SuperModel.update(
					{'_id': req.param('content_id')},
					{$push: {'shared_user': req.session.user.id}, 'updated_date': new Date()},
					{multi: true},
					function(err, result) {
						if (err) {
							console.log('Failed to share ' + content_type);
							return res.send({
								'status_code': 400,
								'message': 'The ' + content_type + ' was not shared successfully.'
							});
						} else {
							cb(null);
						}
					}
				);
			},
			function(cb) {
				SuperModel.findOne({'_id': req.param('content_id')}, function(err, content) {
					if (err || !content) {
						console.log('Succeeded to share ' + content_type);
						return res.send({
							'status_code': 200,
							'message': 'The ' + content_type + ' was shared successfully.'
						});
					} else {
						cb(null, content);
					}
				});
			},
			function(content, cb) {
				ConceptModel.findOne({'_id': content.concept}, function(err, concept) {
					if (err || !concept) {
						console.log('Succeeded to share ' + content_type);
						return res.send({
							'status_code': 200,
							'message': 'The ' + content_type + ' was not shared successfully.'
						})
					} else {
						cb(null, content, concept);
					}
				});
			},
			function(content, concept, cb) {
				ChapterModel.findOne({'_id':concept.chapter}, function(err, chapter) {
					if (err || !chapter) {
						console.log('Succeeded to share ' + content_type);
						return res.send({
							'status_code': 200,
							'message': 'The ' + content_type + ' was not shared successfully.'
						})
					} else {
						cb(null, content, concept, chapter);
					}
				});
			},
			function(content, concept, chapter, cb) {
				UserModel.findOne({'_id': req.param('user_id')}, function(err, user) {
					if (!err && user) {
						var logSchema = {
							'user': req.session.user.id,
							'type': 'share ' + content_type,
							'log': req.session.user.name + ' has shared the ' + content_type + ' from ' + user.name + ' for \"' + concept.title + '\" in \"' + chapter.title + '\".',
							'content': content._id
						};

						LogModel.create(logSchema, function(err, log, result){});
					}

					cb(null, content, concept, chapter);
				});
			},
			function(content, concept, chapter, cb) {
				if (content.owner != req.param('user_id')) {
					console.log('Succeeded to share ' + content_type);
					return res.send({
						'status_code': 200,
						'message': 'The ' + content_type + ' was shared successfully.'
					});
				}

				UserModel.findOne({
					'_id': req.session.user.id,
					'update_on_users': req.param('user_id')
				}, function(err, user) {
					if (err || !user) {
						console.log('Succeeded to share ' + content_type);
						return res.send({
							'status_code': 200,
							'message': 'The ' + content_type + ' was not shared successfully.'
						});
					} else {
						cb(null, user, content, concept, chapter);
					}
				});
			},
			function(user, content, concept, chapter, cb) {
				var text = user.name + ' has added your ' + type + ' for ';
				text += '"' + concept.title + '" in "' + chapter.title + '".';

				var val;
				if (content_type == 'note')
					val = content.note;
				else
					val = content.url;

				UpdateModel.create({
					'type': 'shared ' + content_type,
					'content': val,
					'content_id': req.param('content_id'),
					'text': text,
					'owner': user._id,
					'allowed_users': [req.param('user_id')],
					'unread_users': [req.param('user_id')],
				}, function(err, update, result) {
					console.log('Succeeded to share ' + content_type);
					res.send({
						'status_code': 200,
						'message': 'The ' + content_type + ' was not shared successfully.'
					});

					sendNotification([req.param('user_id')], update.text);
				});
			}]);
		},
		setUpdate = function(req, res) {
			if (!req.param('classmate_id')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the classmate identifier.',
				});
			}

			if (!req.param('receive_update')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the settings for recieving updates.',
				});
			}

			async.waterfall([
			function(cb) {
				var query, update;

				if (req.param('receive_update') == 'true') {
					query = {
						'_id': req.param('classmate_id'),
						'update_on_users': {$ne: req.session.user.id}
					};

					update = {
						$push: {'update_on_users': req.session.user.id},
						'updated_date': new Date()
					};
				} else {
					query = {
						'_id': req.param('classmate_id'),
						'update_on_users': req.session.user.id
					};

					update = {
						$pull: {'update_on_users': req.session.user.id},
						'updated_date': new Date()
					};
				}

				UserModel.update(query, update, {multi: true}, function(err, result) {
					if (err) {
						console.log('Failed to set receiving update.');
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Update setting was not changed. Please try again later.'
						});
					} else {
						console.log('Succeeded to set receiving update.');
						res.send({
							'status_code': 200,
							'message': 'Successfully changed the update setting.'
						});

						cb(null);
					}
				});
			},
			function(cb) {
				UserModel.findOne({'_id': req.param('classmate_id')}, {'name': 1}, function(err, user) {
					if (err || !user)
						return;

					var update = 'off';
					if (req.param('receive_update') == 'true')
						update = 'on';

					var logSchema = {
						'user': req.session.user.id,
						'type': 'receiving update ' + update,
						'log': req.session.user.name + ' has turned ' + update +' receiving update for ' + user.name + '.'
					};

					LogModel.create(logSchema, function(err, log, result){});
				});
			}]);
		},
		invite = function(req, res) {
			if (!req.param('mail')) {
				console.log('Failed to invite.');
				return res.send({
					'status_code': 400,
					'message': 'Please enter the email address of the person you wish to invite.'
				});
			}

			var re = /\S+@\S+\.\S+/;
			if (!re.test(req.param('mail'))) {
				console.log('Failed to invite.');
				return res.send({
					'status_code': 400,
					'message': 'Please enter a valid email address.'
				});
			}

			async.waterfall([
			function(cb) {
				UserModel.findOne({'_id': req.session.user.id}, function(err, user) {
					if (err || !user) {
						console.log('Failed to invite ' + req.param('mail') + '.');
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. The invitation was not sent. Please try again later.'
						});
					}

					var html = '<p style="margin-bottom:15px">Hi,</p>';
					html += '<p style="margin-bottom:10px">You are invited to <a href="http://' + req.get('host') + '">ScienceIsFun(' + req.get('host') + ')</a>';
					html += ' from ' + user.name + '(' + user.email + ').</p>';
					html += '<p style="margin-bottom:10px">Please visit <a href="http://' + req.get('host') + '">ScienceIsFun(' + req.get('host') + ')</a>.</p>';

					var mailOptions = {
						from: fromMailAddress,
						to: req.param('mail'),
						subject: 'Welcome',
						text: 'Welcome',
						html: html
					};

					transporter.sendMail(mailOptions, function(err, info){
						if (err) {
							console.log('Failed to send inviting email');
							res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. The invitation email was not sent. Please try again later.'
							});
						} else {
							console.log('Succeeded to invite ' + req.param('mail') + '.');
							res.send({
								'status_code': 200,
								'message': 'The invitation was sent successfully.'
							});

							cb(null);
						}
					});
				});
			},
			function(cb) {
				var logSchema = {
					'user': req.session.user.id,
					'type': 'invite',
					'log': req.session.user.name + ' has invited ' + req.param('mail') + '.'
				};

				LogModel.create(logSchema, function(err, log, result){});
			}]);
		},
		addFriend = function(req, res) {
			if (!req.param('user_id')) {
				console.log('Failed to add friend.');
				return res.send({
					'status_code': 400,
					'message': 'Please enter the identifier the person you wish to add.'
				});
			}

			async.waterfall([
			function(cb) {
				UserModel.update({
					'_id': req.param('user_id')
				}, {
					$push: {'friends': req.session.user.id},
					'updated_date': new Date()
				}, {
					multi: true
				}, function(err, result) {
					if (err) {
						console.log('Failed to add friend.');
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Your friend was not added to the list. Please try again later.'
						});
					}
					
					cb(null);
				});
			},
			function(cb) {
				UserModel.update({
					'_id': req.param('user_id')
				}, {
					$push: {'update_on_users': req.session.user.id},
					'updated_date': new Date()
				}, {
					multi: true
				}, function(err, result) {
					if (err) {
						console.log('Failed to add friend.');
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Your friend was not added to the list. Please try again later.'
						});
					}

					console.log('Succeeded to add friend.');
					res.send({
						'status_code': 200,
						'message': 'Successfully added the friend.',
						'user_id': req.param('user_id')
					});

					cb(null);
				});
			},
			function(cb) {
				UserModel.findOne({'_id': req.param('user_id')}, {'name': 1}, function(err, user) {
					if (err || !user)
						return;

					var logSchema = {
						'user': req.session.user.id,
						'type': 'add friend',
						'log': req.session.user.name + ' has added ' + user.name + ' in friend list.'
					};

					LogModel.create(logSchema, function(err, log, result){});
				});
			}]);
		},
		removeFriend = function(req, res) {
			if (!req.param('user_id')) {
				console.log('Failed to remove friend.');
				return res.send({
					'status_code': 400,
					'message': 'Please enter the identifier of the person you wish to remove.'
				});
			}

			async.waterfall([
			function(cb) {
				UserModel.update({
					'_id': req.param('user_id')
				}, {
					$pull: {'friends': req.session.user.id},
					'updated_date': new Date()
				}, {
					multi: true
				}, function(err, result) {
					if (err) {
						console.log('Failed to remove friend.');
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. The user was not removed from the list. Please try again later.'
						});
					}
					
					cb(null);
				});
			},
			function(cb) {
				UserModel.update({
					'_id': req.param('user_id')
				}, {
					$pull: {'update_on_users': req.session.user.id},
					'updated_date': new Date()
				}, {
					multi: true
				}, function(err, result) {
					if (err) {
						console.log('Failed to remove friend.');
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. The user was not removed from the list. Please try again later.'
						});
					}

					console.log('Succeeded to remove friend.');
					res.send({
						'status_code': 200,
						'message': 'Successfully removed the user from the list.',
						'user_id': req.param('user_id')
					});

					cb(null);
				});
			},
			function(cb) {
				UserModel.findOne({'_id': req.param('user_id')}, {'name': 1}, function(err, user) {
					if (err || !user)
						return;

					var logSchema = {
						'user': req.session.user.id,
						'type': 'delete friend',
						'log': req.session.user.name + ' has deleted ' + user.name + ' from friend list.'
					};

					LogModel.create(logSchema, function(err, log, result){});
				});
			}]);
		},
		sendNotification = function(update_on_users, text){
			async.waterfall([
			function(cb) {
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
			}]);
		};

	return {
		getClassmates: getClassmates,
		getGrademates: getGrademates,
		getFriends: getFriends,
		searchUsers: searchUsers,
		renderClassmatesPage: renderClassmatesPage,
		renderClassmatePage: renderClassmatePage,
		renderSearchFriendPage: renderSearchFriendPage,
		getClassmateInfo: getClassmateInfo,
		getVideos: getVideos,
		getReferences: getReferences,
		getNotes: getNotes,
		shareContent: shareContent,
		setUpdate: setUpdate,
		invite: invite,
		addFriend: addFriend,
		removeFriend: removeFriend,
		sendNotification: sendNotification,
		renderClassInvitePage: renderClassInvitePage
	};
}();

module.exports = classmate;

