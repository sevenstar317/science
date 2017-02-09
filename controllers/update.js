/*
 * User Controller
 * @Author zuogong
 */

var update = function () {
	var UpdateModel = require('../models/updates'),
		GradeModel = require('../models/grades'),
		VideoModel = require('../models/videos'),
		ReferenceModel = require('../models/references'),
		NoteModel = require('../models/notes'),
		UserModel = require('../models/users'),
		dateFormat = require('dateformat'),
		async = require('async'),
		utils = require('../utils'),

		renderUpdatesPage = function(req, res) {
			res.render('updates');
		},
		getUnreadUpdatesCount = function(req, res){
			UpdateModel.count({'unread_users': req.session.user.id}, function(err, count) {
				if (err) {
					console.log('Failed to get count of unread updates.');
					res.send({
						'status_code': 400,
						'message': 'Failed to get count of unread updates.',
						'count' : 0
					});
				} else {
					console.log('Succeeded to get count of unread updates.');
					res.send({
						'status_code': 200,
						'message': 'Succeeded to get count of unread updates.',
						'count': count
					});
				}
			});
		},
		getUpdatesCount = function(req, res){
			UpdateModel.count({'allowed_users': req.session.user.id}, function(err, count) {
				if (err) {
					console.log('Failed to get count of updates.');
					res.send({
						'status_code': 400,
						'message': 'Failed to get count of updates.',
						'count': 0
					});
				} else {
					console.log('Succeeded to get count of updates.');
					res.send({
						'status_code': 200,
						'message': 'Succeeded to get count of updates.',
						'count': count
					});
				}
			});
		},
		getUpdates = function(req, res) {
			var after = 0;
			var count = 25;
			
			if (req.param('after') && req.param('after') > 0)
				after = req.param('after');
			if (req.param('count') && req.param('count') > 0)
				count = req.param('count');

			UpdateModel.find(
				{'allowed_users': req.session.user.id},
				{},
				{skip: after, limit: count, sort: {'date':-1}},
				function(err, updates) {
					if (err) {
						console.log('Failed to get updates.');
						return res.send({
							'status_code': 400,
							'message': 'Failed to get updates.'
						});
					} else if (!updates || updates.length <= 0) {
						console.log('No more updates.');
						return res.send({
							'status_code': 200,
							'message': 'No more updates.',
							'updates':[]
						});
					}

					req.updates = [];
					req.updateCnt = 0;
					var len = updates.length;
					for (var i = 0; i < len; i++) {
						var update = updates[i];
						var isUnread = 'false';
						var unreadLen = update.unread_users.length;

						for (var j = 0; j < unreadLen; j++) {
							if (update.unread_users[j] == req.session.user.id) {
								isUnread = 'true';
								break;
							}
						}

						req.updates.push({
							'id': update._id,
							'type': update.type,
							'content': utils.convertHtmlTagToSpecialChar(update.content),
							'content_id': update.content_id,
							'text': update.text,
							'owner': update.owner,
							'isUnread': isUnread,
							'shareable': 'false',
							'date': dateFormat(update.date, "dd mmm yyyy")
						});

						getUpdateInfo(req, res, i, len);
					}
				}
			);
		},
		getUpdateInfo = function(req, res, index, total) {
			async.waterfall([
			function(cb) {
				UserModel.findOne({'_id': req.updates[index].owner}, function(err, user){
					if (!err && user) {
						if (req.updates[index].type == 'joined') {
							req.updates[index].profile = {
								'name': user.name,
								'email': user.email,
								'school_name': user.school_name,
								'school_addr': user.school_addr,
								'school_city': user.school_city,
								'school_postalcode': user.school_postalcode,
								'school_country': user.school_country,
								'grade': user.grade,
								'section': user.section
							};
						} else {
							req.updates[index].profile = {
								'name': user.name
							};
						}

						if (user.photo != '')
							req.updates[index].profile.photo = user.photo;
						else
							req.updates[index].profile.photo = '/images/guest.png';
					} else {
						console.log('Failed to get user.');
						if (req.updates[index].type == 'joined') {
							req.updates[index].profile = {
								'name': 'Guest',
								'email': '',
								'school_name': '',
								'school_addr': '',
								'school_city': '',
								'school_postalcode': '',
								'school_country': '',
								'grade': '',
								'section': '',
								'photo': '/images/guest.png'
							};
						} else {
							req.updates[index].profile = {
								'name': 'Guest',
								'photo': '/images/guest.png'
							};
						}
					}

					cb(null);
				});
			},
			function(cb) {
				GradeModel.findOne({'_id': req.updates[index].profile.grade}, function(err, grade) {
					if (!err && grade)
						req.updates[index].profile.grade = grade.grade;

					cb(null);
				});
			},
			function(cb) {
				var SuperModel = null;
				if (req.updates[index].type == 'added video')
					SuperModel = VideoModel;
				else if (req.updates[index].type == 'added reference')
					SuperModel = ReferenceModel;
				else if (req.updates[index].type == 'added note')
					SuperModel = NoteModel;

				if (SuperModel == null) {
					req.updateCnt++;
					if (req.updateCnt >= total) {
						console.log('Succeeded to get updates.');
						res.send({
							'status_code': 200,
							'message': 'Succeeded to get updates.',
							'updates': req.updates
						});

						delete req.updates;
						delete req.updateCnt;
					}

					return;
				}

				SuperModel.findOne({
					'_id': req.updates[index].content_id,
					'privated_user': {$ne: req.updates[index].owner}
				}, function(err, content) {
					if (!err && content) {
						req.updates[index].shareable = 'true';
						var len = content.shared_user.length;
						for (var i = 0; i < len; i++) {
							if (content.shared_user[i] == req.session.user.id) {
								req.updates[index].shareable = 'false';
								break;
							}
						}
					}

					req.updateCnt++;
					if (req.updateCnt >= total) {
						console.log('Succeeded to get updates.');
						res.send({
							'status_code': 200,
							'message': 'Succeeded to get updates.',
							'updates': req.updates
						});

						delete req.updates;
						delete req.updateCnt;
					}
				});
			}]);
		},
		readUpdate = function(req, res) {
			UpdateModel.update({
				'unread_users': req.session.user.id
			}, {
				$pull: {'unread_users': req.session.user.id}
			}, {
				multi: true
			}, function(err, result){
				if (err) {
					console.log('Failed to mark update with read.');
					res.send({
						'status_code': 400,
						'message': 'Failed to mark update with read.'
					});
				} else {
					console.log('Succeeded to mark update with read.');
					res.send({
						'status_code': 200,
						'message': 'Succeeded to mark update with read.'
					});
				}
			});
		};
	
	return {
		renderUpdatesPage: renderUpdatesPage,
		getUnreadUpdatesCount: getUnreadUpdatesCount,
		getUpdatesCount: getUpdatesCount,
		getUpdates: getUpdates,
		readUpdate: readUpdate
	};
}();

module.exports = update;

