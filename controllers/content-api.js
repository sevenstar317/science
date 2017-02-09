/*
 * Content Api Controller
 * @Author zuogong
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
		LinkModel = require('../models/links');
		VideoModel = require('../models/videos'),
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
		/*
		 * params: token
		 */
		checkToken = function (req, res, next){
			req.user = null;

			TokenModel.findOne({'_id': req.param('token')}, function(err, token) {
				if (!err && token){
					UserModel.findOne({ '_id': token.userid }, function (error, user) {
						if (!error && user)
							req.user = user;
						else
							req.user = {'_id':'admin'}

						next();
					});
				} else {
					req.user = {'_id':'admin'}
					next();
				}
			});
		},
		/*
		 * param: concept_id
		 *        video
		 *        isPrivate
		 */
		addVideo = function(req, res) {
			if (!req.param('concept_id')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the concept identifier.'
				});
			}

			if (!req.param('video') || req.param('video') == '') {
				return res.send({
					'status_code': 400,
					'message': 'Please enter a valid Youtube URL.'
				});
			}

			var url = getYoutubeEmbedUrl(req.param('video'));
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
				'owner': req.user._id,
				'concept': req.param('concept_id'),
				'shared_user': [req.user._id]
			};

			if (req.param('isPrivate') == 'true') {
				schema.privated_user = [req.user._id];
			}

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
				VideoModel.create(schema, function(error, video, result) {
					if (error || !video) {
						console.log('Failed to add video.');
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. The video was not added. Please try again later.'
						});
					} else {
						cb(null, video)
					}
				});
			},
			function(video, cb) {
				ConceptModel.findOne({'_id': schema.concept}, function(err, concept) {
					if (err || !concept) {
						console.log('Succeeded to add video.');
						return res.send({
							'status_code': 200,
							'message': 'Video was added successfully.',
							'video_id': video._id
						});
					} else {
						cb(null, video, concept);
					}
				});
			},
			/*function(video, concept, cb) {
				ChapterModel.findOne({'_id':concept.chapter}, function(err, chapter) {
					if (err || !chapter) {
						console.log('Succeeded to add video.');
						return res.send({
							'status_code': 200,
							'message': 'Video was added successfully.',
							'video_id': video._id
						});
					} else {
						cb(null, video, concept, chapter);
					}
				});
			},*/
			function(video, concept, cb) {
				var privacy = 'public';
				if (req.param('isPrivate') == 'true')
					privacy = 'private';

				var logSchema = {
					'user': req.user._id,
					'type': 'add video',
					'log': req.user.name + ' has added a new ' + privacy + ' Video for \"' + concept.title + '\".',
					'content': video._id
				};

				LogModel.create(logSchema, function(err, log, result){});
				cb(null, video, concept);
			},
			function(video, concept, cb) {
				if (req.param('isPrivate') == 'true') {
					console.log('Succeeded to add video.');
					return res.send({
						'status_code': 200,
						'message': 'Video was added successfully.'
					});
				} else {
					cb(null, video, concept);
				}
			},
			function(video, concept, cb) {
				var text = req.user.name + ' has added a new Video for ';
				text += '"' + concept.title + '".';

				UpdateModel.create({
					'type': 'shared video',
					'content': schema.url,
					'content_id': video._id,
					'text': text,
					'owner': req.user._id,
					'allowed_users': req.user.update_on_users,
					'unread_users': req.user.update_on_users,
				}, function(err, update, result) {
					console.log('Succeeded to add video.');
					res.send({
						'status_code': 200,
						'message': 'Video was added successfully.',
						'video_id': video._id
					});

					sendNotification(req.user.update_on_users, update.text);
				});
			}]);
		},
		/*
		 * param: concept_id
		 *        reference
		 *        isPrivate
		 */
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

			var schema = {
				'url': req.param('reference'),
				'title': req.newRef.title,
				'description': req.newRef.description,
				'image': req.newRef.image,
				'owner': req.user._id,
				'concept': req.param('concept_id'),
				'shared_user': [req.user._id]
			};

			if (req.param('isPrivate') == 'true') {
				schema.privated_user = [req.user._id];
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

					schema.grade = concept.grade;
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
				ConceptModel.findOne({'_id': schema.concept}, function(err, concept) {
					if (err || !concept) {
						console.log('Succeeded to add reference.');
						return res.send({
							'status_code': 200,
							'message': 'Reference was added successfully.',
							'reference_id': reference._id,
							'reference_title': reference.title,
							'reference_description': reference.description,
							'reference_image': reference.image
						});
					} else {
						cb(null, reference, concept);
					}
				});
			},
			/*function(reference, concept, cb) {
				ChapterModel.findOne({'_id':concept.chapter}, function(err, chapter) {
					if (err || !chapter) {
						console.log('Succeeded to add reference.');
						return res.send({
							'status_code': 200,
							'message': 'Reference was added successfully.',
							'reference_id': reference._id,
							'reference_title': reference.title,
							'reference_description': reference.description,
							'reference_image': reference.image
						});
					} else {
						cb(null, reference, concept, chapter);
					}
				});
			},*/
			function(reference, concept, cb) {
				var privacy = 'public';
				if (req.param('isPrivate') == 'true')
					privacy = 'private';

				var logSchema = {
					'user': req.user._id,
					'type': 'add reference',
					'log': req.user.name + ' has added a new ' + privacy + ' Reference for \"' + concept.title + '\".',
					'content': reference._id
				};

				LogModel.create(logSchema, function(err, log, result){});
				cb(null, reference, concept);
			},
			function(reference, concept, cb) {
				if (req.param('isPrivate') == 'true') {
					console.log('Succeeded to add reference.');
					return res.send({
						'status_code': 200,
						'message': 'Reference was added successfully.',
						'reference_id': reference._id,
						'reference_title': reference.title,
						'reference_description': reference.description,
						'reference_image': reference.image
					});
				} else {
					cb(null, reference, concept);
				}
			},
			function(reference, concept, cb) {
				var text = req.user.name + ' has added a new Reference for ';
				text += '"' + concept.title + '".';

				UpdateModel.create({
					'type': 'added reference',
					'content': schema.url,
					'content_id': reference._id,
					'text': text,
					'owner': req.user._id,
					'allowed_users': req.user.update_on_users,
					'unread_users': req.user.update_on_users,
				}, function(err, update, result) {
					console.log('Succeeded to add reference.');
					res.send({
						'status_code': 200,
						'message': 'Reference was added successfully.',
						'reference_id': reference._id,
						'reference_title': reference.title,
						'reference_description': reference.description,
						'reference_image': reference.image
					});

					sendNotification(req.user.update_on_users, update.text);
				});
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
					'message': 'Please enter privacy setting.'
				});
			}

			var schema = {
				'note': req.param('note'),
				'owner': req.user._id,
				'concept': req.param('concept_id'),
				'shared_user': [req.user._id]
			};

			if (req.param('isPrivate') == 'true') {
				schema.privated_user = [req.user._id];
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

					cb(null)
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
				ConceptModel.findOne({'_id': schema.concept}, function(err, concept) {
					if (err || !concept) {
						console.log('Succeeded to add note.');
						return res.send({
							'status_code': 200,
							'message': 'Note was added successfully.',
							'note_id': note._id
						});
					} else {
						cb(null, note, concept);
					}
				});
			},
			/*function(note, concept, cb) {
				ChapterModel.findOne({'_id':concept.chapter}, function(err, chapter) {
					if (err || !chapter) {
						console.log('Succeeded to add note.');
						return res.send({
							'status_code': 200,
							'message': 'Note was added successfully.',
							'note_id': note._id
						});
					} else {
						cb(null, note, concept, chapter);
					}
				});
			},*/
			function(note, concept, cb) {
				var privacy = 'public';
				if (req.param('isPrivate') == 'true')
					privacy = 'private';

				var logSchema = {
					'user': req.user._id,
					'type': 'add note',
					'log': req.user.name + ' has added a new ' + privacy + ' Note for \"' + concept.title + '\".',
					'content': note._id
				};

				LogModel.create(logSchema, function(err, log, result){});
				cb(null, note, concept);
			},
			function(note, concept, cb) {
				if (req.param('isPrivate') == 'true') {
					console.log('Succeeded to add note.');
					return res.send({
						'status_code': 200,
						'message': 'Note was added successfully.'
					});
				} else {
					cb(null, note, concept);
				}
			},
			function(note, concept, cb) {
				var text = req.user.name + ' has added a new Note for ';
				text += '"' + concept.title + '".';

				UpdateModel.create({
					'type': 'added note',
					'content': schema.note,
					'content_id': note._id,
					'text': text,
					'owner': req.user._id,
					'allowed_users': req.user.update_on_users,
					'unread_users': req.user.update_on_users,
				}, function(err, update, result) {
					console.log('Succeeded to add note.');
					res.send({
						'status_code': 200,
						'message': 'Note was added successfully.',
						'note_id': note._id
					});

					sendNotification(req.user.update_on_users, update.text);
				});
			}]);
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
					'defaulted_user': req.user._id
				}, {
					$pull:{'defaulted_user': req.user._id},
					'updated_date': new Date()
				}, {
					multi: true
				}, function(err, content) {
					cb(null);
				});
			},
			function(cb) {
				SuperModel.update({
					'_id': req.param('content_id')
				}, {
					$push: {'defaulted_user':req.user._id},
					'updated_date': new Date()
				}, {
					multi: true
				}, function(err, content){
					if (err || !content) {
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
					'user': req.user._id,
					'type': 'change default',
					'log': req.user.name + ' has changed the default ' + content_type + ' for \"' + concept.title + '\".',
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
					'message': 'Please enter privacy setting.'
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
				update = {$push: {'privated_user': req.user._id}, 'updated_date': new Date()};
			else
				update = {$pull: {'privated_user': req.user._id}, 'updated_date': new Date()};

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
				ConceptModel.findOne({'_id': content.concept}, {'title': 1}, function(err, concept) {
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
					'user': req.user._id,
					'type': 'change privacy',
					'log': req.user.name + ' has set the ' + content_type + ' to ' + privacy + ' for \"' + concept.title + '\" of \"' + chapter.title + '\".',
					'content': content._id
				};

				LogModel.create(logSchema, function(err, log, result){});
			}]);
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
		 * param: checksum
		 *        kind
		 *        syllabus
		 *        grade
		 *        chapter
		 *        start
		 *        count
		 */
		checkUpdateLinks = function(req, res, next) {
			if (!req.param('kind')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the kind identifier.'
				});
			}

			if (!req.param('start')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the start position of links.'
				});
			}

			if (!req.param('count')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the count of links.'
				});
			}

			var query;
			var kind = req.param('kind');

			if (kind == 'grade') {
				query = {
					'kind': kind
				};
			} else if (kind == 'chapter') {
				query = {
					'kind': kind,
					'syllabus': req.param('syllabus'),
					'grade': req.param('grade')
				};
			} else if (kind == 'concept') {
				query = {
					'kind': kind,
					'syllabus': req.param('syllabus'),
					'grade': req.param('grade')
				};
			}

			if (req.param('start') * 1 > 0) {
				next();
				return;
			}

			LinkModel.find(
				query,
			function(err, links){
				if (err || !links || links.length <= 0) {
					console.log('Failed to get links.');
					res.send({
						'status_code': 200,
						'message': 'Links not found.',
						'links': [],
						'eof': 'true'
					});
				} else {
					var len = links.length;
					var checksum = 0;

					for (var i = 0; i < len; i++) {
						checksum += utils.convertDateToNum(links[i].updated_date);
					}

					if (req.param('checksum') && 
						req.param('checksum') != '' &&
						req.param('checksum') == checksum )
					{
						res.send({
							'status_code': 210,
							'message': 'No updated.',
						});
					} else {
						next();
					}
				}
			});
		},
		getLinks = function(req, res) {
			var kind = req.param('kind');

			var query;

			if (kind == 'grade') {
				query = {
					'kind': kind
				};
			} else if (kind == 'chapter') {
				query = {
					'kind': kind,
					'syllabus': req.param('syllabus'),
					'grade': req.param('grade')
				};
			} else if (kind == 'concept') {
				query = {
					'kind': kind,
					'syllabus': req.param('syllabus'),
					'grade': req.param('grade')
				};
			} else {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the parameters.',
				});
			}

			LinkModel.find(
				query,
			{
			}, {
				sort: {'order': 1, 'syllabus': 1, 'grade':1},
				skip: req.param('start') * 1,
				limit: req.param('count') * 1,
			}, function(err, links){
				if (err || !links ) {
					return res.send({
						'status_code': 210,
						'message': 'Links not found.',
					});
				} else {
					var len = links.length;
					var eof = 'false';
					
					if (len < req.param('count') * 1)
						eof = true;

					return res.send({
						'status_code': 200,
						'message': 'Links were got successfully.',
						'links': links,
						'eof': eof
					});
				}
			});
		},
		/*
		 * param: checksum
		 */
		getTotalSyllabuses = function(req, res) {
			SyllabusModel.find({}, {}, {sort: {'order':1}}, function(err, syllabuses){
				if (err || !syllabuses || syllabuses.length <= 0) {
					console.log('Failed to get syllabuses.');
					res.send({
						'status_code': 210,
						'message': 'Syllabuses not found.',
					});
				} else {
					var len = syllabuses.length;
					var checksum = 0;

					for (var i = 0; i < len; i++) {
						var syllabus = syllabuses[i];

						checksum += utils.convertDateToNum(syllabus.updated_date);
					}

					console.log('Succeeded to get syllabuses.');

					if (req.param('checksum') && 
						req.param('checksum') != '' &&
						req.param('checksum') == checksum )
					{
						res.send({
							'status_code': 210,
							'message': 'No updated.'
						});
					} else {
						res.send({
							'status_code': 200,
							'message': 'Syllabuses were got successfully.',
							'syllabuses': syllabuses
						});
					}
				}
			});
		},
		/*
		 * param: checksum
		 */
		getTotalGrades = function(req, res) {
			GradeModel.find({}, {}, {sort: {'order':1}}, function(err, grades){
				if (err || !grades || grades.length <= 0) {
					console.log('Failed to get grades.');
					res.send({
						'status_code': 210,
						'message': 'Grades not found.',
					});
				} else {
					var len = grades.length;
					var checksum = 0;

					for (var i = 0; i < len; i++) {
						var grade = grades[i];
						if (grade.image != '')
							grade.image = req.protocol + '://' + req.get('host') + grade.image;

						checksum += utils.convertDateToNum(grade.updated_date);
					}

					console.log('Succeeded to get grades.');

					if (req.param('checksum') && 
						req.param('checksum') != '' &&
						req.param('checksum') == checksum )
					{
						res.send({
							'status_code': 210,
							'message': 'No updated.'
						});
					} else {
						res.send({
							'status_code': 200,
							'message': 'Grades were got successfully.',
							'grades': grades
						});
					}
				}
			});
		}
		/*
		 * param: checksum
		 *        syllabus
		 *        grade
		 *        start
		 *        count
		 */
		checkUpdateChapters = function(req, res, next) {
			if (!req.param('syllabus')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the syllabus identifier.'
				});
			}

			if (!req.param('grade')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the grade identifier.'
				});
			}

			if (!req.param('start')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the start position of chapters.'
				});
			}

			if (!req.param('count')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the count of chapters.'
				});
			}

			if (req.param('start') * 1 > 0) {
				next();
				return;
			}

			var chapterIds = [];
			async.waterfall([
			function(cb) {
				LinkModel.find({
					'kind': 'chapter',
					'syllabus': req.param('syllabus'),
					'grade': req.param('grade')
				}, {},
				{
					sort: {'order':1}
				},
				function(err, links){
					if (err || !links || links.length <= 0) {
						return res.send({
							'status_code': 200,
							'message': 'Chapters not found.',
							'syllabus': req.param('syllabus'),
							'grade': req.param('grade'),
							'chapters': [],
							'eof': 'true'
						});
					} else {
						for (var i = 0; i < links.length; i++) {
							chapterIds.push (links[i].chapter);
						}
						cb(null);
					}

				});
			},
			function(cb) {
				ChapterModel.find({
					'_id': {$in: chapterIds}
				}, function(err, chapters){
					if (err || !chapters || chapters.length <= 0) {
						console.log('Failed to get chapters.');
						return res.send({
							'status_code': 200,
							'message': 'Chapters not found.',
							'syllabus': req.param('syllabus'),
							'grade': req.param('grade'),
							'chapters': [],
							'eof': 'true'
						});
					} else {
						var len = chapters.length;
						var checksum = 0;
		
						for (var i = 0; i < len; i++) {
							checksum += utils.convertDateToNum(chapters[i].updated_date);
						}
		
						if (req.param('checksum') && 
							req.param('checksum') != '' &&
							req.param('checksum') == checksum )
						{
							res.send({
								'status_code': 210,
								'message': 'No updated.',
								'syllabus': req.param('syllabus'),
								'grade': req.param('grade')
							});
						} else {
							next();
						}
					}
				});
			}]);
		},
		/*
		 * param: checksum
		 *        syllabus
		 *        grade
		 *        start
		 *        count
		 */
		getChapters = function(req, res) {

			var chapterIds = [];
			var resChapters = [];

			async.waterfall([
			function(cb) {
				LinkModel.find({
					'kind': 'chapter',
					'syllabus': req.param('syllabus'),
					'grade': req.param('grade')
				}, {},
				{
					sort: {'order':1},
					skip: req.param('start') * 1,
					limit: req.param('count') * 1,
				},
				function(err, links){
					if (err || !links || links.length <= 0) {
						console.log('Failed to get chapters.');
						res.send({
							'status_code': 200,
							'message': 'Chapters not found.',
							'syllabus': req.param('syllabus'),
							'grade': req.param('grade'),
							'chapters': [],
							'eof': 'true'
						});
					} else {
						for (var i = 0; i < links.length; i++) {
							chapterIds.push (links[i].chapter);
						}
						cb(null, links);
					}
				});
			},
			function(links, cb) {
				ChapterModel.find({
					'_id': {$in: chapterIds}
				}, {}, {}, function(err, chapters){
					if (err || !chapters || chapters.length <= 0) {
						console.log('Failed to get chpaters.');
						res.send({
							'status_code': 210,
							'message': 'Chapters not found.',
						});
					} else {
						var len = chapters.length;
						var eof = 'false';
		
						for (var i = 0; i < len; i++) {
							var chapter = chapters[i];
							if (chapter.image != '')
								chapter.image = req.protocol + '://' + req.get('host') + chapter.image;
						}
		
						if (len < req.param('count') * 1)
							eof = true;

						for (var i = 0; i < chapterIds.length; i++) {
							
							for (var j = 0; j < chapters.length; j++) {
								if (chapterIds[i] == chapters[j]._id){
									chapter = chapters[j];
									resChapters.push({
										'_id': chapter._id,
										'syllabus': links[i].syllabus,
										'grade': links[i].grade,
										'enabled': chapter.enabled,
										'title': chapter.title,
										'description': chapter.description,
										'image': chapter.image,
										'date': chapter.date,
										'updated_date': chapter.updated_date
									});
									break;
								}
							}
						}

						console.log('Succeeded to get chpaters.');
						res.send({
							'status_code': 200,
							'message': 'Chapters were got successfully.',
							'syllabus': req.param('syllabus'),
							'grade': req.param('grade'),
							'chapters': resChapters,
							'eof': eof
						});
					}
				});
			}]);
		},
		/*
		 * param: checksum
		 *        syllabus
		 *        grade
		 *        start
		 *        count
		 */
		checkUpdateConcepts = function(req, res, next) {
			if (!req.param('syllabus')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the syllabus identifier.'
				});
			}

			if (!req.param('grade')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the grade identifier.'
				});
			}

			if (!req.param('start')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the start position of concepts.'
				});
			}

			if (!req.param('count')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the count of concepts.'
				});
			}

			if (req.param('start') * 1 > 0) {
				next();
				return;
			}

			var conceptIds = [];
			async.waterfall([
			function(cb) {
				LinkModel.find({
					'kind': 'concept',
					'syllabus': req.param('syllabus'),
					'grade': req.param('grade')
				}, {},
				{
					sort: {'order':1}
				},
				function(err, links){
					if (err || !links || links.length <= 0) {
						return res.send({
							'status_code': 200,
							'message': 'Concepts not found.',
							'syllabus': req.param('syllabus'),
							'grade': req.param('grade'),
							'concepts': [],
							'eof': 'true'
						});
					} else {
						for (var i = 0; i < links.length; i++) {
							conceptIds.push (links[i].concept);
						}
						cb(null);
					}

				});
			},
			function(cb) {
				ConceptModel.find({
					'_id': {$in: conceptIds}
				}, function(err, concepts){
					if (err || !concepts || concepts.length <= 0) {
						console.log('Failed to get concepts.');
						return res.send({
							'status_code': 200,
							'message': 'Concepts not found.',
							'syllabus': req.param('syllabus'),
							'grade': req.param('grade'),
							'concepts': [],
							'eof': 'true'
						});
					} else {
						var len = concepts.length;
						var checksum = 0;
		
						for (var i = 0; i < len; i++) {
							checksum += utils.convertDateToNum(concepts[i].updated_date);
						}
		
						if (req.param('checksum') && 
							req.param('checksum') != '' &&
							req.param('checksum') == checksum )
						{
							res.send({
								'status_code': 210,
								'message': 'No updated.',
								'syllabus': req.param('syllabus'),
								'grade': req.param('grade')
							});
						} else {
							next();
						}
					}
				});
			}]);
		},
		/*
		 * param: checksum
		 *        syllabus
		 *        grade
		 *        start
		 *        count
		 */
		getConcepts = function(req, res) {

			var conceptIds = [];
			var resConcepts = [];

			async.waterfall([
			function(cb) {
				LinkModel.find({
					'kind': 'concept',
					'syllabus': req.param('syllabus'),
					'grade': req.param('grade')
				}, {},
				{
					sort: {'order':1},
					skip: req.param('start') * 1,
					limit: req.param('count') * 1,
				},
				function(err, links){
					if (err || !links || links.length <= 0) {
						console.log('Failed to get concepts.');
						res.send({
							'status_code': 200,
							'message': 'Concepts not found.',
							'grade': req.param('grade'),
							'concepts': [],
							'eof': 'true'
						});
					} else {
						for (var i = 0; i < links.length; i++) {
							conceptIds.push (links[i].concept);
						}
						cb(null, links);
					}
				});
			},
			function(links, cb) {
				ConceptModel.find({
					'_id': {$in: conceptIds}
				}, {}, {}, function(err, concepts){
					if (err || !concepts || concepts.length <= 0) {
						console.log('Failed to get concepts.');
						res.send({
							'status_code': 200,
							'message': 'Concepts not found.',
							'syllabus': req.param('syllabus'),
							'grade': req.param('grade'),
							'concepts': [],
							'eof': 'true'
						});
					} else {
						var len = concepts.length;
						var eof = 'false';
		
						for (var i = 0; i < len; i++) {
							if (concepts[i].image.indexOf('/imgs/concept-') === 0 )
								concepts[i].image = req.protocol + '://' + req.get('host') + concepts[i].image;
							
							if (concepts[i].image2.indexOf('/imgs/concept-') === 0 )
								concepts[i].image2 = req.protocol + '://' + req.get('host') + concepts[i].image2;
						}
		
						if (conceptIds.length < req.param('count') * 1)
							eof = true;

						for (var i = 0; i < conceptIds.length; i++) {
							
							for (var j = 0; j < concepts.length; j++) {
								if (conceptIds[i] == concepts[j]._id){
									concept = concepts[j];
									resConcepts.push({
										'_id': concept._id,
										'syllabus': links[i].syllabus,
										'grade': links[i].grade,
										'chapter': links[i].chapter,
										'enabled': concept.enabled,
										'title': concept.title,
										'text': concept.text,
										'image': concept.image,
										'image_credit': concept.image_credit,
										'image_source': concept.image_source,
										'image2': concept.image2,
										'image2_credit': concept.image2_credit,
										'image2_source': concept.image2_source,
										'date': concept.date,
										'updated_date': concept.updated_date
									});
									break;
								}
							}
						}
		
						console.log('Succeeded to get concepts.');
						res.send({
							'status_code': 200,
							'message': 'Concepts were got successfully.',
							'syllabus': req.param('syllabus'),
							'grade': req.param('grade'),
							'concepts': resConcepts,
							'eof': eof,
							'concepts_length':concepts.length
						});
					}
				});
			}]);
		},
		/*
		 * param: checksum
		 *        grade
		 *        start
		 *        count
		 */
		checkUpdateVideos = function(req, res, next) {
			if (!req.param('grade')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the grade identifier.'
				});
			}

			if (!req.param('start')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the start position of videos.'
				});
			}

			if (!req.param('count')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the count of videos.'
				});
			}

			if (req.param('start') * 1 > 0) {
				next();
				return;
			}

			VideoModel.find({
				'grade': req.param('grade')
			}, function(err, videos){
				if (err || !videos || videos.length <= 0) {
					console.log('Failed to get videos.');
					res.send({
						'status_code': 200,
						'message': 'Videos not found.',
						'grade': req.param('grade'),
						'videos': [],
						'eof': 'true'
					});
				} else {
					var len = videos.length;
					var checksum = 0;

					for (var i = 0; i < len; i++) {
						checksum += utils.convertDateToNum(videos[i].updated_date);
					}

					if (req.param('checksum') && 
						req.param('checksum') != '' &&
						req.param('checksum') == checksum )
					{
						res.send({
							'status_code': 210,
							'message': 'No updated.',
							'grade': req.param('grade')
						});
					} else {
						next();
					}
				}
			});
		},
		/*
		 * param: checksum
		 *        grade
		 *        start
		 *        count
		 */
		getTotalVideos = function(req, res) {
			VideoModel.find({
				'grade': req.param('grade')
			}, {}, {
				skip: req.param('start') * 1,
				limit: req.param('count') * 1,
				sort: {'date':1, '_id':1}
			}, function(err, videos){
				if (err || !videos || videos.length <= 0) {
					console.log('Failed to get videos.');
					res.send({
						'status_code': 200,
						'message': 'Videos not found.',
						'grade': req.param('grade'),
						'videos': [],
						'eof': 'true'
					});
				} else {
					var eof = 'false';
					if (videos.length < req.param('count') * 1)
						eof = 'true';

					console.log('Succeeded to get videos.');
					res.send({
						'status_code': 200,
						'message': 'Videos were got successfully.',
						'grade': req.param('grade'),
						'videos': videos,
						'eof': eof
					});
				}
			});
		},
		/*
		 * param: checksum
		 *        chapter
		 *        start
		 *        count
		 */
		checkUpdateVideosOfChapter = function(req, res, next) {
			if (!req.param('chapter')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the chapter identifier.'
				});
			}

			if (!req.param('start')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the start position of videos.'
				});
			}

			if (!req.param('count')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the count of videos.'
				});
			}

			if (req.param('start') * 1 > 0) {
				next();
				return;
			}

			VideoModel.find({
				'chapter': req.param('chapter')
			}, function(err, videos){
				if (err || !videos || videos.length <= 0) {
					console.log('Failed to get videos.');
					res.send({
						'status_code': 200,
						'message': 'Videos not found.',
						'chapter': req.param('chapter'),
						'videos': [],
						'eof': 'true'
					});
				} else {
					var len = videos.length;
					var checksum = 0;

					for (var i = 0; i < len; i++) {
						checksum += utils.convertDateToNum(videos[i].updated_date);
					}

					if (req.param('checksum') && 
						req.param('checksum') != '' &&
						req.param('checksum') == checksum )
					{
						res.send({
							'status_code': 210,
							'message': 'No updated.',
							'chapter': req.param('chapter')
						});
					} else {
						next();
					}
				}
			});
		},
		/*
		 * param: checksum
		 *        chapter
		 *        start
		 *        count
		 */
		getTotalVideosOfChapter = function(req, res) {
			VideoModel.find({
				'chapter': req.param('chapter')
			}, {}, {
				skip: req.param('start') * 1,
				limit: req.param('count') * 1,
				sort: {'date':1, '_id':1}
			}, function(err, videos){
				if (err || !videos || videos.length <= 0) {
					console.log('Failed to get videos.');
					res.send({
						'status_code': 200,
						'message': 'Videos not found.',
						'chapter': req.param('chapter'),
						'videos': [],
						'eof': 'true'
					});
				} else {
					var eof = 'false';
					if (videos.length < req.param('count') * 1)
						eof = 'true';

					console.log('Succeeded to get videos.');
					res.send({
						'status_code': 200,
						'message': 'Videos were got successfully.',
						'chapter': req.param('chapter'),
						'videos': videos,
						'eof': eof
					});
				}
			});
		},
		/*
		 * param: checksum
		 *        concept
		 *        start
		 *        count
		 */
		checkUpdateVideosOfConcept = function(req, res, next) {
			if (!req.param('concept')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the concept identifier.'
				});
			}

			if (!req.param('start')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the start position of videos.'
				});
			}

			if (!req.param('count')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the count of videos.'
				});
			}

			if (req.param('start') * 1 > 0) {
				next();
				return;
			}

			VideoModel.find({
				'concept': req.param('concept')
			}, function(err, videos){
				if (err || !videos || videos.length <= 0) {
					console.log('Failed to get videos.');
					res.send({
						'status_code': 200,
						'message': 'Videos not found.',
						'concept': req.param('concept'),
						'videos': [],
						'eof': 'true'
					});
				} else {
					var len = videos.length;
					var checksum = 0;

					for (var i = 0; i < len; i++) {
						checksum += utils.convertDateToNum(videos[i].updated_date);
					}

					if (req.param('checksum') && 
						req.param('checksum') != '' &&
						req.param('checksum') == checksum )
					{
						res.send({
							'status_code': 210,
							'message': 'No updated.',
							'concept': req.param('concept')
						});
					} else {
						next();
					}
				}
			});
		},
		/*
		 * param: checksum
		 *        concept
		 *        start
		 *        count
		 */
		getTotalVideosOfConcept = function(req, res) {
			VideoModel.find({
				'concept': req.param('concept')
			}, {}, {
				skip: req.param('start') * 1,
				limit: req.param('count') * 1,
				sort: {'date':1, '_id':1}
			}, function(err, videos){
				if (err || !videos || videos.length <= 0) {
					console.log('Failed to get videos.');
					res.send({
						'status_code': 200,
						'message': 'Videos not found.',
						'concept': req.param('concept'),
						'videos': [],
						'eof': 'true'
					});
				} else {
					var eof = 'false';
					if (videos.length < req.param('count') * 1)
						eof = 'true';

					console.log('Succeeded to get videos.');
					res.send({
						'status_code': 200,
						'message': 'Videos were got successfully.',
						'concept': req.param('concept'),
						'videos': videos,
						'eof': eof
					});
				}
			});
		},
		/*
		 * param: checksum
		 *        grade
		 *        start
		 *        count
		 */
		checkUpdateReferences = function(req, res, next) {
			if (!req.param('grade')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the grade identifier.'
				});
			}

			if (!req.param('start')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the start position of references.'
				});
			}

			if (!req.param('count')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the count of references.'
				});
			}

			if (req.param('start') * 1 > 0) {
				next();
				return;
			}

			ReferenceModel.find({
				'grade': req.param('grade')
			}, function(err, references){
				if (err || !references || references.length <= 0) {
					console.log('Failed to get references.');
					res.send({
						'status_code': 200,
						'message': 'References not found.',
						'grade': req.param('grade'),
						'references': [],
						'eof': 'true'
					});
				} else {
					var len = references.length;
					var checksum = 0;

					for (var i = 0; i < len; i++) {
						checksum += utils.convertDateToNum(references[i].updated_date);
					}

					if (req.param('checksum') && 
						req.param('checksum') != '' &&
						req.param('checksum') == checksum )
					{
						res.send({
							'status_code': 210,
							'message': 'No updated.',
							'grade': req.param('grade')
						});
					} else {
						next();
					}
				}
			});
		},
		/*
		 * param: checksum
		 *        grade
		 *        start
		 *        count
		 */
		getTotalReferences = function(req, res) {
			ReferenceModel.find({
				'grade': req.param('grade')
			}, {}, {
				skip: req.param('start') * 1,
				limit: req.param('count') * 1,
				sort: {'date':1, '_id':1}
			}, function(err, references){
				if (err || !references || references.length <= 0) {
					console.log('Failed to get references.');
					res.send({
						'status_code': 210,
						'message': 'References not found.',
						'grade': req.param('grade'),
						'references': [],
						'eof': 'true'
					});
				} else {
					var len = references.length;
					var eof = 'false';

					for (var i = 0; i < len; i++) {
						if (references[i].image == '/images/reference.png')
							references[i].image = '';
					}

					if (len < req.param('count') * 1)
						eof = 'true';

					console.log('Succeeded to get references.');

					res.send({
						'status_code': 200,
						'message': 'References were got successfully.',
						'grade': req.param('grade'),
						'references': references,
						'eof': eof
					});
				}
			});
		},
		/*
		 * param: checksum
		 *        chapter
		 *        start
		 *        count
		 */
		checkUpdateReferencesOfChapter = function(req, res, next) {
			if (!req.param('chapter')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the chapter identifier.'
				});
			}

			if (!req.param('start')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the start position of references.'
				});
			}

			if (!req.param('count')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the count of references.'
				});
			}

			if (req.param('start') * 1 > 0) {
				next();
				return;
			}

			ReferenceModel.find({
				'chapter': req.param('chapter')
			}, function(err, references){
				if (err || !references || references.length <= 0) {
					console.log('Failed to get references.');
					res.send({
						'status_code': 200,
						'message': 'References not found.',
						'chapter': req.param('chapter'),
						'references': [],
						'eof': 'true'
					});
				} else {
					var len = references.length;
					var checksum = 0;

					for (var i = 0; i < len; i++) {
						checksum += utils.convertDateToNum(references[i].updated_date);
					}

					if (req.param('checksum') && 
						req.param('checksum') != '' &&
						req.param('checksum') == checksum )
					{
						res.send({
							'status_code': 210,
							'message': 'No updated.',
							'chapter': req.param('chapter')
						});
					} else {
						next();
					}
				}
			});
		},
		/*
		 * param: checksum
		 *        chapter
		 *        start
		 *        count
		 */
		getTotalReferencesOfChapter = function(req, res) {
			ReferenceModel.find({
				'chapter': req.param('chapter')
			}, {}, {
				skip: req.param('start') * 1,
				limit: req.param('count') * 1,
				sort: {'date':1, '_id':1}
			}, function(err, references){
				if (err || !references || references.length <= 0) {
					console.log('Failed to get references.');
					res.send({
						'status_code': 210,
						'message': 'References not found.',
						'chapter': req.param('chapter'),
						'references': [],
						'eof': 'true'
					});
				} else {
					var len = references.length;
					var eof = 'false';

					for (var i = 0; i < len; i++) {
						if (references[i].image == '/images/reference.png')
							references[i].image = '';
					}

					if (len < req.param('count') * 1)
						eof = 'true';

					console.log('Succeeded to get references.');

					res.send({
						'status_code': 200,
						'message': 'References were got successfully.',
						'chapter': req.param('chapter'),
						'references': references,
						'eof': eof
					});
				}
			});
		},
		/*
		 * param: checksum
		 *        concept
		 *        start
		 *        count
		 */
		checkUpdateReferencesOfConcept = function(req, res, next) {
			if (!req.param('concept')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the concept identifier.'
				});
			}

			if (!req.param('start')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the start position of references.'
				});
			}

			if (!req.param('count')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the count of references.'
				});
			}

			if (req.param('start') * 1 > 0) {
				next();
				return;
			}

			ReferenceModel.find({
				'concept': req.param('concept')
			}, function(err, references){
				if (err || !references || references.length <= 0) {
					console.log('Failed to get references.');
					res.send({
						'status_code': 200,
						'message': 'References not found.',
						'concept': req.param('concept'),
						'references': [],
						'eof': 'true'
					});
				} else {
					var len = references.length;
					var checksum = 0;

					for (var i = 0; i < len; i++) {
						checksum += utils.convertDateToNum(references[i].updated_date);
					}

					if (req.param('checksum') && 
						req.param('checksum') != '' &&
						req.param('checksum') == checksum )
					{
						res.send({
							'status_code': 210,
							'message': 'No updated.',
							'concept': req.param('concept')
						});
					} else {
						next();
					}
				}
			});
		},
		/*
		 * param: checksum
		 *        concept
		 *        start
		 *        count
		 */
		getTotalReferencesOfConcept = function(req, res) {
			ReferenceModel.find({
				'concept': req.param('concept')
			}, {}, {
				skip: req.param('start') * 1,
				limit: req.param('count') * 1,
				sort: {'date':1, '_id':1}
			}, function(err, references){
				if (err || !references || references.length <= 0) {
					console.log('Failed to get references.');
					res.send({
						'status_code': 210,
						'message': 'References not found.',
						'concept': req.param('concept'),
						'references': [],
						'eof': 'true'
					});
				} else {
					var len = references.length;
					var eof = 'false';

					for (var i = 0; i < len; i++) {
						if (references[i].image == '/images/reference.png')
							references[i].image = '';
					}

					if (len < req.param('count') * 1)
						eof = 'true';

					console.log('Succeeded to get references.');

					res.send({
						'status_code': 200,
						'message': 'References were got successfully.',
						'concept': req.param('concept'),
						'references': references,
						'eof': eof
					});
				}
			});
		},
		/*
		 * param: checksum
		 *        grade
		 *        start
		 *        count
		 */
		checkUpdateNotes = function(req, res, next) {
			if (!req.param('grade')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the grade identifier.'
				});
			}

			if (!req.param('start')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the start position of notes.'
				});
			}

			if (!req.param('count')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the count of notes.'
				});
			}

			if (req.param('start') * 1 > 0) {
				next();
				return;
			}

			NoteModel.find({
				'grade': req.param('grade')
			}, function(err, notes){
				if (err || !notes || notes.length <= 0) {
					console.log('Failed to get notes.');
					res.send({
						'status_code': 200,
						'message': 'Notes not found.',
						'grade': req.param('grade'),
						'notes': [],
						'eof': 'true'
					});
				} else {
					var len = notes.length;
					var checksum = 0;

					for (var i = 0; i < len; i++) {
						checksum += utils.convertDateToNum(notes[i].updated_date);
					}

					if (req.param('checksum') && 
						req.param('checksum') != '' &&
						req.param('checksum') == checksum )
					{
						res.send({
							'status_code': 210,
							'message': 'No updated.',
							'grade': req.param('grade')
						});
					} else {
						next();
					}
				}
			});
		},
		/*
		 * param: checksum
		 *        grade
		 *        start
		 *        count
		 */
		getTotalNotes = function(req, res) {
			NoteModel.find({
				'grade': req.param('grade')
			}, {}, {
				skip: req.param('start') * 1,
				limit: req.param('count') * 1,
				sort: {'date':1, '_id':1}
			}, function(err, notes){
				if (err || !notes || notes.length <= 0) {
					console.log('Failed to get notes.');
					res.send({
						'status_code': 210,
						'message': 'Notes not found.',
						'grade': req.param('grade'),
						'notes': [],
						'eof': 'true'
					});
				} else {
					var eof = 'false';
					if (notes.length < req.param('count') * 1)
						eof = 'true';

					console.log('Succeeded to get notes.');

					res.send({
						'status_code': 200,
						'message': 'Notes were got successfully.',
						'grade': req.param('grade'),
						'notes': notes,
						'eof': eof
					});
				}
			});
		},
		/*
		 * param: checksum
		 *        chapter
		 *        start
		 *        count
		 */
		checkUpdateNotesOfChapter = function(req, res, next) {
			if (!req.param('chapter')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the chapter identifier.'
				});
			}

			if (!req.param('start')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the start position of notes.'
				});
			}

			if (!req.param('count')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the count of notes.'
				});
			}

			if (req.param('start') * 1 > 0) {
				next();
				return;
			}

			NoteModel.find({
				'chapter': req.param('chapter')
			}, function(err, notes){
				if (err || !notes || notes.length <= 0) {
					console.log('Failed to get notes.');
					res.send({
						'status_code': 200,
						'message': 'Notes not found.',
						'chapter': req.param('chapter'),
						'notes': [],
						'eof': 'true'
					});
				} else {
					var len = notes.length;
					var checksum = 0;

					for (var i = 0; i < len; i++) {
						checksum += utils.convertDateToNum(notes[i].updated_date);
					}

					if (req.param('checksum') && 
						req.param('checksum') != '' &&
						req.param('checksum') == checksum )
					{
						res.send({
							'status_code': 210,
							'message': 'No updated.',
							'chapter': req.param('chapter')
						});
					} else {
						next();
					}
				}
			});
		},
		/*
		 * param: checksum
		 *        chapter
		 *        start
		 *        count
		 */
		getTotalNotesOfChapter = function(req, res) {
			NoteModel.find({
				'chapter': req.param('chapter')
			}, {}, {
				skip: req.param('start') * 1,
				limit: req.param('count') * 1,
				sort: {'date':1, '_id':1}
			}, function(err, notes){
				if (err || !notes || notes.length <= 0) {
					console.log('Failed to get notes.');
					res.send({
						'status_code': 210,
						'message': 'Notes not found.',
						'chapter': req.param('chapter'),
						'notes': [],
						'eof': 'true'
					});
				} else {
					var eof = 'false';
					if (notes.length < req.param('count') * 1)
						eof = 'true';

					console.log('Succeeded to get notes.');

					res.send({
						'status_code': 200,
						'message': 'Notes were got successfully.',
						'chapter': req.param('chapter'),
						'notes': notes,
						'eof': eof
					});
				}
			});
		},
		/*
		 * param: checksum
		 *        concept
		 *        start
		 *        count
		 */
		checkUpdateNotesOfConcept = function(req, res, next) {
			if (!req.param('concept')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the concept identifier.'
				});
			}

			if (!req.param('start')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the start position of notes.'
				});
			}

			if (!req.param('count')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the count of notes.'
				});
			}

			if (req.param('start') * 1 > 0) {
				next();
				return;
			}

			NoteModel.find({
				'concept': req.param('concept')
			}, function(err, notes){
				if (err || !notes || notes.length <= 0) {
					console.log('Failed to get notes.');
					res.send({
						'status_code': 200,
						'message': 'Notes not found.',
						'concept': req.param('concept'),
						'notes': [],
						'eof': 'true'
					});
				} else {
					var len = notes.length;
					var checksum = 0;

					for (var i = 0; i < len; i++) {
						checksum += utils.convertDateToNum(notes[i].updated_date);
					}

					if (req.param('checksum') && 
						req.param('checksum') != '' &&
						req.param('checksum') == checksum )
					{
						res.send({
							'status_code': 210,
							'message': 'No updated.',
							'concept': req.param('concept')
						});
					} else {
						next();
					}
				}
			});
		},
		/*
		 * param: checksum
		 *        concept
		 *        start
		 *        count
		 */
		getTotalNotesOfConcept = function(req, res) {
			NoteModel.find({
				'concept': req.param('concept')
			}, {}, {
				skip: req.param('start') * 1,
				limit: req.param('count') * 1,
				sort: {'date':1, '_id':1}
			}, function(err, notes){
				if (err || !notes || notes.length <= 0) {
					console.log('Failed to get notes.');
					res.send({
						'status_code': 210,
						'message': 'Notes not found.',
						'concept': req.param('concept'),
						'notes': [],
						'eof': 'true'
					});
				} else {
					var eof = 'false';
					if (notes.length < req.param('count') * 1)
						eof = 'true';

					console.log('Succeeded to get notes.');

					res.send({
						'status_code': 200,
						'message': 'Notes were got successfully.',
						'concept': req.param('concept'),
						'notes': notes,
						'eof': eof
					});
				}
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
			if (content_type == 'video') {
				SuperModel = VideoModel;
			}
			else if (content_type == 'reference') {
				SuperModel = ReferenceModel;
			}
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
					$pull: {'shared_user': req.user._id},
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
						'message': 'The ' + content_type + ' was delted successfully.'
					});
				} else {
					SuperModel.update({'_id': req.param('content_id')}, {'deleted': true}, function(err, result) {
						console.log('Succeeded to delete ' + content_type);
						res.send({
							'status_code': 200,
							'message': 'The ' + content_type + ' was delted successfully.'
						});
					});
				}

				cb(null, content);
			},
			*/
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
							'message': 'The ' + content_type + ' was delted successfully.'
						});
					} else {
						cb(null, content, concept, chapter);
					}
				});
			},
			*/
			function(concept, cb) {
				var logSchema = {
					'user': req.user._id,
					'type': 'delete ' + req.param('content_type'),
					'log': req.user.name + ' has deleted the ' + content_type + ' for \"' + concept.title + '\".',
					'content': content_id
				};

				LogModel.create(logSchema, function(err, log, result){});
			}]);
		},
		sendNotification = function(update_on_users, text){
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
							} else {
								console.log('Succeeded to send notification mail.');
								console.log(info);
							}
						});

					});
			}
			/*function(cb) {
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
		};

	return {	
		checkToken: checkToken,
		addVideo: addVideo,
		addReference: addReference,
		addNote: addNote,
		setDefault: setDefault,
		setPrivate: setPrivate,
		getYoutubeEmbedUrl: getYoutubeEmbedUrl,
		checkUpdateLinks: checkUpdateLinks,
		getLinks: getLinks,
		getTotalSyllabuses: getTotalSyllabuses,
		getTotalGrades: getTotalGrades,
		checkUpdateChapters: checkUpdateChapters,
		getChapters: getChapters,
		checkUpdateConcepts: checkUpdateConcepts,
		getConcepts: getConcepts,
		checkUpdateVideos: checkUpdateVideos,
		getTotalVideos: getTotalVideos,
		checkUpdateVideosOfChapter: checkUpdateVideosOfChapter,
		getTotalVideosOfChapter: getTotalVideosOfChapter,
		checkUpdateVideosOfConcept: checkUpdateVideosOfConcept,
		getTotalVideosOfConcept: getTotalVideosOfConcept,
		checkUpdateReferences: checkUpdateReferences,
		getTotalReferences: getTotalReferences,
		checkUpdateReferencesOfChapter: checkUpdateReferencesOfChapter,
		getTotalReferencesOfChapter: getTotalReferencesOfChapter,
		checkUpdateReferencesOfConcept: checkUpdateReferencesOfConcept,
		getTotalReferencesOfConcept: getTotalReferencesOfConcept,
		checkUpdateNotes: checkUpdateNotes,
		getTotalNotes: getTotalNotes,
		checkUpdateNotesOfChapter: checkUpdateNotesOfChapter,
		getTotalNotesOfChapter: getTotalNotesOfChapter,
		checkUpdateNotesOfConcept: checkUpdateNotesOfConcept,
		getTotalNotesOfConcept: getTotalNotesOfConcept,
		deleteContent: deleteContent,
		sendNotification: sendNotification
	};

}();

module.exports = contentApi;

