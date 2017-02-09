/*
 * classmates Controller
 * @Author zuogong
 */

var classmatesApi = function() {
	var fromMailAddress = 'no-reply@scienceisfun.in';
	var nodemailer = require('nodemailer');
	var transporter = nodemailer.createTransport({
		service: 'Gmail',
		connectionTimeout: 90000,
		auth: {
			user: 'scienceisfun01@gmail.com',
			pass: 'romi2345'
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
		utils = require('../utils'),

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
					{$push: {'shared_user': req.user._id}, 'updated_date': new Date()},
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
				SuperModel.findOne({
					'_id': req.param('content_id')
				}, function(err, content) {
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
							'user': req.user._id,
							'type': 'share ' + content_type,
							'log': req.user.name + ' has shared the ' + content_type + ' from ' + user.name + ' for \"' + concept.title + '\" in \"' + chapter.title + '\".',
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

				cb(null, content, concept, chapter);
			},
			function(content, concept, chapter, cb) {
				var text = req.user.name + ' has added your ' + type + ' for ';
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
					'owner': req.user._id,
					'allowed_users': [req.param('user_id')],
					'unread_users': [req.param('user_id')],
				}, function(err, update, result) {
					console.log('Succeeded to share ' + content_type);
					res.send({
						'status_code': 200,
						'message': 'The ' + content_type + ' was shared successfully.'
					});

					sendNotification([req.param('user_id')], update.text);
				});
			}]);
		},
		setUpdate = function(req, res) {
			if (!req.param('user_id')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the classmate identifier.',
				});
			}

			if (!req.param('update')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the settings for recieving updates.'
				});
			}

			async.waterfall([
			function(cb) {
				var query, update, option;

				if (req.param('update') == 'true') {
					query = {
						'_id': req.param('user_id'),
						'update_on_users': {$ne: req.user._id}
					};

					update = {
						$push: {'update_on_users': req.user._id},
						'updated_date': new Date()
					};

					option = {};
				} else {
					query = {
						'_id': req.param('user_id'),
						'update_on_users': req.user._id
					};

					update = {
						$pull: {'update_on_users': req.user._id},
						'updated_date': new Date()
					};

					option = {multi: true};
				}

				UserModel.update(query, update, option, function(err, result) {
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
				UserModel.findOne({'_id': req.param('user_id')}, {'name': 1}, function(err, user) {
					if (err || !user)
						return;

					var update = 'off';
					if (req.param('receive_update') == 'true')
						update = 'on';

					var logSchema = {
						'user': req.user._id,
						'type': 'receiving update ' + update,
						'log': req.user.name + ' has turned ' + update +' receiving update for ' + user.name + '.'
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
				UserModel.findOne({'_id': req.user._id}, function(err, user) {
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
					'user': req.user._id,
					'type': 'invite',
					'log': req.user.name + ' has invited ' + req.param('mail') + '.'
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
					$push: {'friends': req.user._id},
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
					$push: {'update_on_users': req.user._id},
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
						'user': req.user._id,
						'type': 'add friend',
						'log': req.user.name + ' has added ' + user.name + ' in friend list.'
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
					$pull: {'friends': req.user._id},
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
					$pull: {'update_on_users': req.user._id},
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
						'user': req.user._id,
						'type': 'delete friend',
						'log': req.user.name + ' has deleted ' + user.name + ' from friend list.'
					};

					LogModel.create(logSchema, function(err, log, result){});
				});
			}]);
		},
		/*
		 * param: start
		 *        count
		 */
		getTotalUpdates = function(req, res) {
			if (!req.param('start')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the start position of updates.'
				});
			}

			if (!req.param('count')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the count of updates.'
				});
			}

			async.waterfall([
			function(cb) {
				UpdateModel.find({
					'allowed_users': req.user._id
				}, {}, {
					skip: req.param('start') * 1,
					limit: req.param('count') * 1,
					sort: {'date': -1, '_id': -1}
				}, function(err, updates) {
					if (err) {
						console.log('Failed to get updates.');
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Updates were not got successfully. Please try again later.'
						});
					} else if (!updates || updates.length <= 0) {
						console.log('No updates.');
						return res.send({
							'status_code': 200,
							'message': 'No updates.',
							'updates': [],
							'eof': 'true'
						});
					}
					
					var eof = 'false';
					if (updates.length < req.param('count') * 1)
						eof = 'true';

					console.log('Succeeded to get updates.');
					res.send({
						'status_code': 200,
						'message': 'Updates were got successfully.',
						'updates': updates,
						'eof': eof
					});

					cb(null);
				});
			},
			function(cb) {
				UpdateModel.update({
					'unread_users': req.user._id
				}, {
					$pull: {'unread_users': req.user._id}
				}, {
					multi: true
				}, function(err1, result){
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
		},
                getClassmates= function(req, res){
                    
                    var query = {
                            '_id': {$ne: req.user.id},
                            'school_name': req.user.school_name,
                            'grade': req.user.grade,
                            'section': req.user.section,
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
                                            'classmates': resClassmates
                                    });
                            }
                    });
                };

	return {
		shareContent: shareContent,
		setUpdate: setUpdate,
		invite: invite,
		addFriend: addFriend,
		removeFriend: removeFriend,
		getTotalUpdates: getTotalUpdates,
		sendNotification: sendNotification,
                getClassmates: getClassmates,
	}
}();

module.exports = classmatesApi;
