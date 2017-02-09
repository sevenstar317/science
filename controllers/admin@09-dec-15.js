/*
 *	Administrator Controller
 *  @Author boris
 */

 var admin = function () {
 	var SyllabusModel = require('../models/syllabus');
 	var GradeModel = require('../models/grades');
	var ChapterModel = require('../models/chapters');
	var ConceptModel = require('../models/concepts');
	//Tests
	var retGrades = [];
	var TestModel = require('../models/tests');
	//
	var VideoModel = require('../models/videos');
	var ReferenceModel = require('../models/references');
	var NoteModel = require('../models/notes');
	var ReportModel = require('../models/reports');
	var UserModel = require('../models/users');
	var LogModel = require('../models/logs');
	var LinkModel = require('../models/links');
	var utils = require('../utils');
	var logger = require('tracer').colorConsole();
	var bcrypt = require('bcrypt');
 	var async = require('async');
 	var fs = require('fs');
	var dateFormat = require('dateformat');
	var request = require('request');
	var im = require('imagemagick');

	// variables for new importing
	var conceptFieldIndexs = null;
	var mappingFieldIndexs = null;
	
	// variables for new importing test
	var testFieldIndexs = null;
	
	// variables for importing
	var isImporting = false;
	var records = null;
	var fieldIndexs = null;
	var failedRows = null;
	var recordCount = 0;
	var recordIndex = 0;
	var videoIndex = 0;
	var refIndex = 0;
	var defaultedVideo = 'true';
	var defaultedReference = 'true';
	
	// Variables for importing test
	var isImportingTest = false;
	var recordsTest = null;
	var fieldIndexsTest = null;
	var failedRowsTest = null;
	var recordCountTest = 0;
	var recordIndexTest = 0;
	
	// variables for reports downloading
	var reportData = null;
	var reportIndex = -1;

 	var renderAdminPage = function (req, res) {
			res.redirect('/admin/concepts');
		},
		renderRegisterPage = function(req, res) {
			res.render('admin/register');
		},
		/*
		 * param: name
		 *        password
		 *        confirm-password
		 */
		register = function(req, res) {
			if(!req.param('name') || utils.trim(req.param('name')) == '') {
				console.log('Failed to register administrator.');
				return res.send({
					'status_code': 400,
					'message': 'Please enter the administrator name.'
				});
			}

			if (!req.param('password') || req.param('password') == '') {
				console.log('Failed to register administrator.');
				return res.send({
					'status_code': 400,
					'message': 'Please enter the password.'
				});
			} else if (req.param('password').length < 6) {
				console.log('Failed to register administrator.');
				return res.send({
					'status_code': 400,
					'message': 'Password should have a minimum of 6 characters.'
				});
			}

			if (req.param('password') != req.param('confirm-password')) {
				console.log('Failed to register administrator.');
				return res.send({
					'status_code': 400,
					'message': 'Passwords do not match.'
				});
			}

			var password = req.param('password');

			async.waterfall([
			function(cb) {
				bcrypt.genSalt(10, function (err, salt) {
					if(err){
						console.log('Failed to register administrator.');
						res.send({
							'status_code': 400,
							'message': 'Password encryption failed.'
						});
					}else{
						cb(null, salt);
					}
				});
			},
			function(salt, cb) {
				bcrypt.hash(password, salt, function (err, hash) {
					if(err){
						console.log('Failed to register administrator.');
						res.send({
							'status_code': 400,
							'message': 'Password encryption failed.'
						});
					}else{
						password = hash;
						cb(null);
					}
				});
			},
			function(cb) {
				var config_json = {
					'administrator': {
						'name': req.param('name'),
						'password': password
					}
				};
				var config_str = JSON.stringify(config_json);
				var config_file = __dirname.substring(0, __dirname.lastIndexOf('/')) + '/files/config.json';

				fs.writeFile(config_file, config_str, function(err) {
					if (err) {
						console.log('Failed to register administrator.');
						res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Administrator was not registered. Please try again later.'
						});
					} else {
						console.log('Succeeded to register administrator.');
						res.send({
							'status_code': 200,
							'message': 'Administrator was registered successfully.'
						});
					}
				});
			}]);
		},
		renderLoginPage = function (req, res) {
			res.render('admin/login');
		},
		/*
		 * param: name
		 *        password
		 */
		login = function(req, res) {
			if(!req.param('name') || utils.trim(req.param('name')) == '') {
				console.log('Failed to login.');
				return res.send({
					'status_code': 400,
					'message': 'Please enter administrator name.'
				});
			}

			if (!req.param('password') || req.param('password') == '') {
				console.log('Failed to login.');
				return res.send({
					'status_code': 400,
					'message': 'Please enter password.'
				});
			}

			async.waterfall([
			function(cb) {
				var config_file = __dirname.substring(0, __dirname.lastIndexOf('/')) + '/files/config.json';
				fs.readFile(config_file, function(err, data) {
					if (err) {
						console.log('Failed to read config file.');
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Administrator was not logged in. Please try again later.'
						});
					}

					var config_json = JSON.parse(data);
					var name = '', password = '';
					if (config_json && config_json.administrator) {
						if (config_json.administrator.name)
							name = config_json.administrator.name;

						if (config_json.administrator.password)
							password = config_json.administrator.password;
					}

					if (name != utils.trim(req.param('name'))) {
						console.log('Admin name is wrong!');
						return res.send({
							'status_code': 400,
							'message': 'Unable to sign in. Administrator name is wrong. Please try again.'
						});
					}

					cb(null, password);
				});
			},
			function(password, cb) {
				bcrypt.compare(req.param('password'), password, function (err, auth) {
					if (!err && auth) {
						req.session.admin = 'true';
						console.log('Succeeded to login.');
						return res.send({
							'status_code': 200,
							'message': 'Logged in successfully.'
						});
					} else {
						console.log('Password is wrong!');
						return res.send({
							'status_code': 400,
							'message': 'Unable to sign in. Administrator password is wrong. Please try again.'
						});
					}
				});
			}]);
		},
		logout = function(req, res) {
			delete req.session.admin;
			res.redirect('/admin/login');
		},

		/*
		 *
		 * Syllabus Controller
		 *
		 * */

		renderSyllabusesPage = function (req, res) {
			SyllabusModel.find({}, {}, {sort: {'order': 1}}, function(err, syllabuses){
				if (err || !syllabuses || syllabuses.length <= 0) {
					console.log('Failed to get syllabuses.');
					res.render('admin/syllabuses');
				} else {
					var len = syllabuses.length;
					var resSyllabuses = [];

					for (var i = 0; i < len; i++) {
						var syllabus = syllabuses[i];
						resSyllabuses.push({
							'id': syllabus._id,
							'title': syllabus.title,
							'enabled': syllabus.enabled
						});
					}

					console.log('Succeeded to get syllabuses.');
					res.render('admin/syllabuses', {'syllabuses': resSyllabuses});
				}
			});
		},
		renderSyllabusNewPage = function (req, res) {
			var syllabus = {
				id: '',
				title: '',
				description: '',
				order: 0,
				enabled: ''
			}
			SyllabusModel.find({}, {'title': 1, 'order': 1}, {sort: {'order': 1}}, function(err, syllabuses){
				if (err || !syllabuses || syllabuses.length <= 0) {
					res.render('admin/syllabus', {syllabus: syllabus});
				} else {
					res.render('admin/syllabus', {'syllabus': syllabus, 'syllabuses': syllabuses});
				}
			});
		},
		newSyllabus = function (req, res) {
			if (!req.param('title') || req.param('title') == '') {
				console.log('Failed to add syllabus');
				res.send({
					'status_code': 400,
					'message': 'Please enter the title.'
				});
			}

			var schema = {
				'title': req.param('title'),
				'description': req.param('description'),
				'order': req.param('order'),
				'enabled': 'false'
			};

			if (req.param('enable') === 'on')
				schema.enabled = 'true';

			async.waterfall([
			function(cb) {
				SyllabusModel.update({
					'order':{$gte: schema.order}
				}, {
					$inc: {'order': 1}
				}, {
					multi: true
				}, function(err, result) {
					if (err) {
						console.log('Failed to add new syllabus.');
						res.send({
							'status_code': 400,
							'message': 'Sorry, Something went wrong. Syllabus was not added. Please try again later.'
						});
					} else
						cb(null);
				});
			},
			function(cb) {
				SyllabusModel.create(schema, function (err, syllabus, result) {
					if (err) {
						console.log(err);
						res.send({
							'status_code': 400,
							'message': 'Sorry, Something went wrong. Syllabus was not added. Please try again later.'
						});
					} else {
						res.send({
							'status_code': 200,
							'message': 'Syllabus was added successfully.'
						});
					}
				});
			},
			]);
		},

		renderSyllabusEditPage = function (req, res) {
			var syllabus_id = '';
			if (req.query.id)
				syllabus_id = req.query.id;

			async.waterfall([
			function(cb) {
				SyllabusModel.findOne({'_id': syllabus_id}, function(err, syllabus) {
					if (err || !syllabus) {
						console.log('Failed to get syllabus.');
						res.redirect('admin/syllabuses');
					} else {
						var resSyllabus = {
							id: syllabus._id,
							title: syllabus.title,
							description: syllabus.description,
							order: syllabus.order,
							enabled: syllabus.enabled
						};
						cb(null, resSyllabus);
					}
				});
			},
			function(syllabus, cb) {
				SyllabusModel.find({
					'_id': {$ne: syllabus.id}
				}, {
					'title': 1,
					'description': 1,
					'order': 1
				}, {
					sort: {'order': 1}
				}, function(err, syllabuses){
					if (err || !syllabuses || syllabuses.length <= 0) {
						res.render('admin/syllabus', {syllabus: syllabus});
					} else {
						res.render('admin/syllabus', {'syllabus': syllabus, 'syllabuses': syllabuses});
					}
				});
			}
			]);
		},

		editSyllabus = function (req, res) {
			if (!req.param('title') || req.param('title') == '') {
				console.log('Failed to save syllabus');
				res.send({
					'status_code': 400,
					'message': 'Please enter the syllabus title.'
				});
			}

			var syllabus_id = '';
			var schema = {
				'title': req.param('title'),
				'description': req.param('description'),
				'enabled': 'false',
				'order': req.param('order'),
				'updated_date': new Date()
			};

			if (req.param('enable') === 'on')
				schema.enabled = 'true';

			if (req.query.id)
				syllabus_id = req.query.id;

			async.waterfall([
			function(cb) {
				SyllabusModel.findOne({'_id': syllabus_id}, function(err, syllabus) {
					if (err || !syllabus) {
						console.log('Failed to save syllabus.');
						res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Syllabus was not saved. Please try again later.'
						});
					} else {
						cb(null, syllabus.order);
					}
				});
			},
			function(old_order, cb) {
				SyllabusModel.update({
					'order': {$gt: old_order}
				}, {
					$inc: {'order': -1}
				}, {
					multi: true
				}, function(err, result) {
					if (err) {
						console.log('Failed to save syllabus.');
						res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Syllabus was not saved. Please try again later.'
						});
					} else
						cb(null, old_order);
				});
			},
			function(old_order, cb) {
				if (schema.order * 1 > 1 &&
					schema.order * 1 > old_order)
					schema.order = schema.order * 1 - 1;

				SyllabusModel.update({
					'order': {$gte: schema.order}
				}, {
					$inc: {'order': 1}
				}, {
					multi: true
				}, function(err, result) {
					if (err) {
						console.log('Failed to save syllabus.');
						res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Syllabus was not saved. Please try again later.'
						});
					} else
						cb(null);
				});
			},
			function(cb) {
				SyllabusModel.update({'_id': syllabus_id}, schema, function(err, result) {
					if (err) {
						console.log(err);
						res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Syllabus was not saved. Please try again later.'
						});
					} else {
						console.log('Succeeded to save grade.');
						res.send({
							'status_code': 200,
							'message': 'Grade was saved successfully.'
						});
					}
				});
			},
			]);
		},
		deleteSyllabus = function (req, res) {
			var syllabusId = req.param('syllabus');

			async.waterfall([
			function(cb) {
				SyllabusModel.remove({'_id': syllabusId}, function(err, result) {
					cb(null);
				})
			},
			function(cb) {
				LinkModel.remove({'syllabus': syllabusId}, function(err, result) {
					cb(null);
				})
			},
			function(cb) {
				console.log('Succeeded to delete syllabus.');
				res.send({
					'status_code': 200,
					'message': 'Syllabus was deleted successfully.'
				});
			}
			]);
		},
		getGradeLink = function(syllabus, notGradeId, gradeNames, retGrades) {
			var query;
		console.log('hit grade link');
			if (!notGradeId) {
				query = {
					'kind': 'grade',
					'syllabus': syllabus
				};
			} else {
				query = {
					'kind': 'grade',
					'syllabus': syllabus,
					'grade': notGradeId//{$ne: notGradeId}
				};
			}
			LinkModel.find(
				query,
			{
				'grade': 1,
				'order': 1
			}, {
				sort: {'order': 1}
			}, function(err, links){
				if (err || !links ) {
					console.log(err.message);
					retGrades = null;
					return;
				} else {
					for (var i = 0; i < links.length; i++) {
						link = links[i];
						retGrades.push({
							'grade_id': link.grade,
							'grade_title': gradeNames[link.grade],
							'order': link.order
						});
					}
				//	callback();
				}
			});
		},

		/*
		 *
		 * Grade Controller
		 *
		 * */

		renderGradesPage = function (req, res) {
			async.waterfall([
			function(cb) {
				SyllabusModel.find({
				}, {
					'title': 1,
					'order': 1
				}, {
					sort: {'order': 1}
				}, function(err, syllabuses){
					if (err || !syllabuses || syllabuses.length <= 0) {
						console.log('Failed to get grades.');
						return res.render('admin/grades');
					} else {
						//cb(null, syllabuses);
						console.log('Succeeded to get grades.');
						res.render('admin/grades', {'syllabuses': syllabuses});
					}
				});

			}/*,
			function(syllabuses, cb) {
				GradeModel.find({}, {}, {sort: {'order': 1}}, function(err, grades){
					if (err || !grades || grades.length <= 0) {
						console.log('Failed to get grades.');
						res.render('admin/grades');
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
						res.render('admin/grades', {'grades': resGrades, 'syllabuses': syllabuses});
					}
				});
			},*/
			]);
		},
		renderGradeNewPage = function (req, res) {
			var grade = {
				id: '',
				grade: '',
				image: '',
				order: 0,
				enabled: ''
			}
			SyllabusModel.find({}, {'title': 1, 'order': 1}, {sort: {'order': 1}}, function(err, syllabuses){
				if (err || !syllabuses || syllabuses.length <= 0) {
					res.render('admin/grade', {'grade': grade});
				} else {
					res.render('admin/grade', {'grade': grade, 'syllabuses': syllabuses});
				}
			});
		},
		/*
		 * param: grade
		 *        enable
		 */
		newGrade = function (req, res) {
			if (!req.param('grade') || req.param('grade') == '') {
				console.log('Failed to add grade');
				res.send({
					'status_code': 400,
					'message': 'Please enter the grade.'
				});
			}

			var rootPath = __dirname.substring(0, __dirname.lastIndexOf('/'));
			var photoPath = '';
			var tmpPhotoPath = '';
			var ext = '';
			var schema = {
				'grade': req.param('grade'),
				'image': '',
				'enabled': 'false'
			};

			var links = [];
			var syllabuses = req.param('syllabuses');
			if (!syllabuses)
				syllabuses = [];
			else if (syllabuses.constructor != Array)
				syllabuses = [syllabuses];

			var orders = req.param('orders');
			if (!orders)
				orders = [];
			else if (orders.constructor != Array)
				orders = [orders];


			for (var i = 0; i < syllabuses.length; i++) {
				links.push({
					'syllabus_id': syllabuses[i],
					'order': orders[i]
				});
			}

			if (req.param('enable') === 'on')
				schema.enabled = 'true';

			for (var field in req.files) {
				if (req.files[field].originalFilename == ''
					|| req.files[field].size == 0 
					|| photoPath != '')
				{
					if (fs.existsSync(req.files[field].path))
						fs.unlinkSync(req.files[field].path);
					continue;
				}

				var filename = req.files[field].originalFilename;
				ext = filename.substring(filename.lastIndexOf('.'));
				tmpPhotoPath = req.files[field].path;
			}

			async.waterfall([
			function(cb) {
				var len = links.length;
				for (var i = 0; i < len; i++) {
					for (var j = i+1; j < len; j++) {
						if (links[i].syllabus_id === links[j].syllabus_id) {
							console.log('Failed to save grade. Check error: duplicate link!');
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Please check duplicated links and try again.'
							});
						}
					}
				}
				cb(null);
			},
			function(cb) {
				GradeModel.create(schema, function (err, grade, result) {
					if (err) {
						if (fs.existsSync(tmpPhotoPath))
							fs.unlinkSync(tmpPhotoPath);
						console.log('Hit ');
						console.log(err);
					
						res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Grade was not added. Please try again later.'
						});
					} else {
						if (tmpPhotoPath != ''){
							photoPath = rootPath + '/files/imgs/grade-' + grade._id + ext;
							fs.renameSync(tmpPhotoPath, photoPath);

							if (fs.existsSync(tmpPhotoPath))
								fs.unlinkSync(tmpPhotoPath);

							if (fs.existsSync(photoPath))
								schema.image = '/imgs/grade-' + grade._id + ext;
							else {
								GradeModel.remove({'_id':grade._id}, null);
								console.log('Failed to upload image.');
								return res.send({
									'status_code': 400,
									'message': 'Sorry. Something went wrong. Grade was not added. Please try again later.'
								});
							}
						}

						cb(null, grade._id);
					}
				});
			},
			function(grade_id, cb) {
				GradeModel.update({'_id': grade_id}, {'image': schema.image}, function(error, doc) {
					if (error && schema.image != '') {
						GradeModel.remove({'_id':grade_id}, null);

						if (fs.existsSync(photoPath))
							fs.unlinkSync(photoPath);

						console.log('Failed to upload image.');
						res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Grade was not added. Please try again later.'
						});
					} else {
						cb(null, grade_id);
					}
				});
			},
			function(grade_id, cb) {
				var len = links.length;
				for (var i = 0; i < len; i++) {				

					LinkModel.update({
						'kind': 'grade',
						'syllabus': links[i].syllabus_id,
						'order': {$gte: links[i].order}
					}, {
						$inc: {'order': 1}
					}, {
						multi: true
					}, function (err, result) {
						if (err) {
							console.log('Failed to save grade.');
							console.log(err.message);
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Grade was not saved. Please try again later.'
							});
						} else {
						}
					});
				}

				cb(null, grade_id);
			},
			function(grade_id, cb) {
				var len = links.length;
				for (var i = 0; i < len; i++) {				
					linkSchema = {
						'kind': 'grade',
						'syllabus': links[i].syllabus_id,
						'grade': grade_id,
						'order': links[i].order,
					};

					LinkModel.create(linkSchema, function (err, link, result) {
						if (err) {
							console.log('Failed to save grade.');
							console.log(err.message);
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Grade was not saved. Please try again later.'
							});
						} else {
						}
					});
				}

				console.log('Added grade successfully.');
				res.send({
					'status_code': 200,
					'message': 'Grade was added successfully.'
				});
			}
			]);
		},
		renderGradeEditPage = function (req, res) {
			var grade_id = '';
			var gradeNames = [];
			if (req.query.id)
				grade_id = req.query.id;

			async.waterfall([
			function(cb) {
				GradeModel.findOne({'_id': grade_id}, function(err, grade) {
					if (err || !grade) {
						console.log('Failed to get grade.');
						res.redirect('admin/grades');
					} else {
						var resGrade = {
							id: grade._id,
							grade: grade.grade,
							image: grade.image,
							order: grade.order,
							enabled: grade.enabled
						};
						cb(null, resGrade);
					}
				});
			},
			function(resGrade, cb) {
				GradeModel.find({}, function(err, grades){
					if (err || !grades || grades.length <= 0) {
						console.log('Failed to get grade name list.');
						res.render('admin/grades');
					} else {
						var len = grades.length;
						for (var i = 0; i < len; i++) {
							var grade = grades[i];
							gradeNames[grade._id] = grade.grade;
						}
						cb(null, resGrade);
					}
				});
			},
			function(grade, cb) {
				SyllabusModel.find({
				}, {
					'title': 1,
					'order': 1
				}, {
					sort: {'order': 1}
				}, function(err, syllabuses){
					if (err || !syllabuses || syllabuses.length <= 0) {
						return res.render('admin/grade', {'grade': grade});
					} else {
						cb(null, grade, syllabuses);
					}
				});

			},
			function(grade, syllabuses, cb) {
				LinkModel.find({
					'kind': 'grade',
					'grade': grade_id
				}, {
					'syllabus': 1,
					'order': 1,
				}, {
				}, function(err, links){
					if (err || !links || links.length <= 0) {
						return res.render('admin/grade', {'grade': grade, 'syllabuses': syllabuses});
					} else {
						cb(null, grade, syllabuses, links);
					}
				});
			},
			function(grade, syllabuses, links, cb) {
				var resLinks = [];
				var len = links.length;

				for (var i = 0; i < len; i++) {
					var linkInfo = links[i];
					var exGrades = [];

					getGradeLink (linkInfo.syllabus, grade.id, gradeNames, exGrades, function(){
						
					});
					console.log('exGrades:' + exGrades);
					if (exGrades) {
						resLinks.push({
							'linkInfo': linkInfo,
							'exGrades': exGrades,
						});
					}
				}
				cb(null, grade, syllabuses, resLinks);
			},
			function(grade, syllabuses, links, cb) {
				res.render('admin/grade', {'grade': grade, 'syllabuses': syllabuses, 'links': links});
			}]);
		},
		/*
		 * param: grade
		 *        enable
		 *        image
		 */
		editGrade = function (req, res) {
			if (!req.param('grade') || req.param('grade') == '') {
				console.log('Failed to save grade');
				res.send({
					'status_code': 400,
					'message': 'Please enter the grade.'
				});
			}

			var grade_id = '';
			var rootPath = __dirname.substring(0, __dirname.lastIndexOf('/'));
			var tmpImagePath = '';
			var imagePath = '';
			var image = '';
			var schema = {
				'grade': req.param('grade'),
				'enabled': 'false',
				'updated_date': new Date()
			};

			var links = [];
			var syllabuses = req.param('syllabuses');
			if (!syllabuses)
				syllabuses = [];
			else if (syllabuses.constructor != Array)
				syllabuses = [syllabuses];

			var orders = req.param('orders');
			if (!orders)
				orders = [];
			else if (orders.constructor != Array)
				orders = [orders];

			for (var i = 0; i < syllabuses.length; i++) {
				links.push({
					'syllabus_id': syllabuses[i],
					'order': orders[i]
				});
			}

			if (req.param('enable') === 'on')
				schema.enabled = 'true';

			if (req.param('image-removed') == 'removed')
				schema.image = '';

			if (req.param('image'))
				image = req.param('image');

			if (req.query.id)
				grade_id = req.query.id;

			for (var field in req.files) {
				if (req.param('image-removed') == 'removed'
					|| req.files[field].originalFilename == ''
					|| req.files[field].size == 0 
					|| imagePath != '')
				{
					if (fs.existsSync(req.files[field].path))
						fs.unlinkSync(req.files[field].path);
					continue;
				}
					
				var filename = req.files[field].originalFilename;
				var ext = filename.substring(filename.lastIndexOf('.'));
				imagePath = rootPath + '/files/imgs/grade-' + grade_id + ext;
				schema.image = '/imgs/grade-' + grade_id + ext;
				tmpImagePath = req.files[field].path;
			}

			async.waterfall([
			function(cb) {
				GradeModel.findOne({'_id': grade_id}, function(err, grade) {
					if (err || !grade) {
						if (fs.existsSync(tmpImagePath))
							fs.unlinkSync(tmpImagePath);

						console.log('Failed to save grade.');
						res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Grade was not saved. Please try again later.'
						});
					} else {
						cb(null);
					}
				});
			},
			function(cb) {
				var len = links.length;
				for (var i = 0; i < len; i++) {
					for (var j = i+1; j < len; j++) {
						if (links[i].syllabus_id === links[j].syllabus_id) {
							console.log('Failed to save grade. Check error: duplicate link!');
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Please check duplicated links and try again.'
							});
						}
					}
				}
				cb(null);
			},
			function(cb) {
				LinkModel.remove({'kind':'grade', 'grade':grade_id}, null);
				cb(null);
			},
			function(cb) {
				var len = links.length;
				for (var i = 0; i < len; i++) {				

					LinkModel.update({
						'kind': 'grade',
						'syllabus': links[i].syllabus_id,
						'order': {$gte: links[i].order}
					}, {
						$inc: {'order': 1}
					}, {
						multi: true
					}, function (err, result) {
						if (err) {
							console.log('Failed to save grade.');
							console.log(err.message);
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Grade was not saved. Please try again later.'
							});
						} else {
						}
					});
				}

				cb(null);
			},
			function(cb) {
				var len = links.length;
				for (var i = 0; i < len; i++) {				
					linkSchema = {
						'kind': 'grade',
						'syllabus': links[i].syllabus_id,
						'grade': grade_id,
						'order': links[i].order
					};

					LinkModel.create(linkSchema, function (err, link, result) {
						if (err) {
							console.log('Failed to save grade.');
							console.log(err.message);
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Grade was not saved. Please try again later.'
							});
						} else {
						}
					});
				}
				cb(null);
			},
			function(cb) {
				GradeModel.update({'_id': grade_id}, schema, function(err, result) {
					if (err) {
						if (fs.existsSync(tmpImagePath))
							fs.unlinkSync(tmpImagePath);

						console.log(err);
						res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Grade was not saved. Please try again later.'
						});
					} else {
						if (req.param('image-removed') == 'removed') {
							if (image != '' && fs.existsSync(rootPath + '/files' + image))
								fs.unlinkSync(rootPath + '/files' + image);
						}

						if (imagePath != '') {
							if (image != '' && fs.existsSync(rootPath + '/files' + image))
								fs.unlinkSync(rootPath + '/files' + image);

							if (fs.existsSync(tmpImagePath))
								fs.renameSync(tmpImagePath, imagePath);
						}

						console.log('Succeeded to save grade.');
						res.send({
							'status_code': 200,
							'message': 'Grade was saved successfully.'
						});
					}
				});
			},
			]);
		},
		deleteGrade = function (req, res) {
			var gradeId = req.param('grade');

			async.waterfall([
			function(cb) {
				GradeModel.remove({'_id': gradeId}, function(err, result) {
					cb(null);
				})
			},
			function(cb) {
				LinkModel.remove({'grade': gradeId}, function(err, result) {
					cb(null);
				})
			},
			function(cb) {
				console.log('Succeeded to delete grade.');
				res.send({
					'status_code': 200,
					'message': 'Grade was deleted successfully.'
				});
			}
			]);
		},

		/*
		 *
		 * Chapter Controller
		 *
		 * */

		renderChaptersPage = function (req, res) {
			async.waterfall([
			function(cb) {
				SyllabusModel.find({
				}, {
					'title': 1,
					'order': 1
				}, {
					sort: {'order': 1}
				}, function(err, syllabuses){
					if (err || !syllabuses || syllabuses.length <= 0) {
						console.log('Failed to get chapters.');
						return res.render('admin/chapters');
					} else {
						//cb(null, syllabuses);
						console.log('Succeeded to get chapters.');
						res.render('admin/chapters', {'syllabuses': syllabuses});
					}
				});

			}/*
				function(cb) {
					GradeModel.find({}, function(err, grades){
						if (err || !grades || grades.length <= 0) {
							console.log('Failed to get chpaters.');
							res.render('admin/chapters');
						} else {
							var len = grades.length;
							var gradeNames = [];

							for (var i = 0; i < len; i++) {
								var grade = grades[i];
								gradeNames[grade._id] = grade.grade;
							}

							cb(null, gradeNames);
						}
					});
				},
				function(gradeNames, cb) {
					ChapterModel.find({}, {}, {sort: {'grade_order': 1, 'order': 1}}, function(err, chapters){
						if (err || !chapters || chapters.length <= 0) {
							console.log('Failed to get chpaters.');
							res.render('admin/chapters');
						} else {
							var len = chapters.length;
							var resChapters = [];

							for (var i = 0; i < len; i++) {
								var chapter = chapters[i];
								resChapters.push({
									'id': chapter._id,
									'title': chapter.title,
									'enabled': chapter.enabled,
									'grade': gradeNames[chapter.grade],
								});
							}

							console.log('Succeeded to get chpaters.');
							res.render('admin/chapters', {'chapters': resChapters});
						}
					});
				}*/
			]);
		},
		renderChapterNewPage = function (req, res) {
			var chapter = {
				'id': '',
				'title': '',
				'grade': '',
				'description': '',
				'image': '',
				'enabled': 'true',
				'order': 0
			};

			async.waterfall([
			function(cb) {
				SyllabusModel.find({}, {'title':1, 'order': 1}, {sort: {'order': 1}}, function(err, syllabuses){
					if (err || !syllabuses || syllabuses.length <= 0 )
						res.render('admin/chapter', {'chapter': chapter});
					else {
						res.render('admin/chapter', {'chapter': chapter, 'syllabuses': syllabuses});
					}
				});
			}]);
		},
		/*
		 * param: title
		 *        grade
		 *        description
		 *        image
		 */
		newChapter = function (req, res) {
			var rootPath = __dirname.substring(0, __dirname.lastIndexOf('/'));
			var photoPath = '';
			var tmpPhotoPath = '';
			var ext = '';
			var schema = {
				'title': req.param('title'),
				'description': req.param('description'),
				'image': '',
				'enabled': 'true',
				'order': req.param('order'),
			};

			var links = [];
			var syllabuses = req.param('syllabuses');
			if (!syllabuses)
				syllabuses = [];
			else if (syllabuses.constructor != Array)
				syllabuses = [syllabuses];

			var grades = req.param('grades');
			if (!grades)
				grades = [];
			else if (grades.constructor != Array)
				grades = [grades];

			var orders = req.param('orders');
			if (!orders)
				orders = [];
			else if (orders.constructor != Array)
				orders = [orders];

			for (var i = 0; i < syllabuses.length; i++) {
				links.push({
					'syllabus_id': syllabuses[i],
					'grade_id': grades[i],
					'order': orders[i]
				});
			}

			if (req.param('enable') === 'on')
				schema.enabled = 'true';
			else
				schema.enabled = 'false';
	
			for (var field in req.files) {
				if (req.files[field].originalFilename == ''
					|| req.files[field].size == 0 
					|| photoPath != '')
				{
					if (fs.existsSync(req.files[field].path))
						fs.unlinkSync(req.files[field].path);
					continue;
				}

				var filename = req.files[field].originalFilename;
				ext = filename.substring(filename.lastIndexOf('.'));
				tmpPhotoPath = req.files[field].path;
			}

			async.waterfall([
			function(cb) {
				var len = links.length;
				for (var i = 0; i < len; i++) {
					for (var j = i+1; j < len; j++) {
						if (links[i].syllabus_id === links[j].syllabus_id &&
								links[i].grade_id === links[j].grade_id) {
							console.log('Failed to save grade. Check error: duplicate link!');
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Please check duplicated links and try again.'
							});
						}
					}
				}
				cb(null);
			},
			function(cb) {
				ChapterModel.create(schema, function (err, chapter, result) {
					if (err) {
						if (fs.existsSync(tmpPhotoPath))
							fs.unlinkSync(tmpPhotoPath);

						console.log(err);
						res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Chapter was not added. Please try again later.'
						});
					} else {
						if (tmpPhotoPath != ''){
							photoPath = rootPath + '/files/imgs/chapter-' + chapter._id + ext;
							fs.renameSync(tmpPhotoPath, photoPath);

							if (fs.existsSync(tmpPhotoPath))
								fs.unlinkSync(tmpPhotoPath);

							if (fs.existsSync(photoPath))
								schema.image = '/imgs/chapter-' + chapter._id + ext;
							else {
								ChapterModel.remove({'_id':chapter._id}, null);
								console.log('Failed to upload image');
								return res.send({
									'status_code': 400,
									'message': 'Sorry. Something went wrong. Chapter was not added. Please try again later.'
								});
							}
						}

						cb(null, chapter._id);
					}
				});
			},
			function(chapter_id, cb) {
				ChapterModel.update({'_id': chapter_id}, {'image': schema.image}, function(err, doc) {
					if (err && schema.image != '') {
						ChapterModel.remove({'_id':chapter_id}, null);

						if (fs.existsSync(photoPath))
							fs.unlinkSync(photoPath);

						console.log('Failed to upload image.');
						res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Chapter was not added. Please try again later.'
						});
					} else {
						cb(null, chapter_id);
					}
				});
			},
			function(chapter_id, cb) {
				var len = links.length;
				for (var i = 0; i < len; i++) {				

					LinkModel.update({
						'kind': 'chapter',
						'syllabus': links[i].syllabus_id,
						'grade': links[i].grade_id,
						'order': {$gte: links[i].order}
					}, {
						$inc: {'order': 1}
					}, {
						multi: true
					}, function (err, result) {
						if (err) {
							console.log('Failed to save chapter.');
							console.log(err.message);
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Chapter was not saved. Please try again later.'
							});
						} else {
						}
					});
				}
				cb(null, chapter_id);
			},
			function(chapter_id, cb) {
				var len = links.length;
				for (var i = 0; i < len; i++) {				
					linkSchema = {
						'kind': 'chapter',
						'syllabus': links[i].syllabus_id,
						'grade': links[i].grade_id,
						'chapter': chapter_id,
						'order': links[i].order
					};

					LinkModel.create(linkSchema, function (err, link, result) {
						if (err) {
							console.log('Failed to save chapter.');
							console.log(err.message);
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Chapter was not saved. Please try again later.'
							});
						} else {
						}
					});
				}
				console.log('Succeeded to added chapter.');
				res.send({
					'status_code': 200,
					'message': 'Chapter was added successfully.'
				});
			}
			]);
		},
		renderChapterEditPage = function (req, res) {
			var resChapter = {
				'id': '',
				'title': '',
				'description': '',
				'image': '',
				'enabled': '',
				'order': 0
			};
			var chapter_id = '';
			if (req.query.id)
				chapter_id = req.query.id;

			var gradeNames = [];
			var chapterNames = [];

			async.waterfall([
			function(cb) {
				ChapterModel.findOne({'_id': chapter_id}, function(err, chapter) {
					if (err || !chapter) {
						console.log('Failed to get chapter.');
						res.redirect('admin/chapters');
					} else {
						var resChapter = {
							'id': chapter._id,
							'title': chapter.title,
							'description': chapter.description,
							'image': chapter.image,
							'enabled': chapter.enabled,
							'order': chapter.order
						};

						cb(null, resChapter);
					}
				});
			},
			function(resChapter, cb) {
				GradeModel.find({}, function(err, grades){
					if (err || !grades || grades.length <= 0) {
						console.log('Failed to get grade name list.');
						res.render('admin/chapters');
					} else {
						var len = grades.length;
						for (var i = 0; i < len; i++) {
							var grade = grades[i];
							gradeNames[grade._id] = grade.grade;
						}
						cb(null, resChapter);
					}
				});
			},
			function(resChapter, cb) {
				ChapterModel.find({}, function(err, chapters){
					if (err || !chapters || chapters.length <= 0) {
						console.log('Failed to get chapter name list.');
						res.render('admin/chapters');
					} else {
						var len = chapters.length;
						for (var i = 0; i < len; i++) {
							var chapter = chapters[i];
							chapterNames[chapter._id] = chapter.title;
						}
						cb(null, resChapter);
					}
				});
			},
			function(resChapter, cb) {
				SyllabusModel.find({
				}, {
					'title': 1,
					'order': 1
				}, {
					sort: {'order': 1}
				}, function(err, syllabuses){
					if (err || !syllabuses || syllabuses.length <= 0) {
						return res.render('admin/chapter', {'chapter': resChpater});
					} else {
						cb(null, resChapter, syllabuses);
					}
				});

			},
			function(resChapter, syllabuses, cb) {
				LinkModel.find({
					'kind': 'chapter',
					'chapter': chapter_id
				}, {
					'syllabus': 1,
					'grade': 1,
					'order': 1
				}, {
				}, function(err, links){
					if (err || !links || links.length <= 0) {
						return res.render('admin/chapter', {'chapter': resChapter, 'syllabuses': syllabuses});
					} else {
						cb(null, resChapter, syllabuses, links);
					}
				});
			},
			function(resChapter, syllabuses, links, cb) {
				var resLinks = [];
				var len = links.length;

				for (var i = 0; i < len; i++) {
					var linkInfo = links[i];
					var exGrades = [];
					var exChapters = [];

					getGradeLink (linkInfo.syllabus, null, gradeNames, exGrades);
					getChapterLink (linkInfo.syllabus, linkInfo.grade, chapter_id, chapterNames, exChapters);

					if (exGrades && exChapters) {
						resLinks.push({
							'linkInfo': linkInfo,
							'exGrades': exGrades,
							'exChapters': exChapters
						});
					}
				}
				cb(null, resChapter, syllabuses, resLinks);
			},
			function(resChapter, syllabuses, links, cb) {
				res.render('admin/chapter', {'chapter': resChapter, 'syllabuses': syllabuses, 'links': links});
			}
			]);
		},
		/*
		 * param: title
		 *        grade
		 *        description
		 *        image
		 */
		editChapter = function (req, res) {
			if (!req.param('title') || req.param('title') == '') {
				console.log('Failed to save chapter');
				res.send({
					'status_code': 400,
					'message': 'Please enter the title.'
				});
			}

			var chapter_id = '';
			var rootPath = __dirname.substring(0, __dirname.lastIndexOf('/'));
			var tmpImagePath = '';
			var imagePath = '';
			var image = '';
			var schema = {
				'title': req.param('title'),
				'enabled': 'true',
				'udpated_date': new Date()
			};

			var links = [];
			var syllabuses = req.param('syllabuses');
			if (!syllabuses)
				syllabuses = [];
			else if (syllabuses.constructor != Array)
				syllabuses = [syllabuses];

			var grades = req.param('grades');
			if (!grades)
				grades = [];
			else if (grades.constructor != Array)
				grades = [grades];

			var orders = req.param('orders');
			if (!orders)
				orders = [];
			else if (orders.constructor != Array)
				orders = [orders];

			for (var i = 0; i < syllabuses.length; i++) {
				links.push({
					'syllabus_id': syllabuses[i],
					'grade_id': grades[i],
					'order': orders[i]
				});
			}

			if (req.param('enable') === 'on')
				schema.enabled = 'true';
			else
				schema.enabled = 'false';

			if (req.param('description'))
				schema.description = req.param('description');

			if (req.param('image-removed') == 'removed')
				schema.image = '';

			if (req.param('image'))
				image = req.param('image');

			if (req.query.id)
				chapter_id = req.query.id;

			for (var field in req.files) {
				if (req.param('image-removed') == 'removed'
					|| req.files[field].originalFilename == ''
					|| req.files[field].size == 0 
					|| imagePath != '')
				{
					if (fs.existsSync(req.files[field].path))
						fs.unlinkSync(req.files[field].path);
					continue;
				}
					
				var filename = req.files[field].originalFilename;
				var ext = filename.substring(filename.lastIndexOf('.'));
				imagePath = rootPath + '/files/imgs/chapter-' + chapter_id + ext;
				schema.image = '/imgs/chapter-' + chapter_id + ext;
				tmpImagePath = req.files[field].path;
			}

			async.waterfall([
			function(cb) {
				ChapterModel.findOne({'_id': chapter_id}, function(err, chapter) {
					if (err) {
						if (fs.existsSync(tmpImagePath))
							fs.unlinkSync(tmpImagePath);

						console.log('Failed to save chapter.');
						res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Chapter was not saved. Please try again later.'
						});
					} else {
						cb(null);
					}
				});
			},
			function(cb) {
				var len = links.length;
				for (var i = 0; i < len; i++) {
					for (var j = i+1; j < len; j++) {
						if (links[i].syllabus_id === links[j].syllabus_id &&
								links[i].grade_id === links[j].grade_id) {
							console.log('Failed to save grade. Check error: duplicate link!');
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Please check duplicated links and try again.'
							});
						}
					}
				}
				cb(null);
			},
			function(cb) {
				LinkModel.remove({'kind':'chapter', 'chapter':chapter_id}, null);
				cb(null);
			},
			function(cb) {
				var len = links.length;
				for (var i = 0; i < len; i++) {				

					LinkModel.update({
						'kind': 'chapter',
						'syllabus': links[i].syllabus_id,
						'grade': links[i].grade_id,
						'order': {$gte: links[i].order}
					}, {
						$inc: {'order': 1}
					}, {
						multi: true
					}, function (err, result) {
						if (err) {
							console.log('Failed to save chapter.');
							console.log(err.message);
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Chapter was not saved. Please try again later.'
							});
						} else {
						}
					});
				}
				cb(null);
			},
			function(cb) {
				var len = links.length;
				for (var i = 0; i < len; i++) {				
					linkSchema = {
						'kind': 'chapter',
						'syllabus': links[i].syllabus_id,
						'grade': links[i].grade_id,
						'chapter': chapter_id,
						'order': links[i].order
					};

					LinkModel.create(linkSchema, function (err, link, result) {
						if (err) {
							console.log('Failed to save chapter.');
							console.log(err.message);
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Chapter was not saved. Please try again later.'
							});
						} else {
						}
					});
				}
				cb(null);
			},
			function(cb) {
				ChapterModel.update({'_id': chapter_id}, schema, function(err, result) {
					if (err) {
						if (fs.existsSync(tmpImagePath))
							fs.unlinkSync(tmpImagePath);

						console.log(err);
						res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Chapter was not saved. Please try again later.'
						});
					} else {
						if (req.param('image-removed') == 'removed') {
							if (image != '' && fs.existsSync(rootPath + '/files' + image))
								fs.unlinkSync(rootPath + '/files' + image);
						}

						if (imagePath != '') {
							if (image != '' && fs.existsSync(rootPath + '/files' + image))
								fs.unlinkSync(rootPath + '/files' + image);

							if (fs.existsSync(tmpImagePath))
								fs.renameSync(tmpImagePath, imagePath);
						}

						console.log('Succeeded to save chapter.');
						return res.send({
							'status_code': 200,
							'message': 'Chapter was saved successfully.'
						});
					}
				});
			}
			]);
		},
		deleteChapter = function (req, res) {
			var chapterId = req.param('chapter');

			async.waterfall([
			function(cb) {
				ChapterModel.remove({'_id': chapterId}, function(err, result) {
					cb(null);
				})
			},
			function(cb) {
				LinkModel.remove({'chapter': chapterId}, function(err, result) {
					cb(null);
				})
			},
			function(cb) {
				console.log('Succeeded to delete Chapter.');
				res.send({
					'status_code': 200,
					'message': 'Chapter was deleted successfully.'
				});
			}
			]);
		},
		getChapterLink = function(syllabusId, gradeId, notChapterId, chapterNames, retChapters) {
			var query;
		
			if (!notChapterId) {
				query = {
					'kind': 'chapter',
					'syllabus': syllabusId,
					'grade': gradeId
				};
			} else {
				query = {
					'kind': 'chapter',
					'syllabus': syllabusId,
					'grade': gradeId,
					'chapter': notChapterId//{$ne: notChapterId}
				};
			}
			LinkModel.find(
				query,
			{
				'chapter': 1,
				'order': 1
			}, {
				sort: {'order': 1}
			}, function(err, links){
				if (err || !links ) {
					console.log(err.message);
					retChapters = null;
					return;
				} else {
					for (var i = 0; i < links.length; i++) {
						link = links[i];
						retChapters.push({
							'chapter_id': link.chapter,
							'chapter_title': chapterNames[link.chapter],
							'order': link.order
						});
					}
				}
			});
		},

		/*
		 *
		 * Concept Controller
		 *
		 * */

		renderConceptsPage = function (req, res) {
			async.waterfall([
				function(cb) {
					SyllabusModel.find({
					}, {
						'title': 1,
						'order': 1
					}, {
						sort: {'order': 1}
					}, function(err, syllabuses){
						if (err || !syllabuses || syllabuses.length <= 0) {
							console.log('Failed to get concepts.');
							return res.render('admin/concepts');
						} else {
							//cb(null, syllabuses);
							console.log('Succeeded to get chapters.');
							res.render('admin/concepts', {'syllabuses': syllabuses});
						}
					});
		
				}/*
				function(cb) {
					GradeModel.find({}, function(err, grades){
						if (err || !grades || grades.length <= 0) {
							console.log('Failed to get concepts.');
							res.render('admin/concepts');
						} else {
							var len = grades.length;
							var gradeNames = [];

							for (var i = 0; i < len; i++) {
								var grade = grades[i];
								gradeNames[grade._id] = grade.grade;
							}

							cb(null, gradeNames);
						}
					});
				},
				function(gradeNames, cb) {
					ChapterModel.find({}, function(err, chapters){
						if (err || !chapters || chapters.length <= 0) {
							console.log('Failed to get concepts.');
							res.render('admin/concepts');
						} else {
							var len = chapters.length;
							var chapterNames = [];

							for (var i = 0; i < len; i++) {
								var chapter = chapters[i];
								chapterNames[chapter._id] = chapter.title;
							}

							cb(null, gradeNames, chapterNames);
						}
					});
				},
				function(gradeNames, chapterNames, cb) {
					ConceptModel.find({}, {}, {
						sort: {'grade_order': 1, 'chapter_order': 1, 'order': 1}
					}, function(err, concepts){
						if (err || !concepts || concepts.length <= 0) {
							console.log('Failed to get concepts.');
							res.render('admin/concepts')
						} else {
							var len = concepts.length;
							var resConcepts = [];

							for (var i = 0; i < len; i++) {
								var concept = concepts[i];
								resConcepts.push({
									'id': concept._id,
									'title': concept.title,
									'enabled': concept.enabled,
									'grade': gradeNames[concept.grade],
									'chapter': chapterNames[concept.chapter],
								});
							}

							console.log('Succeeded to get concepts.');
							res.render('admin/concepts', {'concepts': resConcepts});
						}
					});
				}*/
			]);
		},
		renderConceptNewPage = function (req, res) {
			var concept = {
				'id': '',
				'title': '',
				'text': '',
				'image': '',
				'image_source': '',
				'image_credit': '',
				'image2': '',
				'image2_source': '',
				'image2_credit': '',
				'enabled': 'true',
				'order': 0
			};

			var param = {'concept': concept};

			async.waterfall([
			function(cb) {
				SyllabusModel.find({}, {'title':1, 'order': 1}, {sort: {'order': 1}}, function(err, syllabuses){
					if (!err && syllabuses && syllabuses.length > 0 )
						param.syllabuses = syllabuses;

					res.render('admin/concept', param);
				});
			}
			]);
		},
		/*
		 * param: title
		 *        grade
		 *        chapter
		 *        text
		 *        videos
		 *        references
		 *        images
		 *        image-sources
		 *        credits
		 */
		newConcept = function (req, res) {
			if (!req.param('title') || req.param('title') == '') {
				console.log('Failed to add concept');
				return res.send({
					'status_code': 400,
					'message': 'Please enter the title.'
				});
			}

			var schema = {
				'title': req.param('title'),
				'enabled': 'true',
				'order': req.param('order')
			};

			var links = [];
			var syllabuses = req.param('syllabuses');
			if (!syllabuses)
				syllabuses = [];
			else if (syllabuses.constructor != Array)
				syllabuses = [syllabuses];

			var grades = req.param('grades');
			if (!grades)
				grades = [];
			else if (grades.constructor != Array)
				grades = [grades];

			var chapters = req.param('chapters');
			if (!chapters)
				chapters = [];
			else if (chapters.constructor != Array)
				chapters = [chapters];

			var orders = req.param('orders');
			if (!orders)
				orders = [];
			else if (orders.constructor != Array)
				orders = [orders];

			for (var i = 0; i < syllabuses.length; i++) {
				links.push({
					'syllabus_id': syllabuses[i],
					'grade_id': grades[i],
					'chapter_id': chapters[i],
					'order': orders[i]
				});
			}

			if (req.param('enable') === 'on')
				schema.enabled = 'true';
			else
				schema.enabled = 'false';

			if (req.param('text'))
				schema.text = req.param('text');

			if (req.param('image')) {
				schema.image = req.param('image');
				schema.image_url = req.param('image');
			}

			if (req.param('image_sources'))
				schema.image_source = req.param('image_sources');

			if (req.param('image_credits'))
				schema.image_credit = req.param('image_credits');

			if (req.param('image2')) {
				schema.image2 = req.param('image2');
				schema.image2_url = req.param('image2');
			}

			if (req.param('image2_sources'))
				schema.image2_source = req.param('image2_sources');

			if (req.param('image2_credits'))
				schema.image2_credit = req.param('image2_credits');

			async.waterfall([
			function(cb) {
				var len = links.length;
				for (var i = 0; i < len; i++) {
					for (var j = i+1; j < len; j++) {
						if (links[i].syllabus_id === links[j].syllabus_id &&
								links[i].grade_id === links[j].grade_id &&
								links[i].chapter_id === links[j].chapter_id) {
							console.log('Failed to save grade. Check error: duplicate link!');
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Please check duplicated links and try again.'
							});
						}
					}
				}
				cb(null);
			},
			function(cb) {
				ConceptModel.create(schema, function (err, concept, result) {
					if (err) {
						console.log(err);
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Concept was not added. Please try again later.'
						});
					}

					// add video contents
					var default_video = '';
					if (req.param('default_video'));
						default_video = getYoutubeEmbedUrl(req.param('default_video'));

					var videos = req.param('videos');
					if (!videos)
						videos = [];
					else if (videos.constructor != Array)
						videos = [videos];

					var videos_enabled = req.param('videos_enables');
					if (!videos_enabled)
						videos_enabled = [];
					else if (videos_enabled.constructor != Array)
						videos_enabled = [videos_enabled];

					var len = videos.length;
					for (var i = 0; i < len; i++) {
						if (videos[i] == '')
							continue;

						var url = getYoutubeEmbedUrl(videos[i]);
						if (url == '')
							continue;

						var defaulted_admin = 'false';
						if (default_video == url) {
							defaulted_admin = 'true';
							default_video = '';
						}

						var video_enabled = 'true';
						if (videos_enabled[i] == 'on')
							video_enabled = 'true';
						else
							video_enabled = 'false';

						var videoSchema = {
							url: url,
							concept: concept._id,
							enabled: video_enabled,
							defaulted_admin: defaulted_admin
						};

						VideoModel.create(videoSchema, function(error1, video, result1) {
							if (error1)
								console.log(error1);
						});
					}

					// add refernce contents
					var default_reference = '';
					if (req.param('default_reference'))
						default_reference = req.param('default_reference');

					var len = req.newRefs.length;
					var refs_enabled = req.param('refs_enables');
					if (!refs_enabled)
						refs_enabled = [];
					else if (refs_enabled.constructor != Array)
						refs_enabled = [refs_enabled];
					for (var i = 0; i < len; i++) {
						var defaulted_admin = 'false';
						if (default_reference == req.newRefs[i].url) {
							defaulted_admin = 'true';
							default_reference = '';
						}

						var ref_enabled = 'true';
						if (refs_enabled[i] == 'on')
							ref_enabled = 'true';
						else
							ref_enabled = 'false';

						var referenceSchema = {
							url: req.newRefs[i].url,
							title: req.newRefs[i].title,
							description: req.newRefs[i].description,
							image: req.newRefs[i].image,
							concept: concept._id,
							enabled: ref_enabled,
							defaulted_admin: defaulted_admin
						};

						ReferenceModel.create(referenceSchema, function(error1, reference, result1) {
							if (error1)
								console.log(error1);
						});
					}

					downloadConceptImage(concept._id, concept.image_url, function(){
						downloadConceptImage2(concept._id, concept.image2_url, function(){
							cb(null, concept._id);
						});
					});
				});
			},
			function(concept_id, cb) {
				var len = links.length;
				for (var i = 0; i < len; i++) {				

					LinkModel.update({
						'kind': 'concept',
						'syllabus': links[i].syllabus_id,
						'grade': links[i].grade_id,
						'chapter': links[i].chapter_id,
						'order': {$gte: links[i].order}
					}, {
						$inc: {'order': 1}
					}, {
						multi: true
					}, function (err, result) {
						if (err) {
							console.log('Failed to save concept.');
							console.log(err.message);
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Concept was not saved. Please try again later.'
							});
						} else {
						}
					});
				}

				cb(null, concept_id);
			},
			function(concept_id, cb) {
				var len = links.length;
				for (var i = 0; i < len; i++) {				
					linkSchema = {
						'kind': 'concept',
						'syllabus': links[i].syllabus_id,
						'grade': links[i].grade_id,
						'chapter': links[i].chapter_id,
						'concept': concept_id,
						'order': links[i].order
					};

					LinkModel.create(linkSchema, function (err, link, result) {
						if (err) {
							console.log('Failed to save concept.');
							console.log(err.message);
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Concept was not saved. Please try again later.'
							});
						} else {
						}
					});
				}

				console.log('Succeeded to added concept.');
				res.send({
					'status_code': 200,
					'message': 'Chapter was added successfully.'
				});
			}
			]);
		},
		renderConceptEditPage = function (req, res) {
			var param = {};
			var concept_id = '';
			if (req.query.id)
				concept_id = req.query.id;

			var gradeNames = [];
			var chapterNames = [];
			var conceptNames = [];

			async.waterfall([
			function(cb) {
				ConceptModel.findOne({'_id': concept_id}, function(err, concept) {
					if (err || !concept) {
						console.log('Failed to get concept');
						return res.render('admin/concepts');
					}

					param.concept = {
						'id': concept._id,
						'title': concept.title,
						'grade': concept.grade,
						'chapter': concept.chapter,
						'text': concept.text,
						'image': concept.image_url,
						'image_source': concept.image_source,
						'image_credit': concept.image_credit,
						'image2': concept.image2_url,
						'image2_source': concept.image2_source,
						'image2_credit': concept.image2_credit,
						'enabled': concept.enabled,
						'order': concept.order
					};

					cb(null);
				});
			},
			function(cb) {
				VideoModel.find({'concept': concept_id/*, 'owner': 'admin'*/}, function(err, videos) {
					if (!err && videos && videos.length > 0) {
						var resVideos = [];
						var len = videos.length;
						for (var i = 0; i < len; i++) {
							var url = 'https://www.youtube.com/watch?v=' + videos[i].url;
							resVideos.push({
								'url': url,
								'defaulted_admin': videos[i].defaulted_admin,
								'enabled': videos[i].enabled
							});
						}

						param.videos = resVideos;
					}

					cb(null);
				});
			},
			function(cb) {
				ReferenceModel.find({'concept': concept_id/*, 'owner': 'admin'*/}, function(err, references) {
					if (!err && references && references.length > 0) {
						var resReferences = [];
						var len = references.length;
						for (var i = 0; i < len; i++) {
							resReferences.push({
								'url': references[i].url,
								'defaulted_admin': references[i].defaulted_admin,
								'enabled': references[i].enabled
							});
						}

						param.references = resReferences;
					}

					cb(null);
				});
			},
			function(cb) {
				GradeModel.find({}, function(err, grades){
					if (err || !grades || grades.length <= 0) {
						console.log('Failed to get grade name list.');
						//res.render('admin/concepts');
						cb(null);
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
				ChapterModel.find({}, function(err, chapters){
					if (err || !chapters || chapters.length <= 0) {
						console.log('Failed to get chapter name list.');
						//res.render('admin/concepts');
						cb(null);
					} else {
						var len = chapters.length;
						for (var i = 0; i < len; i++) {
							var chapter = chapters[i];
							chapterNames[chapter._id] = chapter.title;
						}
						cb(null);
					}
				});
			},
			function(cb) {
				ConceptModel.find({}, function(err, concepts){
					if (err || !concepts || concepts.length <= 0) {
						console.log('Failed to get concpets name list.');
						//res.render('admin/concepts');
						cb(null);
					} else {
						var len = concepts.length;
						for (var i = 0; i < len; i++) {
							var concept = concepts[i];
							conceptNames[concept._id] = concept.title;
						}
						cb(null);
					}
				});
			},
			function(cb) {
				SyllabusModel.find({
				}, {
					'title': 1,
					'order': 1
				}, {
					sort: {'order': 1}
				}, function(err, syllabuses){
					if (err || !syllabuses || syllabuses.length <= 0) {
						return res.render('admin/concept', param);
					} else {
						param.syllabuses = syllabuses;
						cb(null);
					}
				});
			},
			function(cb) {
				LinkModel.find({
					'kind': 'concept',
					'concept': concept_id
				}, {
					'syllabus': 1,
					'grade': 1,
					'chapter': 1,
					'order': 1
				}, {
				}, function(err, links){
					if (err || !links || links.length <= 0) {
						return res.render('admin/concept', param);
					} else {
						cb(null, links);
					}
				});
			},
			function(links, cb) {
				var len = links.length;
				var resLinks = [];

				for (var i = 0; i < len; i++) {
					var linkInfo = links[i];
					var exGrades = [];
					var exChapters = [];
					var exConcepts = [];

					getGradeLink (linkInfo.syllabus, null, gradeNames, exGrades);
					getChapterLink (linkInfo.syllabus, linkInfo.grade, null, chapterNames, exChapters);
					getConceptLink (linkInfo.syllabus, linkInfo.grade, linkInfo.chapter, concept_id, conceptNames, exConcepts);

					if (exGrades && exChapters && exConcepts) {
						resLinks.push({
							'linkInfo': linkInfo,
							'exGrades': exGrades,
							'exChapters': exChapters,
							'exConcepts': exConcepts
						});
					}
				}
				cb(null, resLinks);
			},
			function(links, cb) {
				param.links = links;
				res.render('admin/concept', param);
			}
			]);
		},
		/*
		 * param: title
		 *        grade
		 *        chapter
		 *        text
		 */
		editConcept = function (req, res) {
			if (!req.param('title') || req.param('title') == '') {
				console.log('Failed to save chapter');
				res.send({
					'status_code': 400,
					'message': 'Please enter the title.'
				});
			}

			var concept_id = '';
			var schema = {
				'title': req.param('title'),
				'enabled': 'true',
				'updated_date': new Date()
			};

			var links = [];
			var syllabuses = req.param('syllabuses');
			if (!syllabuses)
				syllabuses = [];
			else if (syllabuses.constructor != Array)
				syllabuses = [syllabuses];

			var grades = req.param('grades');
			if (!grades)
				grades = [];
			else if (grades.constructor != Array)
				grades = [grades];

			var chapters = req.param('chapters');
			if (!chapters)
				chapters = [];
			else if (chapters.constructor != Array)
				chapters = [chapters];

			var orders = req.param('orders');
			if (!orders)
				orders = [];
			else if (orders.constructor != Array)
				orders = [orders];

			for (var i = 0; i < syllabuses.length; i++) {
				links.push({
					'syllabus_id': syllabuses[i],
					'grade_id': grades[i],
					'chapter_id': chapters[i],
					'order': orders[i]
				});
			}

			if (req.param('enable') === 'on')
				schema.enabled = 'true';
			else
				schema.enabled = 'false';

			var new_default_video = '';
			if (req.param('default_video'))
				new_default_video = getYoutubeEmbedUrl(req.param('default_video'));

			var new_default_reference = '';
			if (req.param('default_reference'))
				new_default_reference = req.param('default_reference');

			if (req.param('text'))
				schema.text = req.param('text');

			if (req.param('image')) {
				schema.image = req.param('image');
				schema.image_url = req.param('image');
			}

			if (req.param('image_sources'))
				schema.image_source = req.param('image_sources');

			if (req.param('image_credits'))
				schema.image_credit = req.param('image_credits');

			if (req.param('image2')) {
				schema.image2 = req.param('image2');
				schema.image2_url = req.param('image2');
			}

			if (req.param('image2_sources'))
				schema.image2_source = req.param('image2_sources');

			if (req.param('image2_credits'))
				schema.image2_credit = req.param('image2_credits');

			if (req.query.id)
				concept_id = req.query.id;

			async.waterfall([
			function(cb) {
				ConceptModel.findOne({
					'_id': concept_id
				}, {
					'chapter': 1,
					'image': 1,
					'image2': 1,
					'order': 1
				}, function(err, concept) {
					if (err || !concept) {
						console.log('Failed to save concept');
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Concept was not saved. Please try again later.'
						});
					}

					var path = __dirname.substring(0, __dirname.lastIndexOf('/')) + '/files' + concept.image;
					if (concept.image != '' && fs.existsSync(path))
						fs.unlinkSync(path);

					var path2 = __dirname.substring(0, __dirname.lastIndexOf('/')) + '/files' + concept.image2;
					if (concept.image2 != '' && fs.existsSync(path2))
						fs.unlinkSync(path2);

					cb(null);
				});
			},
			function(cb) {
				var len = links.length;
				for (var i = 0; i < len; i++) {
					for (var j = i+1; j < len; j++) {
						if (links[i].syllabus_id === links[j].syllabus_id &&
								links[i].grade_id === links[j].grade_id &&
								links[i].chapter_id === links[j].chapter_id) {
							console.log('Failed to save grade. Check error: duplicate link!');
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Please check duplicated links and try again.'
							});
						}
					}
				}
				cb(null);
			},
			function(cb) {
				LinkModel.remove({'kind':'concept', 'concept':concept_id}, null);
				cb(null);
			},
			function(cb) {
				var len = links.length;
				for (var i = 0; i < len; i++) {				

					LinkModel.update({
						'kind': 'concept',
						'syllabus': links[i].syllabus_id,
						'grade': links[i].grade_id,
						'chapter': links[i].chapter_id,
						'order': {$gte: links[i].order}
					}, {
						$inc: {'order': 1}
					}, {
						multi: true
					}, function (err, result) {
						if (err) {
							console.log('Failed to save concept.');
							console.log(err.message);
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Concept was not saved. Please try again later.'
							});
						} else {
						}
					});
				}

				cb(null);
			},
			function(cb) {
				var len = links.length;
				for (var i = 0; i < len; i++) {				
					linkSchema = {
						'kind': 'concept',
						'syllabus': links[i].syllabus_id,
						'grade': links[i].grade_id,
						'chapter': links[i].chapter_id,
						'concept': concept_id,
						'order': links[i].order
					};

					LinkModel.create(linkSchema, function (err, link, result) {
						if (err) {
							console.log('Failed to save concept.');
							console.log(err.message);
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Concept was not saved. Please try again later.'
							});
						} else {
						}
					});
				}
				cb(null);
			},
			function(cb) {
				ConceptModel.update({'_id': concept_id}, schema, function(err, result) {
					if (err) {
						console.log(err);
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Concept was not saved. Please try again later.'
						});
					}

					cb(null);
				});
			},
			function(cb) {
				downloadConceptImage(concept_id, schema.image_url, function(){
					cb(null);
				});
			},
			function(cb) {
				downloadConceptImage2(concept_id, schema.image2_url, function(){
					cb(null);
				});
			},
			function(cb) {
				var urls = [];

				var new_videos = req.param('videos');
				if (!new_videos)
					new_videos = [];
				else if (new_videos.constructor != Array)
					new_videos = [new_videos];

				var videos_enabled = req.param('videos_enables');
				if (!videos_enabled)
					videos_enabled = [];
				else if (videos_enabled.constructor != Array)
					videos_enabled = [videos_enabled];

				var len = new_videos.length;
				for (var i = 0; i < len; i++) {
					if (new_videos[i] == '')
						continue;

					var url = getYoutubeEmbedUrl(new_videos[i]);
					if (url == '')
						continue;

					urls.push(url);
				}

				VideoModel.find({
					'concept': concept_id/*,
					'owner': 'admin'*/,
				}, function(err, videos) {
					var remove_ids = [];
					var exist_ids = [];
					var new_default_id = '';

					if (!err && videos) {
						var old_len = videos.length;
						var new_len = urls.length;
						var remove_ids = [];
						for (var i = 0; i < old_len; i++) {
							var video = videos[i];
							var isKeep = false;

							for (var j = 0; j < new_len; j++) {
								if (video.url == urls[j]) {
									isKeep = true;
									urls[j] = '';
									var video_enabled = 'true';

									if (videos_enabled[j] === 'on')
										video_enabled = 'true';
									else
										video_enabled = 'false';
									exist_ids.push({
										_id: video._id,
										enabled: video_enabled
									});

									break;
								}
							}

							if (isKeep == false)
								remove_ids.push(video._id);
							else if (new_default_video == video.url)
								new_default_id = video._id;
						}
					} else {
						urls = [];
					}

					console.log('new_def_id');
					console.log(new_default_id);
					console.log(exist_ids);

					cb(null, remove_ids, exist_ids, urls, new_default_id);
				});
			},
			function(remove_ids, exist_ids, urls, new_default_id, cb) {
				VideoModel.remove({'_id': {$in: remove_ids}}, function(err1, result) {
					cb(null, exist_ids, urls, new_default_id);
				});
			},
			function(exist_ids, urls, new_default_id, cb) {
				var len = exist_ids.length;
				for (var i = 0; i < len; i++) {
					VideoModel.update({
						'_id': exist_ids[i]._id
					}, {
						'enabled': exist_ids[i].enabled
					}, function(err, result) {
						if (err)
							console.log(err.message);
					});
				}
				
				cb(null, urls, new_default_id);
			},

			function(urls, new_default_id, cb) {
				VideoModel.update({
					'concept': concept_id/*,
					'owner': 'admin'*/
				}, {
					'defaulted_admin': 'false'
				}, {
					multi: true
				}, function(err, result) {
					cb(null, urls, new_default_id);
				});
			},
			function(urls, new_default_id, cb) {
				VideoModel.update({
					'_id': new_default_id
				}, {
					'defaulted_admin': 'true'
				}, function(err, result) {
					cb(null, urls, new_default_id);
				});
			},
			/*function(urls, new_default_id, cb) {
				VideoModel.update({
					'concept': concept_id
				}, {
					'grade': req.param('grade'),
					'chapter': req.param('chapter')
				}, function(err, result) {
					cb(null, urls, new_default_id);
				});
			},*/
			function(urls, new_default_id, cb) {

				var videos_enabled = req.param('videos_enable');

				if (typeof videos_enabled === 'undefined')
					videos_enabled = [];

				var len = urls.length;
				for (var i = 0; i < len; i++) {
					if (urls[i] == '')
						continue;

					var defaulted_admin = 'false';
					if (urls[i] == new_default_video && new_default_id == '') {
						defaulted_admin = 'true';
						new_default_video = '';
					}

					var video_enabled = 'true';
					if (videos_enabled[i] === 'on')
						video_enabled = 'true';
					else
						video_enabled = 'false';

					VideoModel.create({
						'url': urls[i],
						'concept': concept_id,
						'enabled': video_enabled,
						'defaulted_admin': defaulted_admin
					}, function(err, video, result) {
						if (err)
							console.log(err.message);
					});
				}

				cb(null);
			},
			function(cb) {
				ReferenceModel.find({
					'concept': concept_id,
				}, function(err, references) {
					if (err || !references || references.length <= 0) {
						cb(null, null);
					} else {

					var reference = references[0];
					cb(null, reference);
					}
				});
			},
			function(reference, cb) {
				if (reference) {
					var len = req.newRefs.length;
					if (len <= 0) {
						ReferenceModel.remove({'_id': reference._id}, function(err1, result) {
							cb(null);
						});
					} else {
						var url = req.newRefs[0].url;
						var refs_enabled = req.param('refs_enables');
						if (!refs_enabled)
							refs_enabled = [];
						else if (refs_enabled.constructor != Array)
							refs_enabled = [refs_enabled];

						var ref_enabled = 'true';
						if (refs_enabled[0] == 'on')
							ref_enabled = 'true';
						else
							ref_enabled = 'false';

						ReferenceModel.update({
							'_id': reference._id
							}, {
							'url': req.newRefs[0].url,
							'title': req.newRefs[0].title,
							'description': req.newRefs[0].description,
							'image': req.newRefs[0].image,
							'enabled': ref_enabled
							}, function(err, result) {
								cb(null);
							});
					}
				} else {
					var len = req.newRefs.length;
					if (len > 0) {
						var refs_enabled = req.param('refs_enables');
						if (!refs_enabled)
							refs_enabled = [];
						else if (refs_enabled.constructor != Array)
							refs_enabled = [refs_enabled];

							var ref_enabled = 'true';
							if (refs_enabled[0] == 'on')
								ref_enabled = 'true';
							else
								ref_enabled = 'false';
			
							var referenceSchema = {
								url: req.newRefs[0].url,
								title: req.newRefs[0].title,
								description: req.newRefs[0].description,
								image: req.newRefs[0].image,
								concept: concept_id,
								enabled: ref_enabled
							};
			
							ReferenceModel.create(referenceSchema, function(error1, reference, result1) {
								if (error1)
									console.log(error1);
								cb(null);
							});
					} else {
						cb(null);
					}
				}
			},
			function(cb) {
				console.log('Succeeded to save concept.');
				return res.send({
					'status_code': 200,
					'message': 'Concept was saved successfully.'
				});
			},
			function(cb) {
				NoteModel.update({
					'concept': concept_id
				}, {
					'grade': schema.grade,
					'chapter': req.param('chapter')
				}, {
					multi: true
				}, function(err, result) {
					console.log('Succeeded to save concept.');
					res.send({
						'status_code': 200,
						'message': 'Concept was saved successfully.'
					});
				});
			}]);
		},
		deleteConcept = function (req, res) {
			var conceptId = req.param('concept');

			async.waterfall([
			function(cb) {
				ConceptModel.remove({'_id': conceptId}, function(err, result) {
					cb(null);
				})
			},
			function(cb) {
				LinkModel.remove({'concept': conceptId}, function(err, result) {
					cb(null);
				})
			},
			function(cb) {
				VideoModel.remove({'concept': conceptId}, function(err, result) {
					cb(null);
				})
			},
			function(cb) {
				ReferenceModel.remove({'concept': conceptId}, function(err, result) {
					cb(null);
				})
			},
			function(cb) {
				NoteModel.remove({'concept': conceptId}, function(err, result) {
					cb(null);
				})
			},
			function(cb) {
				console.log('Succeeded to delete Concept.');
				res.send({
					'status_code': 200,
					'message': 'Concept was deleted successfully.'
				});
			}
			]);
		},
		downloadConceptImage = function(concept_id, url, callback) {

			if (!url || url =='') {
				if (callback)
					callback();

				return;
			}

			var name = url.substring(url.lastIndexOf('/') + 1);
			var pos = name.lastIndexOf('.');
			if (pos < 0) {
				if (callback)
					callback();

				return;
			}

			var ext = name.substring(pos).toLowerCase();
			if ((ext.length != 4 && ext.length != 5) || ext == '.svg' ) {
				if (callback)
					callback();

				return;
			}

			var image = '/imgs/concept-' + concept_id + ext;
			var tmp_path = __dirname.substring(0, __dirname.lastIndexOf('/')) + '/tmp/concept-' + concept_id + ext;
			var image_path = __dirname.substring(0, __dirname.lastIndexOf('/')) + '/files' + image;

			logger.trace(url);
			async.waterfall([
			function(cb) {
			logger.trace(url);
				request.get({
						uri : url,
						method: "GET",
						timeout: 20000
						})
					   .on('error', function(err) {
							logger.trace(err);
					   		console.log(err);
							if (callback)
								callback();

							return;
					   })
					   .pipe(fs.createWriteStream(tmp_path))
					   .on('close', function() {
							if (fs.existsSync(tmp_path)) {
							logger.trace('onClose');
								cb(null);
							}
							else {
								if (callback)
									callback();
							}
						});
			},
			function(cb) {
			logger.trace(url);
				im.resize({
					srcPath: tmp_path,
					dstPath: image_path,
					width: 350
				}, function(err, stdout, stderr) {
					if (fs.existsSync(tmp_path))
						fs.unlinkSync(tmp_path);

					if (err) {	
						if (callback)
							callback();
					} else {
						cb(null);
					}
				});
			},
			function(cb) {
				ConceptModel.update({'_id': concept_id}, {'image': image}, function(err, result) {
					if (callback)
						callback();
				});
			}]);
		},
		downloadConceptImage2 = function(concept_id, url, callback) {
			logger.trace(url);
			if (!url || url =='') {
				if (callback)
					callback();

				return;
			}

			var name = url.substring(url.lastIndexOf('/') + 1);
			var pos = name.lastIndexOf('.');
			if (pos < 0) {
				if (callback)
					callback();

				return;
			}

			var ext = name.substring(pos).toLowerCase();
			if ((ext.length != 4 && ext.length != 5) || ext == '.svg' ) {
				if (callback)
					callback();

				return;
			}

			var image = '/imgs/concept-' + concept_id + '-2nd' + ext;
			var tmp_path = __dirname.substring(0, __dirname.lastIndexOf('/')) + '/tmp/concept-' + concept_id + '-2nd' + ext;
			var image_path = __dirname.substring(0, __dirname.lastIndexOf('/')) + '/files' + image;

			logger.trace(url);
			async.waterfall([
			function(cb) {
				request.get({
						uri : url,
						method: "GET",
						timeout: 20000
						})
					   .on('error', function(err) {
					   		console.log(err);
							logger.trace(err);
							if (callback)
								callback();

							return;
					   })
					   .pipe(fs.createWriteStream(tmp_path))
					   .on('close', function() {
							if (fs.existsSync(tmp_path)) {
								logger.trace('onClose');
								cb(null);
							} else {
								if (callback)
									callback();
							}
						});
			},
			function(cb) {
				im.resize({
					srcPath: tmp_path,
					dstPath: image_path,
					width: 350
				}, function(err, stdout, stderr) {
					if (fs.existsSync(tmp_path))
						fs.unlinkSync(tmp_path);

					if (err) {	
						if (callback)
							callback();
					} else {
						cb(null);
					}
				});
			},
			function(cb) {
				ConceptModel.update({'_id': concept_id}, {'image2': image}, function(err, result) {
					if (callback)
						callback();
				});
			}]);
		},
		getConceptLink = function(syllabusId, gradeId, chapterId, notConceptId, conceptNames, retConcepts) {
			var query;
		
			if (!notConceptId) {
				query = {
					'kind': 'concept',
					'syllabus': syllabusId,
					'grade': gradeId,
					'chapter': chapterId
				};
			} else {
				query = {
					'kind': 'concept',
					'syllabus': syllabusId,
					'grade': gradeId,
					'chapter': chapterId,
					'concept': notConceptId//{$ne: notConceptId}
				};
			}
			console.log('Query:' + query);
			LinkModel.find(
				query,
			{
				'concept': 1,
				'order': 1
			}, {
				sort: {'order': 1}
			}, function(err, links){
				if (err || !links ) {
					console.log(err.message);
					retConcepts = null;
					return;
				} else {
					for (var i = 0; i < links.length; i++) {
						link = links[i];
						retConcepts.push({
							'concept_id': link.concept,
							'concept_title': conceptNames[link.concept],
							'order': link.order
						});
					}
				}
			});
		},
		
		/*
		 *
		 * Reference Controller
		 *
		 * */

		getDataFromRefUrls = function(req, res, next) {
			req.newRefs = [];
			req.completedRefs = 0;
			var references = req.param('references');
			if (references.constructor === Array) {
				var len = references.length;
				for (var i = 0; i < len; i++) {
					if (references[i] == '')
						continue;

					req.newRefs.push({
						'url': references[i],
						'title': '',
						'description': '',
						'image': ''
					});
				}
			} else if (references != ''){
				req.newRefs.push({
					'url': references,
					'title': '',
					'description': '',
					'image': ''
				});
			}

			var len = req.newRefs.length;
			if (len <= 0)
				next();

			for (var i = 0; i < len; i++)
				getDataFromRefUrl(req, res, next, i, len);
		},
		getDataFromRefUrl = function(req, res, next, index, total) {
			var url = req.newRefs[index].url;
			if (url.indexOf('//') === 0)
				url = 'http:' + url;
			else if (url.indexOf('http://') != 0 &&
					 url.indexOf('https://') != 0)
				url = 'http://' + url;

			logger.trace(url);
			var start = url.indexOf('//') + 2;
			var end = url.indexOf('/', start);
			var domain = url.substring(0, end);

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
							req.newRefs[index].description = utils.trim(attribs.content);
					}else if (name === 'meta' && 
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
						req.newRefs[index].title = utils.trim(text);
						title_flag = 'false';
					}
				},
				onclosetag: function(name){
					if(name.toLowerCase() === 'title'){
						title_flag = 'false';
					}
				}
			});

			logger.trace(url);
			request({
				uri: url,
				method: "GET",
				timeout: 10000
			}, function(err, response, body){
			logger.trace(err);
				if (err)
					console.log(err);
				if (!err) {
					var contentType = response.headers['content-type'];
					charset = contentType.substring(contentType.indexOf('charset=') + 8);

					parser.write(body);
					parser.end();
					
					if (fluid_icon != '')
						req.newRefs[index].image = fluid_icon;
					else
						req.newRefs[index].image = shortcut_icon;

					if (req.newRefs[index].image == '')
						req.newRefs[index].image = '/images/reference.png';
					else if (req.newRefs[index].image.indexOf('//') == 0)
						req.newRefs[index].image = 'http:' + req.newRefs[index].image;
					else if (req.newRefs[index].image.indexOf('http') != 0)
						req.newRefs[index].image = domain + req.newRefs[index].image;
				}

				req.completedRefs++;
				if (req.completedRefs >= total){
					next();
				}
			});
		},

		/*
		 *
		 * Video Controller
		 *
		 * */

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
		 *
		 * Test Controller
		 *
		 * */
		
		renderTestsPage = function (req, res) {
			async.waterfall([
			function(cb) {
				SyllabusModel.find({
				}, {
					'title': 1,
					'order': 1
				}, {
					sort: {'order': 1}
				}, function(err, syllabuses){
					if (err || !syllabuses || syllabuses.length <= 0) {
						console.log('Failed to get Tests.');
						return res.render('admin/tests');
					} else {
						//cb(null, syllabuses);
						console.log('Succeeded to get Tests.');
						res.render('admin/tests', {'syllabuses': syllabuses});
					}
				});
			}
			]);
		},
		renderTestNewPage = function (req, res) {
			var test = {
				'id': '',
				'question': '',
				'option1': '',
				'option2': '',
				'option3': '',
				'option4': '',
				'answer': '',
				'enabled': 'true',
				'order': 0
			}
			var param = {'test': test};

			async.waterfall([
			function(cb) {
				SyllabusModel.find({}, {'title':1, 'order': 1}, {sort: {'order': 1}}, function(err, syllabuses){
					if (!err && syllabuses && syllabuses.length > 0 )
						param.syllabuses = syllabuses;

					res.render('admin/test', param);
				});
			}
			]);
		},
		
		newTest = function (req, res) {
			if (!req.param('question') || req.param('question') == '') {
				console.log('Failed to add Questions');
				res.send({
					'status_code': 400,
					'message': 'Please enter the question.'
				});
			}

			var schema = {
				'question': req.param('question'),
				'order': req.param('order'),
				'enabled': 'true'
			};
			
			var links = [];
			var syllabuses = req.param('syllabuses');
			if (!syllabuses)
				syllabuses = [];
			else if (syllabuses.constructor != Array)
				syllabuses = [syllabuses];

			var grades = req.param('grades');
			if (!grades)
				grades = [];
			else if (grades.constructor != Array)
				grades = [grades];

			var chapters = req.param('chapters');
			if (!chapters)
				chapters = [];
			else if (chapters.constructor != Array)
				chapters = [chapters];
			
			var concepts = req.param('concepts');
			if (!concepts)
				concepts = [];
			else if (concepts.constructor != Array)
				concepts = [concepts];

			var orders = req.param('orders');
			if (!orders)
				orders = [];
			else if (orders.constructor != Array)
				orders = [orders];

			for (var i = 0; i < syllabuses.length; i++) {
				links.push({
					'syllabus_id': syllabuses[i],
					'grade_id': grades[i],
					'chapter_id': chapters[i],
					'concept_id': concepts[i],					
					'order': orders[i]
				});
			}
			
			if (req.param('enable') === 'on')
				schema.enabled = 'true';
			else
				schema.enabled = 'false';
			
			if (req.param('option1'))
				schema.option1 = req.param('option1');
			
			if (req.param('option2'))
				schema.option2 = req.param('option2');
			
			if (req.param('option3'))
				schema.option3 = req.param('option3');
			
			if (req.param('option4'))
				schema.option4 = req.param('option4');
			
			if (req.param('answer'))
				schema.answer = req.param('answer');
			
			async.waterfall([
			function(cb) {
				var len = links.length;
				for (var i = 0; i < len; i++) {
					for (var j = i+1; j < len; j++) {
						if (links[i].syllabus_id === links[j].syllabus_id &&
								links[i].grade_id === links[j].grade_id &&
								links[i].chapter_id === links[j].chapter_id &&
								links[i].concept_id === links[j].concept_id) {
							console.log('Failed to save question. Check error: duplicate link!');
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Please check duplicated links and try again.'
							});
						}
					}
				}
				cb(null);
			},
			function(cb) {
				TestModel.create(schema, function (err, test, result) {
					if (err) {
						console.log(err);
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Question was not added. Please try again later.'
						});
					}	
						cb(null, test._id);
									
				});
			},
			function(test_id, cb) {
				var len = links.length;
				for (var i = 0; i < len; i++) {				

					LinkModel.update({
						'kind': 'test',
						'syllabus': links[i].syllabus_id,
						'grade': links[i].grade_id,
						'chapter': links[i].chapter_id,
						'concept': links[i].concept_id,
						'order': {$gte: links[i].order}
					}, {
						$inc: {'order': 1}
					}, {
						multi: true
					}, function (err, result) {
						if (err) {
							console.log('Failed to save question.');
							console.log(err.message);
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Question was not saved. Please try again later.'
							});
						} else {
						}
					});
				}

				cb(null, test_id);
			},
			function(test_id, cb) {
				var len = links.length;
				for (var i = 0; i < len; i++) {				
					linkSchema = {
						'kind': 'test',
						'syllabus': links[i].syllabus_id,
						'grade': links[i].grade_id,
						'chapter': links[i].chapter_id,
						'concept': links[i].concept_id,
						'test': test_id,
						'order': links[i].order
					};

					LinkModel.create(linkSchema, function (err, link, result) {
						if (err) {
							console.log('Failed to save question.');
							console.log(err.message);
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Question was not saved. Please try again later.'
							});
						} else {
						}
					});
				}

				console.log('Succeeded to added question.');
				res.send({
					'status_code': 200,
					'message': 'Question was added successfully.'
				});
			}
			]);
		},
		renderTestEditPage = function (req, res) {
			var param = {};
			var test_id = '';
			if (req.query.id)
				test_id = req.query.id;

			var gradeNames = [];
			var chapterNames = [];
			var conceptNames = [];
			var testNames = [];

			async.waterfall([
			function(cb) {
				TestModel.findOne({'_id': test_id}, function(err, test) {
					if (err || !test) {
						console.log('Failed to get test');
						return res.render('admin/tests');
					}

					param.test = {
						'id': test._id,
						'question': test.question,
						'option1': test.option1,
						'option2': test.option2,
						'option3': test.option3,
						'option4': test.option4,
						'answer': test.answer,
						'enabled': test.enabled,
						'order': test.order
					};

					cb(null);
				});
			},
			function(cb) {
				GradeModel.find({}, function(err, grades){
					if (err || !grades || grades.length <= 0) {
						console.log('Failed to get grade name list.');
						//res.render('admin/concepts');
						cb(null);
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
				ChapterModel.find({}, function(err, chapters){
					if (err || !chapters || chapters.length <= 0) {
						console.log('Failed to get chapter name list.');
						//res.render('admin/concepts');
						cb(null);
					} else {
						var len = chapters.length;
						for (var i = 0; i < len; i++) {
							var chapter = chapters[i];
							chapterNames[chapter._id] = chapter.title;
						}
						cb(null);
					}
				});
			},
			function(cb) {
				ConceptModel.find({}, function(err, concepts){
					if (err || !concepts || concepts.length <= 0) {
						console.log('Failed to get concpets name list.');
						//res.render('admin/concepts');
						cb(null);
					} else {
						var len = concepts.length;
						for (var i = 0; i < len; i++) {
							var concept = concepts[i];
							conceptNames[concept._id] = concept.title;
						}
						cb(null);
					}
				});
			},
			function(cb) {
				TestModel.find({}, function(err, tests){
					if (err || !tests || tests.length <= 0) {
						console.log('Failed to get question name list.');
						//res.render('admin/concepts');
						cb(null);
					} else {
						var len = tests.length;
						for (var i = 0; i < len; i++) {
							var test = tests[i];
							testNames[test._id] = test.question;
						}
						cb(null);
					}
				});
			},
			function(cb) {
				SyllabusModel.find({
				}, {
					'title': 1,
					'order': 1
				}, {
					sort: {'order': 1}
				}, function(err, syllabuses){
					if (err || !syllabuses || syllabuses.length <= 0) {
						return res.render('admin/concept', param);
					} else {
						param.syllabuses = syllabuses;
						cb(null);
					}
				});
			},
			function(cb) {
				LinkModel.find({
					'kind': 'test',
					'test': test_id
				}, {
					'syllabus': 1,
					'grade': 1,
					'chapter': 1,
					'concept': 1,
					'order': 1
				}, {
				}, function(err, links){
					if (err || !links || links.length <= 0) {
						return res.render('admin/test', param);
					} else {
						cb(null, links);
					}
				});
			},
			function(links, cb) {
				var len = links.length;
				var resLinks = [];

				for (var i = 0; i < len; i++) {
					var linkInfo = links[i];
					var exGrades = [];
					var exChapters = [];
					var exConcepts = [];
					var exTests = [];

					getGradeLink (linkInfo.syllabus, null, gradeNames, exGrades);
					getChapterLink (linkInfo.syllabus, linkInfo.grade, null, chapterNames, exChapters);
					getConceptLink (linkInfo.syllabus, linkInfo.grade, linkInfo.chapter, null, conceptNames, exConcepts);
					getTestLink (linkInfo.syllabus, linkInfo.grade, linkInfo.chapter, linkInfo.concept, test_id, testNames, exTests);
					console.log('exGrades:' + exGrades + ' ' + 'exChapters:' + exChapters +' ' + 'exConcepts:' + exConcepts +' ' + 'exTests:' + exTests);
					if (exGrades && exChapters && exConcepts && exTests) {
						resLinks.push({
							'linkInfo': linkInfo,
							'exGrades': exGrades,
							'exChapters': exChapters,
							'exConcepts': exConcepts,
							'exTests': exTests
						});
					}
				}
				cb(null, resLinks);
			},
			function(links, cb) {
				param.links = links;
				res.render('admin/test', param);
			}
			]);
		},
		/*
		 * param: question
		 *        
		 *        
		 */
		editTest = function (req, res) {
			if (!req.param('question') || req.param('question') == '') {
				console.log('Failed to save Question');
				res.send({
					'status_code': 400,
					'message': 'Please enter the title.'
				});
			}

			var test_id = '';
			var schema = {
				'question': req.param('question'),
				'option1': req.param('option1'),
				'option2': req.param('option2'),
				'option3': req.param('option3'),
				'option4': req.param('option4'),
				'answer': req.param('answer'),
				'enabled': 'true',
				'updated_date': new Date()
			};

			var links = [];
			var syllabuses = req.param('syllabuses');
			if (!syllabuses)
				syllabuses = [];
			else if (syllabuses.constructor != Array)
				syllabuses = [syllabuses];

			var grades = req.param('grades');
			if (!grades)
				grades = [];
			else if (grades.constructor != Array)
				grades = [grades];

			var chapters = req.param('chapters');
			if (!chapters)
				chapters = [];
			else if (chapters.constructor != Array)
				chapters = [chapters];
			
			var concepts = req.param('concepts');
			if (!concepts)
				concepts = [];
			else if (concepts.constructor != Array)
				concepts = [concepts];

			var orders = req.param('orders');
			if (!orders)
				orders = [];
			else if (orders.constructor != Array)
				orders = [orders];

			for (var i = 0; i < syllabuses.length; i++) {
				links.push({
					'syllabus_id': syllabuses[i],
					'grade_id': grades[i],
					'chapter_id': chapters[i],
					'concept_id': concepts[i],
					'order': orders[i]
				});
			}

			if (req.param('enable') === 'on')
				schema.enabled = 'true';
			else
				schema.enabled = 'false';			

			if (req.query.id)
				test_id = req.query.id;

			async.waterfall([
			function(cb) {
				TestModel.findOne({
					'_id': test_id
				}, {
					'test': 1,
					'question': 1,
					'order': 1
				}, function(err, test) {
					if (err || !test) {
						console.log('Failed to save question');
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Question was not saved. Please try again later.'
						});
					}

					cb(null);
				});
			},
			function(cb) {
				var len = links.length;
				for (var i = 0; i < len; i++) {
					for (var j = i+1; j < len; j++) {
						if (links[i].syllabus_id === links[j].syllabus_id &&
								links[i].grade_id === links[j].grade_id &&
								links[i].chapter_id === links[j].chapter_id &&
								links[i].concept_id === links[j].concept_id ) {
							console.log('Failed to save grade. Check error: duplicate link!');
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Please check duplicated links and try again.'
							});
						}
					}
				}
				cb(null);
			},
			function(cb) {
				LinkModel.remove({'kind':'test', 'test':test_id}, null);
				cb(null);
			},
			function(cb) {
				var len = links.length;
				for (var i = 0; i < len; i++) {				

					LinkModel.update({
						'kind': 'test',
						'syllabus': links[i].syllabus_id,
						'grade': links[i].grade_id,
						'chapter': links[i].chapter_id,
						'concept': links[i].concept_id,
						'order': {$gte: links[i].order}
					}, {
						$inc: {'order': 1}
					}, {
						multi: true
					}, function (err, result) {
						if (err) {
							console.log('Failed to save question.');
							console.log(err.message);
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Question was not saved. Please try again later.'
							});
						} else {
						}
					});
				}

				cb(null);
			},
			function(cb) {
				var len = links.length;
				for (var i = 0; i < len; i++) {				
					linkSchema = {
						'kind': 'test',
						'syllabus': links[i].syllabus_id,
						'grade': links[i].grade_id,
						'chapter': links[i].chapter_id,
						'concept': links[i].concept_id,
						'test': test_id,
						'order': links[i].order
					};

					LinkModel.create(linkSchema, function (err, link, result) {
						if (err) {
							console.log('Failed to save question.');
							console.log(err.message);
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Question was not saved. Please try again later.'
							});
						} else {
						}
					});
				}
				cb(null);
			},
			function(cb) {
				TestModel.update({'_id': test_id}, schema, function(err, result) {
					if (err) {
						console.log(err);
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Question was not saved. Please try again later.'
						});
					}

					cb(null);
				});
			},			
			
			function(cb) {
				console.log('Succeeded to save test.');
				return res.send({
					'status_code': 200,
					'message': 'Test was saved successfully.'
				});
			},
			]);
		},
		getTestLink = function(syllabusId, gradeId, chapterId, conceptId, notTestId, testNames, retTests) {
			var query;
		
			if (!notTestId) {
				query = {
					'kind': 'test',
					'syllabus': syllabusId,
					'grade': gradeId,
					'chapter': chapterId,
					'concept': conceptId
				};
			} else {
				query = {
					'kind': 'test',
					'syllabus': syllabusId,
					'grade': gradeId,
					'chapter': chapterId,
					'concept': conceptId,
					'test':  notTestId
				};
			}
			LinkModel.find(
				query,
			{
				'test': 1,
				'order': 1
			}, {
				sort: {'order': 1}
			}, function(err, links){
				if (err || !links ) {
					console.log(err.message);
					retConcepts = null;
					return;
				} else {
					for (var i = 0; i < links.length; i++) {
						link = links[i];
						retTests.push({
							'test_id': link.test,
							'test_title': testNames[link.test],
							'order': link.order
						});
					}
				}
			});
		},
		//**************************************************************************************/
		
		//***************************************************************************************/
		
		
		deleteTest = function (req, res) {
			var testId = req.param('test');

			async.waterfall([
			function(cb) {
				TestModel.remove({'_id': testId}, function(err, result) {
					cb(null);
				})
			},
			function(cb) {
				LinkModel.remove({'test': testId}, function(err, result) {
					cb(null);
				})
			},
			function(cb) {
				console.log('Succeeded to delete Question.');
				res.send({
					'status_code': 200,
					'message': 'Question was deleted successfully.'
				});
			}
			]);
		},
		getTestListAllUnmapped = function(isAll, retTests, callback) {
			syllabusNames = [];
			gradeNames = [];
			chapterNames = [];
			conceptNames = [];

			async.waterfall([
			function(cb) {
				SyllabusModel.find({
				}, {
				}, {
				}, function(err, syllabuses){
					if (err || !syllabuses ) {
						retGrades = null;
						if (callback)
							callback();
						return;
					} else {
						var len = syllabuses.length;
						for (var i = 0; i < len; i++) {
							syllabusNames[syllabuses[i]._id] = syllabuses[i].title;
						}
						cb(null);
					}
				});
			},
			function(cb) {
				GradeModel.find({
				}, {
				}, {
				}, function(err, grades){
					if (err || !grades ) {
						retChapters = null;
						if (callback)
							callback();
						return;
					} else {
						var len = grades.length;
						for (var i = 0; i < len; i++) {
							gradeNames[grades[i]._id] = grades[i].grade;
						}
						cb(null);
					}
				});
			},
			function(cb) {
				ChapterModel.find({
				}, {
				}, {
				}, function(err, chapters){
					if (err || !chapters ) {
						retConcepts = null;
						if (callback)
							callback();
						return;
					} else {
						var len = chapters.length;
						for (var i = 0; i < len; i++) {
							chapterNames[chapters[i]._id] = chapters[i].title;
						}
						cb(null);
					}
				});
			},
			function(cb) {
				ConceptModel.find({
				}, {
				}, {
					sort:{'title': 1}
				}, function(err, concepts){
					if (err || !concepts ) {
						retConcepts = null;
						if (callback)
							callback();
						return;
					} else {
						var len = concepts.length;
						for (var i = 0; i < len; i++) {
							conceptNames[concepts[i]._id] = concepts[i].title;
						}
						cb(null);
					}
				});
			},
			function(cb) {
				TestModel.find({
				}, {
				}, {
					sort:{'title': 1}
				}, function(err, tests){
					if (err || !tests ) {
						retTests = null;
						if (callback)
							callback();
						return;
					} else {
						cb(null, tests);
					}
				});
			},
			function(tests, cb) {
				var len = tests.length;
				
				for (var i = 0; i < len; i++) {
					var test = tests[i];

					getLinkByTypeId('test', test,i, function(resTest,counter, links){
					if (isAll === 'false') {

						if (!links || links.length <= 0) {
							retTests.push({
								'test_id': resTest._id,
								'test_title': resTest.question,
								'test_enabled': resTest.enabled,
								'syllabus_id': '',
								'syllabus_title': '--',
								'grade_id': '',
								'grade_title': '--',
								'chapter_id': '',
								'chapter_title': '--',
								'concept_id': '',
								'concept_title': '--'
							});
							if(callback)
							callback();
						}
						} else {
							if (isAll === 'true') {
								for (var j = 0; j < links.length; j++){
									link = links[j];

									retTests.push({
										'test_id': resTest._id,
										'test_title': resTest.question,
										'test_enabled': resTest.enabled,
										'syllabus_id': link.syllabus,
										'syllabus_title': syllabusNames[link.syllabus],
										'grade_id': link.grade,
										'grade_title': gradeNames[link.grade],
										'chapter_id': link.chapter,
										'chapter_title': chapterNames[link.chapter],
										'concept_id': link.concept,
										'concept_title': conceptNames[link.concept]
								});
								console.log('Counter:' + counter);
								console.log('Unmapped:' + retTests);
								if(counter == len-1){
									if (callback)				
										callback();
									}
								}
								
							}
						}
					});
				}/*
				if (callback)
					callback();*/
			}
			]);
		},
		getTestListMapped = function(syllabusId, gradeId, chapterId, conceptId, retTests, callback) {
			tmp_tests = [];

			async.waterfall([
			function(cb) {
				SyllabusModel.findOne({
					'_id': syllabusId
				}, function(err, syllabus){
					if (err || !syllabus) {
						retTests = null;

						if (callback)
							callback();
						return;
					} else {
						cb(null, syllabus);
					}
				});
			},
			function(syllabus, cb) {
				GradeModel.findOne({
					'_id': gradeId
				}, function(err, grade){
					if (err || !grade) {
						retTests = null;

						if (callback)
							callback();
						return;
					} else {
						cb(null, syllabus, grade);
					}
				});
			},
			function(syllabus, grade, cb) {
				ChapterModel.findOne({
					'_id': chapterId
				}, function(err, chapter){
					if (err || !chapter) {
						retTests = null;

						if (callback)
							callback();
						return;
					} else {
						cb(null, syllabus, grade, chapter);
					}
				});
			},
			function(syllabus, grade, chapter, cb) {
				ConceptModel.findOne({
					'_id': conceptId
				}, function(err, concept){
					if (err || !concept) {
						retTests = null;

						if (callback)
							callback();
						return;
					} else {
						cb(null, syllabus, grade, chapter, concept);
					}
				});
			},
			function(syllabus, grade, chapter, concept, cb) {
				var testIds = [];
				LinkModel.find({
					'kind': 'test',
					'syllabus': syllabusId,
					'grade': gradeId,
					'chapter': chapterId,
					'concept': conceptId
				}, {
					'test': 1
				}, {
					sort:{'order': 1}
				}, function(err, links){
					if (err || !links ) {
						retTests = null;
						if (callback)
							callback();
						return;
					} else {
						var len = links.length;
						for (var i = 0; i < len; i++) {
							testIds.push(links[i].test);
						}
						cb(null, syllabus, grade, chapter, concept, testIds);
					}
				});
			},
			function(syllabus, grade, chapter, concept, testIds, cb) {
				TestModel.find({'_id': {$in: testIds}}, function(err, tests){
					if (err || !tests) {
						retTests = null;
						if (callback)
							callback();
						return;
					} else {
						var len = tests.length;
						for (var i = 0; i < len; i++) {
							var test = tests[i];
							tmp_tests[test._id] = test;
						}
						cb(null, syllabus, grade, chapter, concept, testIds);
					}
				});
			},
			function(syllabus, grade, chapter, concept, testIds, cb) {
				len = testIds.length;
				for (var i = 0; i < len; i++) {
					var testId = testIds[i];
					var test = tmp_tests[testId];

					retTests.push({
						'test_id': testId,
						'test_title': test.question,
						'test_enabled': test.enabled,
						'syllabus_id': syllabus._id,
						'syllabus_title': syllabus.title,
						'grade_id': grade._id,
						'grade_title': grade.grade,
						'chapter_id': chapter._id,
						'chapter_title': chapter.title,
						'concept_id': concept._id,
						'concept_title': concept.title
					});
				}
				if (callback)
					callback();
			}
			]);
		},
		/*
		 * param :	option
		 * 			syllabus
		 * 			grade
		 * 			chapter
		 * 			concept
		 */
		getTests = function(req, res) {

			if (!req.param('option')) {
				console.log('Failed to get tests.');
				return res.send({
					'status_code': 400,
					'message': 'Please enter the option.'
				});
			}

			var option = req.param('option');
			var syllabusId = req.param('syllabus');
			var gradeId = req.param('grade');
			var chapterId = req.param('chapter');
			var conceptId = req.param('concept');

			var tests = [];

			if (option === 'all') {
			}
			else if (option === 'mapped') {
				if (!syllabusId || !gradeId || !chapterId || !conceptId) {
					console.log('Failed to get tests.');
					return res.send({
						'status_code': 400,
						'message': 'Please enter the option.'
					});
				}
			}
			else if (option === 'unmapped') {
			}
			else {
				console.log('Failed to get tests.');
				return res.send({
					'status_code': 400,
					'message': 'Please enter the option.'
				});
			}

			async.waterfall([
			function(cb) {
				if (option === 'all') {
					getTestListAllUnmapped ('true', tests, function(){
						cb(null);
					});
				}
				else if (option === 'mapped') {
					getTestListMapped (syllabusId, gradeId, chapterId, conceptId, tests, function(){
						cb(null);
					});
				}
				else if (option === 'unmapped') {
					getTestListAllUnmapped ('false', tests, function(){
						cb(null);
					});
				}
			},	
			function(cb) {
				if (!tests)
					tests = [];

				console.log('Succeeded to get tests.');

				return res.send({
					'status_code': 200,
					'option': option,
					'tests': tests
				});
			}]);
		},

		/*
		 *
		 * Users Controller
		 *
		 * */

		renderReportsPage = function(req, res) {
			var reports = {
				'total_users': 0,
				'multi_users': 0,
				'last_7_days_users': 0
			};

			async.waterfall([
			function(cb) {
				ReportModel.aggregate([
					{$group: {_id: '$user', count: {$sum: 1}}}
				], function(err, result) {
					if (!err && result) {
						var multi_users = 0;
						for (var i = 0; i < result.length; i++) {
							if (result[i].count > 1)
								multi_users++;
						}

						reports.total_users = result.length;
						reports.multi_users = multi_users;
					}

					cb(null);
				});
			},
			function(cb) {
				var oneWeekAgo = new Date();
				oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

				ReportModel.aggregate([
					{$match: {'date': {$gte: oneWeekAgo}}},
					{$group: {_id: '$user', count: {$sum: 1}}}
				], function(err, result) {
					if (!err && result) {
						reports.last_7_days_users = result.length;
					}

					res.render('admin/reports', {'reports': reports});
				});
			}]);
		},
		getUsernameOfReport = function(req, res, index, total) {
			async.waterfall([
			function(cb) {
				UserModel.findOne({'_id': req.resReports[index].reporter}, {'name': 1}, function(err, user) {
					if (!err && user)
						req.resReports[index].reporter = user.name;
					else
						req.resReports[index].reporter = 'Guest';

					cb(null);
				});
			},
			function(cb) {
				UserModel.findOne({'_id': req.resReports[index].reported_user}, {'name': 1}, function(err, user) {
					if (!err && user)
						req.resReports[index].reported_user = user.name;
					else
						req.resReports[index].reported_user = 'Guest';

					req.reportCnt++;
					if (req.reportCnt >= total) {
						res.render('admin/reports', {'reports': req.resReports});
						delete req.reportCnt;
						delete req.resReports;
					}
				});
			}]);
		},
		renderUsersPage = function(req, res) {
			var users = {
				'total_count': 0,
				'verified_count': 0,
				'new_7_count': 0,
				'active_7_count': 0
			};

			async.waterfall([
			function(cb) {
				UserModel.count({}, function(err, count){
					if (!err)
						users.total_count = count;

					cb(null);
				});
			},
			function(cb) {
				UserModel.count({'activation': ''}, function(err, count){
					if (!err)
						users.verified_count = count;

					cb(null);
				});
			},
			function(cb) {
				var oneWeekAgo = new Date();
				oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

				UserModel.count({'date': {$gte: oneWeekAgo}}, function(err, count){
					if (!err)
						users.new_7_count = count;

					cb(null);
				});
			},
			function(cb) {
				var oneWeekAgo = new Date();
				oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

				UserModel.count({'logged': 'true', 'logged_date': {$gte: oneWeekAgo}}, function(err, count){
					if (!err)
						users.active_7_count = count;

					cb(null);
				});
			},
			function(cb) {
				GradeModel.find({}, {'grade': 1}, {sort: {'order': 1}}, function(err, grades) {
					if (err || !grades || grades.length <= 0)
						res.render('admin/users', {'users': users, 'grades': []});
					else
						res.render('admin/users', {'users': users, 'grades': grades});
				});
			}]);
		},
		renderManageUsersPage = function(req, res) {
			res.render('admin/manage-users');
		},
		renderListUsersPage = function(req, res) {
			UserModel.find({}, {}, {sort: {'name': 1}}, function(err, users) {
				if (err || !users || users.length <= 0) {
					console.log('Failed to get users.');
					res.render('admin/userlist');
				} else {
					var len = users.length;
					var resUsers = [];

					for (var i = 0; i < len; i++) {					
						var user = users[i];
						resUsers.push({
							'id': user._id,
							'name': user.name,
							'email': user.email,
							'disabled': user.disabled,
						});
					}
					console.log('Succeeded to get users.');
					res.render('admin/userlist', {'users': resUsers});
				}
			});
		},

		/*
		 *
		 * Logs Controller
		 *
		 * */

		renderLogsPage = function(req, res) {
			LogModel.find({}, {}, {sort: {'date': -1}}, function(err, logs) {
				if (err || !logs || logs.length <= 0) {
					console.log('Failed to get logs');
					return res.render('admin/logs');
				}

				req.resLogs = [];
				req.logCnt = 0;
				var len = logs.length;
				for (var i = 0; i < len; i++) {
					var log = logs[i];
					req.resLogs.push({
						'type': log.type,
						'log': log.log,
						'content': log.content,
						'date': dateFormat(log.date, "dd mmm yyyy, HH:MM")
					});

					getUsernameOfLog(req, res, i, len);
				}
			});
		},
		getUsernameOfLog = function(req, res, index, total) {
			UserModel.findOne({'_id': req.resLogs[index].user}, {'name': 1}, function(err, user) {
				if (!err && user)
					req.resLogs[index].user = user.name;
				else
					req.resLogs[index].user = 'Guest';

				req.logCnt++;
				if (req.logCnt >= total) {
					res.render('admin/logs', {'logs': req.resLogs});
					delete req.logCnt;
					delete req.resLogs;
				}
			});
		},

		/*
		 *
		 * Monitoring Controller
		 *
		 * */

		renderMonitoringPage = function(req, res) {
			res.render('admin/monitoring');
		},

		/*
		 *
		 * Search Contents Controller
		 *
		 * */

		renderSearchContentsPage = function(req, res) {
			var param = {};
			async.waterfall([
			function(cb) {
				SyllabusModel.find({}, {'title': 1}, {sort: {'order': 1}}, function(err, syllabuses) {
					if (err || !syllabuses || syllabuses.length <= 0)
						return res.render('admin/search-contents', param);
					else
						param.syllabuses = syllabuses

					cb(null);
				});
			},
			function(cb) {
				GradeModel.find({}, {'grade': 1}, {sort: {'order': 1}}, function(err, grades) {
					if (err || !grades || grades.length <= 0)
						return res.render('admin/search-contents', param);
					else
						param.grades = grades;

					res.render('admin/search-contents', param);
				});
			}]);
		},
		/* 
		 * Search Contents
		 *
		 * param: chapter
		 *        concept
		 *        content_type
		 *        grades
		 */
		searchContents = function(req, res) {
			var params = {};

			if (req.param('content_type') === 'image')
				params.type = 'image';
			else if (req.param('content_type') === 'video')
				params.type = 'video';
			else if (req.param('content_type') === 'reference')
				params.type = 'reference';
			else
				params.type = 'image';

			params.download = req.param('download');

			var query_syllabuses = [];
			if (req.param('syllabuses')) {
				query_syllabuses = req.param('syllabuses');
				if (query_syllabuses.length > 0) {
					params.syllabus = {$in: query_syllabuses};
				}
			}
			var query_grades = [];
			if (req.param('grades')) {
				query_grades = req.param('grades');
				if (query_grades.length > 0) {
					params.grade = {$in: query_grades};
				}
			}
			params.chapter = req.param('chapter');
			params.concept = req.param('concept');

			var regexp_chapter = new RegExp('.*' + params.chapter + '.*', "i");
			var regexp_concept = new RegExp('.*' + params.concept + '.*', "i");

			var syllabusNames = [];
			var gradeNames = [];
			var chapterNames = [];
			var conceptCash = [];

			var syllabusIds = [];
			var gradeIds = [];
			var chapterIds = [];
			var conceptIds = [];
			var resConceptIds = [];

			var resImages = [];
			var resVideos = [];
			var resReferences = [];
			async.waterfall([
				function(cb) {
					SyllabusModel.find({'_id': params.syllabus}, function(err, syllabuses){
						if (err || !syllabuses || syllabuses.length <= 0) {
							console.log('Failed to get syllabus for search contents.');
							return res.send({
								'status_code': 400,
								'message': 'Not found contents'
								});
						} else {
							var len = syllabuses.length;

							for (var i = 0; i < len; i++) {
								var syllabus = syllabuses[i];
								syllabusIds.push(syllabus._id);
							}

							cb(null);
						}
					});
				},
				function(cb) {
					SyllabusModel.find({}, function(err, syllabuses){
						if (err || !syllabuses || syllabuses.length <= 0) {
							console.log('Failed to get syllabus for search contents.');
							return res.send({
								'status_code': 400,
								'message': 'Not found contents'
								});
						} else {
							var len = syllabuses.length;

							for (var i = 0; i < len; i++) {
								var syllabus = syllabuses[i];
								syllabusNames[syllabus._id] = syllabus.title;
							}

							cb(null);
						}
					});
				},
				function(cb) {
					GradeModel.find({'_id': params.grade}, function(err, grades){
						if (err || !grades || grades.length <= 0) {
							console.log('Failed to get grade for search contents.');
							return res.send({
								'status_code': 400,
								'message': 'Not found contents'
								});
						} else {
							var len = grades.length;

							for (var i = 0; i < len; i++) {
								var grade = grades[i];
								gradeIds.push(grade._id);
							}

							cb(null);
						}
					});
				},
				function(cb) {
					GradeModel.find({}, function(err, grades){
						if (err || !grades || grades.length <= 0) {
							console.log('Failed to get grade for search contents.');
							return res.send({
								'status_code': 400,
								'message': 'Not found contents'
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
					ChapterModel.find({
						'title': regexp_chapter
					}, function(err, chapters){
						if (err || !chapters || chapters.length <= 0) {
							console.log('Failed to get chapter for search contents.');
							return res.send({
								'status_code': 400,
								'message': 'Not found contents'
								});
						} else {
							var len = chapters.length;
								for (var i = 0; i < len; i++) {
								var chapter = chapters[i];
								chapterIds.push(chapter._id);
							}
								cb(null);
						}
					});
				},
				function(cb) {
					ChapterModel.find({
					}, function(err, chapters){
						if (err || !chapters || chapters.length <= 0) {
							console.log('Failed to get chapter for search contents.');
							return res.send({
								'status_code': 400,
								'message': 'Not found contents'
								});
						} else {
							var len = chapters.length;
								for (var i = 0; i < len; i++) {
								var chapter = chapters[i];
								chapterNames[chapter._id] = chapter.title;
							}
								cb(null);
						}
					});
				},
				function(cb) {
					ConceptModel.find({
						'title': regexp_concept
					}, {}, {
						sort: {'order': 1}
					}, function(err, concepts){
						if (err || !concepts || concepts.length <= 0) {
							console.log('Failed to get concept for search contents.');
							return res.send({
								'status_code': 400,
								'message': 'Not found contents'
								});
						} else {
							var len = concepts.length;
								for (var i = 0; i < len; i++) {
								var concept = concepts[i];
								conceptCash[concept._id] = concept;
								conceptIds.push(concept._id);
							}
								cb(null);
						}
					});
				},
				function(cb) {
					LinkModel.find({
						'kind': 'concept',
						'syllabus': {$in: syllabusIds},
						'grade': {$in: gradeIds},
						'chapter': {$in: chapterIds},
						'concept': {$in: conceptIds}
					}, {}, {
						sort: {'concept': 1}
					}, function(err, links){
						if (err || !links || links.length <= 0) {
							console.log('Failed to get concept for search contents.');
							return res.send({
								'status_code': 400,
								'message': 'Not found contents'
								});
						} else {
							var len = links.length;
								for (var i = 0; i < len; i++) {
								var link = links[i];
								resConceptIds.push(link.concept);
							}
								cb(null, links);
						}
					});

				},
				function(links, cb) {

					if (params.type === 'image') {
						var len = links.length;
						var tmp_conceptId;

						for (var i = 0; i < len; i++) {
							var concept = conceptCash[links[i].concept];

							if (tmp_conceptId === concept._id)
								continue;

							getLinkByTypeId('concept', concept, function(resConcept, resLinks){
								if (resLinks && resLinks.length > 0) {
									var linkInfo = [];
									
									for (var j = 0; j < resLinks.length; j++) {
										var resLink = resLinks[j];
										linkInfo.push({
											'syllabus_name': syllabusNames[resLink.syllabus],
											'grade_name': gradeNames[resLink.grade],
											'chapter_name': chapterNames[resLink.chapter],
										});
									}

									resImages.push({
											'concept_id': resConcept._id,
											'concept_name': resConcept.title,
											'image': resConcept.image,
											'image_source': resConcept.image_source,
											'image_credit': resConcept.image_credit,
											'image_url': resConcept.image_url,
											'linkInfo': linkInfo
									});
								}
							});

							tmp_conceptId = concept._id;
						}
					}

					cb(null, links);

				},
				function(links, cb) {
					if (params.type === 'video') {
						var len = links.length;
						var tmp_conceptId;

						for (var i = 0; i < len; i++) {
							var concept = conceptCash[links[i].concept];

							if (tmp_conceptId === concept._id)
								continue;

							VideoModel.find({
								'concept': concept._id,
							}, {}, {},
							function(err, videos){
								if (err || !videos || videos.length <= 0) {
									/*console.log('Failed to get videos for search contents.');
									return res.send({
										'status_code': 400,
										'message': 'Not found contents'
										});*/
								} else {

									for (var k = 0; k < videos.length; k++) {
										video = videos[k];

										getLinkByTypeId('concept', concept, function(resConcept, resLinks){
											if (resLinks && resLinks.length > 0) {
												var linkInfo = [];
											
												for (var j = 0; j < resLinks.length; j++) {
													var resLink = resLinks[j];
													linkInfo.push({
														'syllabus_name': syllabusNames[resLink.syllabus],
														'grade_name': gradeNames[resLink.grade],
														'chapter_name': chapterNames[resLink.chapter],
													});
												}
		
												resVideos.push({
													'concept_id': resConcept._id,
													'concept_name': resConcept.title,
													'video_id': video._id,
													'url': video.url,
													'linkInfo': linkInfo
												});
											}
										});
									}
								}
							});
							tmp_conceptId = concept._id;
						}
					}

					cb(null, links);
				},
				function(links, cb) {
					if (params.type === 'reference') {
						var len = links.length;
						var tmp_conceptId;

						for (var i = 0; i < len; i++) {
							var concept = conceptCash[links[i].concept];

							if (tmp_conceptId === concept._id)
								continue;

							ReferenceModel.find({
								'concept': concept._id,
							}, {}, {},
							function(err, references){
								if (err || !references || references.length <= 0) {
								/*console.log('Failed to get references for search contents.');
								return res.send({
									'status_code': 400,
									'message': 'Not found contents'
									});*/
								} else {
									var len = references.length;

									for (var k = 0; k < references.length; k++) {
										var reference = references[k];

										getLinkByTypeId('concept', concept, function(resConcept, resLinks){
											if (resLinks && resLinks.length > 0) {
												var linkInfo = [];
											
												for (var j = 0; j < resLinks.length; j++) {
													var resLink = resLinks[j];
													linkInfo.push({
														'syllabus_name': syllabusNames[resLink.syllabus],
														'grade_name': gradeNames[resLink.grade],
														'chapter_name': chapterNames[resLink.chapter],
													});
												}
		
												resReferences.push({
														'concept_id': resConcept._id,
														'concept_name': resConcept.title,
														'ref_id': reference._id,
														'title': reference.title,
														'url': reference.url,
														'linkInfo': linkInfo
												});
											}
										});
									}
								}
							});
							tmp_conceptId = concept._id;
						}
					}
					cb(null);
				},
				function(cb) {
					// blank function: Don't remove this function because function stack for get resReference.
					cb(null);
				},
				function(cb) {
					var filePath = '';
					var filename = '';

					if (params.download === 'true') {
						var rootPath = __dirname.substring(0, __dirname.lastIndexOf('/'));
						var date = new Date();
						filename = 'contetns-' + dateFormat(date, 'yymmddHHMMss') + '.csv';
						filePath = rootPath + '/tmp/' + filename;

						if (params.type === 'image')
							saveImageContentsToFile(params, query_syllabuses, syllabusNames, query_grades, gradeNames, resImages, filePath);
						else if (params.type === 'video')
							saveVideoContentsToFile(params, query_syllabuses, syllabusNames, query_grades, gradeNames, resVideos, filePath);
						else if (params.type === 'reference')
							saveReferenceContentsToFile(params, query_syllabuses, syllabusNames, query_grades, gradeNames, resReferences, filePath);

						// send file to client
						if (!fs.existsSync(filePath)) {
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. Download was not successful. Please try again later.'
							});
						}
					}
					cb(null, filename);
				},
				function(filename, cb) {
					console.log('Succeeded to search contents.');
					res.send({
						'status_code': 200,
						'message': 'Contents were searched successfully.',
						'content_type': params.type,
						'filename': filename,
						'images': resImages,
						'videos': resVideos,
						'references': resReferences
					});
				}
			]);
		},
		saveImageContentsToFile = function(params, query_syllabuses, syllabusNames, query_grades, gradeNames, resImages, filePath) {
			var delimiter = ',';
			var data = 'Image Contents' + '\n';
			
			data += 'Syllabuses: ';
			for (var i = 0; i < query_syllabuses.length; i++) {
				data += '"' + syllabusNames[query_syllabuses[i]] + '" ';
			}
			data += '\n';

			data += 'Grades: ';
			for (var i = 0; i < query_grades.length; i++) {
				data += gradeNames[query_grades[i]] + ' ';
			}
			data += '\n';

			data += 'Chapter key: ' + params.chapter + '\n';
			data += 'Concept key: ' + params.concept + '\n';

			data += 'Syllabus' + delimiter;
			data += 'Grade' + delimiter;
			data += 'Chapter' + delimiter;
			data += 'Concept' + delimiter;

			data += 'Image URL' + delimiter;
			data += 'Source URL' + delimiter;
			data += 'Credit' + delimiter;
			data += '\n';

			var len = resImages.length;
			for (var i = 0; i < len; i++) {
				var image = resImages[i];
				var linkLength = image.linkInfo.length;

				for (var k = 0; k < linkLength; k++) {
					var link = image.linkInfo[k];

					data += '"' + link.syllabus_name + '"' + delimiter;
					data += '"' + link.grade_name + '"' + delimiter;
					data += '"' + link.chapter_name + '"' + delimiter;
					data += '"' + image.concept_name + '"' + delimiter;
		
					data += '"' + image.image_url + '"' + delimiter;
					data += '"' + image.image_source + '"' + delimiter;
					data += '"' + image.image_credit + '"' + delimiter;
		
					data += '\n';
				}

				if (i + 1 % 10 == 0) {
					fs.appendFileSync(filePath, data);
					data = '';
				}
			}

			fs.appendFileSync(filePath, data);
		},
		saveVideoContentsToFile = function(params, query_syllabuses, syllabusNames, query_grades, gradeNames, resVideos, filePath) {
			var delimiter = ',';
			var data = 'Video Contents' + '\n';
			
			data += 'Syllabuses: ';
			for (var i = 0; i < query_syllabuses.length; i++) {
				data += '"' + syllabusNames[query_syllabuses[i]] + '" ';
			}
			data += '\n';

			data += 'Grades: ';
			for (var i = 0; i < query_grades.length; i++) {
				data += gradeNames[query_grades[i]] + ' ';
			}
			data += '\n';

			data += 'Chapter key: ' + params.chapter + '\n';
			data += 'Concept key: ' + params.concept + '\n';

			data += 'Syllabus' + delimiter;
			data += 'Grade' + delimiter;
			data += 'Chapter' + delimiter;
			data += 'Concept' + delimiter;

			data += 'Video URL' + delimiter;
			data += '\n';

			var len = resVideos.length;
			for (var i = 0; i < len; i++) {
				var video = resVideos[i];

				var linkLength = video.linkInfo.length;

				for (var k = 0; k < linkLength; k++) {
					var link = video.linkInfo[k];

					data += '"' + link.syllabus_name + '"' + delimiter;
					data += '"' + link.grade_name + '"' + delimiter;
					data += '"' + link.chapter_name + '"' + delimiter;
					data += '"' + video.concept_name + '"' + delimiter;

					data += '"https://www.youtube.com/watch?v=' + video.url + '"' + delimiter;

					data += '\n';
				}

				if (i + 1 % 10 == 0) {
					fs.appendFileSync(filePath, data);
					data = '';
				}
			}

			fs.appendFileSync(filePath, data);
		},
		saveReferenceContentsToFile = function(params, query_syllabuses, syllabusNames, query_grades, gradeNames, resReferences, filePath) {
			var delimiter = ',';
			var data = 'Reference Contents' + '\n';
			
			data += 'Syllabuses: ';
			for (var i = 0; i < query_syllabuses.length; i++) {
				data += '"' + syllabusNames[query_syllabuses[i]] + '" ';
			}
			data += '\n';

			data += 'Grades: ';
			for (var i = 0; i < query_grades.length; i++) {
				data += gradeNames[query_grades[i]] + ' ';
			}
			data += '\n';

			data += 'Chapter key: ' + params.chapter + '\n';
			data += 'Concept key: ' + params.concept + '\n';

			data += 'Syllabus' + delimiter;
			data += 'Grade' + delimiter;
			data += 'Chapter' + delimiter;
			data += 'Concept' + delimiter;

			data += 'Title' + delimiter;
			data += 'URL' + delimiter;
			data += '\n';

			var len = resReferences.length;
			for (var i = 0; i < len; i++) {
				var reference = resReferences[i];
				var linkLength = reference.linkInfo.length;

				for (var k = 0; k < linkLength; k++) {
					var link = reference.linkInfo[k];

					data += '"' + link.syllabus_name + '"' + delimiter;
					data += '"' + link.grade_name + '"' + delimiter;
					data += '"' + link.chapter_name + '"' + delimiter;
					data += '"' + reference.concept_name + '"' + delimiter;

					data += '"' + reference.title + '"' + delimiter;
					data += '"' + reference.url + '"' + delimiter;

					data += '\n';
				}

				if (i + 1 % 10 == 0) {
					fs.appendFileSync(filePath, data);
					data = '';
				}
			}

			fs.appendFileSync(filePath, data);
		},

		/*
		 *
		 * Import & Export Controller
		 *
		 * */

		renderImportContentsPage = function(req, res) {
			res.render('admin/import-contents');
		},
		importVideosOfContent = function(req, res, content, concept_id) {
			VideoModel.remove({
				'owner': 'admin',
				'concept': concept_id
			}, function(err, result) {
				if (err) {
					importReferencesOfContent(req, res, content, concept_id);
				} else {
					videoIndex = -1;
					defaultedVideo = 'true';
					importVideoOfContent(req, res, content, concept_id);
				}
			});
		},
		importVideoOfContent = function(req, res, content, concept_id) {
			videoIndex++;
			if (videoIndex >= content.videos.length) {
				importReferencesOfContent(req, res, content, concept_id);
				return;
			}

			var url = getYoutubeEmbedUrl(content.videos[videoIndex]);
			if (url == '') {
				importVideoOfContent(req, res, content, concept_id);
				return;
			}

			VideoModel.create({
				'url': url,
				'concept': concept_id,
				'defaulted_admin': defaultedVideo
			}, function(err, video) {
				defaultedVideo = 'false';
				importVideoOfContent(req, res, content, concept_id);
			});
		},
		importReferencesOfContent = function(req, res, content, concept_id) {
			ReferenceModel.remove({
				'owner': 'admin',
				'concept': concept_id
			}, function(err, result) {
				if (err) {
					importOneConcept(req, res);
				} else {
					refIndex = -1;
					defaultedReference = 'true';
					importReferenceOfContent(req, res, content, concept_id)
				}
			});
		},
		importReferenceOfContent = function(req, res, content, concept_id) {
			refIndex++;
			if (refIndex >= content.references.length) {
				importOneConcept(req, res);
				return;
			}

			var url = content.references[refIndex];
			if (url.indexOf('//') === 0)
				url = 'http:' + url;
			else if (url.indexOf('http://') != 0 &&
					 url.indexOf('https://') != 0)
			{
				url = 'http://' + url;
			}

			var domain;
			var start = url.indexOf('//') + 2;
			var end = url.indexOf('/', start);
			if (end == -1)
				domain = url.substring(start);
			else
				domain = url.substring(start, end);

			if (domain == '' || domain.indexOf('/') === 0) {
				importReferenceOfContent(req, res, content, concept_id);
				return;
			}

			var title_flag = 'false';
			var shortcut_icon = '';
			var fluid_icon = '';
			var referenceSchema = {
				'url': url,
				'title': '',
				'description': '',
				'image': '',
				'concept': concept_id,
				'defaulted_admin': defaultedReference
			};

			logger.trace();
			var charset = 'utf8';
			var htmlparser = require('htmlparser2');
			var parser = new htmlparser.Parser({
    			onopentag: function(name, attribs){
					name = name.toLowerCase();
        			if(name === 'title')
						title_flag = 'true';
					else if (name === 'meta' && attribs.name && attribs.name.toLowerCase() === 'description') {
						if (charset.indexOf('Shift_JIS') != 0 && attribs.content)
							referenceSchema.description = utils.trim(attribs.content);
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
						referenceSchema.title = utils.trim(text);
						title_flag = 'false';
					}
				},
				onclosetag: function(name){
					if(name === 'title'){
						title_flag = 'false';
					}
				}
			});

			logger.trace(url);
			request({
				uri: url,
				method: "GET",
				timeout: 20000
			}, function(err, response, body){
				if (err) {
					logger.trace(url);
					logger.trace(err);
				}
				if (!err) {
					var contentType = response.headers['content-type'];
					charset = contentType.substring(contentType.indexOf('charset=') + 8);

					parser.write(body);
					parser.end();
			
					if (fluid_icon != '')
						referenceSchema.image = fluid_icon;
					else
						referenceSchema.image = shortcut_icon;

					if (referenceSchema.image == '')
						referenceSchema.image = '/images/reference.png';
					else if (referenceSchema.image.indexOf('//') == 0)
						referenceSchema.image = 'http:' + referenceSchema.image;
					else if (referenceSchema.image.indexOf('http') != 0) {
						if (url.indexOf('https://') === 0)
							referenceSchema.image = 'https://' + domain + referenceSchema.image;
						else
							referenceSchema.image = 'http://' + domain + referenceSchema.image;
					}
				} else {
					referenceSchema.image = '/images/reference.png';
				}

				ReferenceModel.create(referenceSchema, function(err, reference, result) {
					defaultedReference = 'false';
					importReferenceOfContent(req, res, content, concept_id);
				});
			});
		},
		importFinish = function(req, res) {
			var len = failedRows.length;
			var failedRowsStr = '';
			for (var i = 0; i < len; i++) {
				if (i > 0)
					failedRowsStr += ', ';
				failedRowsStr += failedRows[i];
			}

			global.socket.emit('resImportCompleted', {
				'total_count': recordCount,
				'imported_count': recordCount - len,
				'failed_rows': failedRowsStr
			});

			isImporting = false;
			records = null;
			conceptFieldIndexs = null;
			mappingFieldIndexs = null;
			fieldIndexs = null;
			failedRows = null;
			recordCount = 0;
			recordIndex = 0;
			videoIndex = 0;
			refIndex = 0;
			defaultedVideo = 'true';
			defaultedReference = 'true';
		},
		getLinkByTypeId = function(kind, item,counter, callback) {

			var retLinks = [];
			var query = {};
			console.log('counter:' + counter);

			if (kind === 'grade')
				query = {'kind': kind, 'grade': item._id};
			else if (kind === 'chapter')
				query = {'kind': kind, 'chapter': item._id};
			else if (kind === 'concept')
				query = {'kind': kind, 'concept': item._id};
			else if (kind === 'test')
				query = {'kind': kind, 'test': item._id};
			else {
				if (callback)
					callback(null, null);
				return;
			}

			async.waterfall([
			function(cb) {
				var gradeIds = [];
				LinkModel.find(
					query, {
				}, {
				}, function(err, links){
					if (err || !links ) {
						retLinks = null;
						if (callback)
							callback(null, null);
						return;
					} else {
						if (callback)
							callback(item,counter,links);
					}
				});
			},
			]);
		},
		getGradeListAllUnmapped = function(isAll, retGrades, callback) {
			var syllabusNames = [];
			
			async.waterfall([
			function(cb) {
				SyllabusModel.find({
				}, {
				}, {
				}, function(err, syllabuses){
					if (err || !syllabuses ) {
						retGrades = null;
						if (callback)
							callback();
						return;
					} else {
						var len = syllabuses.length;
						for (var i = 0; i < len; i++) {
							syllabusNames[syllabuses[i]._id] = syllabuses[i].title;
						}
						cb(null ,syllabuses);
					}
				});
			},
			function(syllabuses, cb) {
				GradeModel.find({
				}, {
				}, {
					sort:{'grade': 1}
				}, function(err, grades){
					if (err || !grades ) {
						retGrades = null;
						if (callback)
							callback();
						return;
					} else {
						cb(null, grades);
					}
				});
			},
			function(grades, cb) {
				var len = grades.length;
				for (var i = 0; i < len; i++) {
					
					var grade = grades[i];
					getLinkByTypeId('grade', grade,i, function(resGrade,counter,links){
						if (isAll === 'false') {
							if (!links || links.length == 0) {
								retGrades.push({
									'grade_id': resGrade._id,
									'grade_title': resGrade.grade,
									'grade_enabled': resGrade.enabled,
									'syllabus_id': '',
									'syllabus_title': '--'
								});
								if (callback)				
										callback();
							}
							
									
									
						}
						 else {
							if (isAll === 'true') {
								for (var j = 0; j < links.length; j++){
									link = links[j];

									retGrades.push({
									'grade_id': resGrade._id,
									'grade_title': resGrade.grade,
									'grade_enabled': resGrade.enabled,
									'syllabus_id': link.syllabus,
									'syllabus_title': syllabusNames[link.syllabus]
								});
								//console.log('Counter:' + counter);
								//console.log('Unmapped:' + retGrades);
								if(counter == len-1){
									if (callback)				
										callback();
									}
								}
							}					
						}							
					});
				}/*
				if (callback)				
					callback();*/
			}
			]);
		},
		getGradeListMapped = function(syllabusId, retGrades, callback) {
			tmp_grades = [];

			async.waterfall([
			function(cb) {
				SyllabusModel.findOne({
					'_id': syllabusId
				}, function(err, syllabus){
					if (err || !syllabus) {
						retGrades = null;

						if (callback)
							callback();
						return;
					} else {
						cb(null, syllabus);
					}
				});
			},
			function(syllabus, cb) {
				var gradeIds = [];
				LinkModel.find({
					'kind': 'grade',
					'syllabus': syllabusId
				}, {
					'grade': 1
				}, {
					sort:{'order': 1}
				}, function(err, links){
					if (err || !links ) {
						retGrades = null;
						if (callback)
							callback();
						return;
					} else {
						var len = links.length;
						for (var i = 0; i < len; i++) {
							gradeIds.push(links[i].grade);
						}
						cb(null, syllabus, gradeIds);
					}
				});
			},
			function(syllabus, gradeIds, cb) {
				GradeModel.find({'_id': {$in: gradeIds}}, function(err, grades){
					if (err || !grades) {
						retGrades = null;
						if (callback)
							callback();
						return;
					} else {
						var len = grades.length;
						for (var i = 0; i < len; i++) {
							var grade = grades[i];
							tmp_grades[grade._id] = grade;
						}
						cb(null, syllabus, gradeIds);
					}
				});
			},
			function(syllabus, gradeIds, cb) {
				len = gradeIds.length;
				for (var i = 0; i < len; i++) {
					var gradeId = gradeIds[i];
					var grade = tmp_grades[gradeId];

					retGrades.push({
						'grade_id': gradeId,
						'grade_title': grade.grade,
						'grade_enabled': grade.enabled,
						'syllabus_id': syllabus._id,
						'syllabus_title': syllabus.title
					});
				}
				if (callback)
					callback();
			}
			]);
		},
		/*
		 * param :	option
		 * 			syllabus
		 */
		getGrades = function(req, res) {
			if (!req.param('option')) {
				console.log('Failed to get grades.');
				return res.send({
					'status_code': 400,
					'message': 'Please enter the option.'
				});
			}

			var option = req.param('option');
			var syllabusId = req.param('syllabus');
			
			
			var grades = [];

			if (option === 'all') {
			}
			else if (option === 'mapped') {
				if (!syllabusId) {
					console.log('Failed to get grades.');
					return res.send({
						'status_code': 400,
						'message': 'Please enter the option.'
					});
				}
			}
			else if (option === 'unmapped') {
			}
			else {
				console.log('Failed to get grades.');
				return res.send({
					'status_code': 400,
					'message': 'Please enter the option.'
				});
			}

			async.waterfall([
			function(cb) {
				if (option === 'all') {
					getGradeListAllUnmapped ('true', grades, function(){
						cb(null);
					});
				}
				else if (option === 'mapped') {
					getGradeListMapped (syllabusId, grades, function(){
						cb(null);
					});
				}
				else if (option === 'unmapped') {
					getGradeListAllUnmapped ('false', grades, function(){
						cb(null);
					});
				}
			},	
			function(cb) {
				if (!grades)
					grades = [];

				console.log('Succeeded to get grades.');

				return res.send({
					'status_code': 200,
					'option': option,
					'grades': grades
				});
			}]);
		},
		getChapterListAllUnmapped = function(isAll, retChapters, callback) {
			syllabusNames = [];
			gradeNames = [];

			async.waterfall([
			function(cb) {
				SyllabusModel.find({
				}, {
				}, {
				}, function(err, syllabuses){
					if (err || !syllabuses ) {
						retGrades = null;
						if (callback)
							callback();
						return;
					} else {
						var len = syllabuses.length;
						for (var i = 0; i < len; i++) {
							syllabusNames[syllabuses[i]._id] = syllabuses[i].title;
						}
						cb(null);
					}
				});
			},
			function(cb) {
				GradeModel.find({
				}, {
				}, {
				}, function(err, grades){
					if (err || !grades ) {
						retChapters = null;
						if (callback)
							callback();
						return;
					} else {
						var len = grades.length;
						for (var i = 0; i < len; i++) {
							gradeNames[grades[i]._id] = grades[i].grade;
						}
						cb(null);
					}
				});
			},
			function(cb) {
				ChapterModel.find({
				}, {
				}, {
					sort:{'title': 1}
				}, function(err, chapters){
					if (err || !chapters ) {
						retChapters = null;
						if (callback)
							callback();
						return;
					} else {
						cb(null, chapters);
					}
				});
			},
			function(chapters, cb) {
				var len = chapters.length;
				
				for (var i = 0; i < len; i++) {
					var chapter = chapters[i];

					getLinkByTypeId('chapter', chapter,i, function(resChapter,counter, links){

					if (isAll === 'false'){
						//if(links.length == 0){
							//callback();
							//} else {
						//console.log('hit chapter');
						//if (!links || links.length <= 0) {
							
							retChapters.push({
								'chapter_id': resChapter._id,
								'chapter_title': resChapter.title,
								'chapter_enabled': resChapter.enabled,
								'syllabus_id': '',
								'syllabus_title': '--',
								'grade_id': '',
								'grade_title': '--'
							});
							//console.log('hh:' + counter);
								//console.log('retChapters:' + retChapters);
							if(callback)
								callback();
						//}
					//}
						} else {
							if (isAll === 'true') {
								for (var j = 0; j < links.length; j++){
									link = links[j];

									retChapters.push({
										'chapter_id': resChapter._id,
										'chapter_title': resChapter.title,
										'chapter_enabled': resChapter.enabled,
										'syllabus_id': link.syllabus,
										'syllabus_title': syllabusNames[link.syllabus],
										'grade_id': link.grade,
										'grade_title': gradeNames[link.grade]
								});
								console.log('hh:' + counter);
								console.log('retChapters:' + retChapters);
								if(counter == len-1){
									if (callback)
										callback();
									}
								}
							}
						}
					});
				}/*
				if (callback)
					callback();*/
			}
			]);
		},
		getChapterListMapped = function(syllabusId, gradeId, retChapters, callback) {
			tmp_chapters = [];

			async.waterfall([
			function(cb) {
				SyllabusModel.findOne({
					'_id': syllabusId
				}, function(err, syllabus){
					if (err || !syllabus) {
						retGrades = null;

						if (callback)
							callback();
						return;
					} else {
						cb(null, syllabus);
					}
				});
			},
			function(syllabus, cb) {
				GradeModel.findOne({
					'_id': gradeId
				}, function(err, grade){
					if (err || !grade) {
						retGrades = null;

						if (callback)
							callback();
						return;
					} else {
						cb(null, syllabus, grade);
					}
				});
			},
			function(syllabus, grade, cb) {
				var chapterIds = [];
				LinkModel.find({
					'kind': 'chapter',
					'syllabus': syllabusId,
					'grade': gradeId
				}, {
					'chapter': 1
				}, {
					sort:{'order': 1}
				}, function(err, links){
					if (err || !links ) {
						retChapters = null;
						if (callback)
							callback();
						return;
					} else {
						var len = links.length;
						for (var i = 0; i < len; i++) {
							chapterIds.push(links[i].chapter);
						}
						cb(null, syllabus, grade, chapterIds);
					}
				});
			},
			function(syllabus, grade, chapterIds, cb) {
				ChapterModel.find({'_id': {$in: chapterIds}}, function(err, chapters){
					if (err || !chapters) {
						retChapters = null;
						if (callback)
							callback();
						return;
					} else {
						var len = chapters.length;
						for (var i = 0; i < len; i++) {
							var chapter = chapters[i];
							tmp_chapters[chapter._id] = chapter;
						}
						cb(null, syllabus, grade, chapterIds);
					}
				});
			},
			function(syllabus, grade, chapterIds, cb) {
				len = chapterIds.length;
				for (var i = 0; i < len; i++) {
					var chapterId = chapterIds[i];
					var chapter = tmp_chapters[chapterId];

					retChapters.push({
						'chapter_id': chapterId,
						'chapter_title': chapter.title,
						'chapter_enabled': chapter.enabled,
						'syllabus_id': syllabus._id,
						'syllabus_title': syllabus.title,
						'grade_id': grade._id,
						'grade_title': grade.grade
					});
				}
				if (callback)
					callback();
			}
			]);
		},
		/*
		 * param :	option
		 * 			syllabus
		 * 			grade
		 */
		getChapters = function(req, res) {

			if (!req.param('option')) {
				console.log('Failed to get chapters.');
				return res.send({
					'status_code': 400,
					'message': 'Please enter the option.'
				});
			}

			var option = req.param('option');
			var syllabusId = req.param('syllabus');
			var gradeId = req.param('grade');

			var chapters = [];

			if (option === 'all') {
			}
			else if (option === 'mapped') {
				if (!syllabusId || !gradeId) {
					console.log('Failed to get chapters.');
					return res.send({
						'status_code': 400,
						'message': 'Please enter the option.'
					});
				}
			}
			else if (option === 'unmapped') {
			}
			else {
				console.log('Failed to get chapters.');
				return res.send({
					'status_code': 400,
					'message': 'Please enter the option.'
				});
			}

			async.waterfall([
			function(cb) {
				if (option === 'all') {
					getChapterListAllUnmapped ('true', chapters, function(){
						cb(null);
					});
				}
				else if (option === 'mapped') {
					getChapterListMapped (syllabusId, gradeId, chapters, function(){
						cb(null);
					});
				}
				else if (option === 'unmapped') {
					getChapterListAllUnmapped ('false', chapters, function(){
						cb(null);
					});
				}
			},	
			function(cb) {
				if (!chapters)
					chapters = [];

				console.log('Succeeded to get chapters.');

				return res.send({
					'status_code': 200,
					'option': option,
					'chapters': chapters
				});
			}]);
		},
		getConceptListAllUnmapped = function(isAll, retConcepts, callback) {
			syllabusNames = [];
			gradeNames = [];
			chapterNames = [];

			async.waterfall([
			function(cb) {
				SyllabusModel.find({
				}, {
				}, {
				}, function(err, syllabuses){
					if (err || !syllabuses ) {
						retGrades = null;
						if (callback)
							callback();
						return;
					} else {
						var len = syllabuses.length;
						for (var i = 0; i < len; i++) {
							syllabusNames[syllabuses[i]._id] = syllabuses[i].title;
						}
						cb(null);
					}
				});
			},
			function(cb) {
				GradeModel.find({
				}, {
				}, {
				}, function(err, grades){
					if (err || !grades ) {
						retChapters = null;
						if (callback)
							callback();
						return;
					} else {
						var len = grades.length;
						for (var i = 0; i < len; i++) {
							gradeNames[grades[i]._id] = grades[i].grade;
						}
						cb(null);
					}
				});
			},
			function(cb) {
				ChapterModel.find({
				}, {
				}, {
				}, function(err, chapters){
					if (err || !chapters ) {
						retConcepts = null;
						if (callback)
							callback();
						return;
					} else {
						var len = chapters.length;
						for (var i = 0; i < len; i++) {
							chapterNames[chapters[i]._id] = chapters[i].title;
						}
						cb(null);
					}
				});
			},
			function(cb) {
				ConceptModel.find({
				}, {
				}, {
					sort:{'title': 1}
				}, function(err, concepts){
					if (err || !concepts ) {
						retConcepts = null;
						if (callback)
							callback();
						return;
					} else {
						cb(null, concepts);
					}
				});
			},
			function(concepts, cb) {
				var len = concepts.length;
				
				for (var i = 0; i < len; i++) {
					var concept = concepts[i];

					getLinkByTypeId('concept', concept, i,function(resConcept,counter, links){
		

						if (!links || links.length <= 0) {
							retConcepts.push({
								'concept_id': resConcept._id,
								'concept_title': resConcept.title,
								'concept_enabled': resConcept.enabled,
								'syllabus_id': '',
								'syllabus_title': '--',
								'grade_id': '',
								'grade_title': '--',
								'chapter_id': '',
								'chapter_title': '--'
							});
						} else {
							if (isAll === 'true') {
								for (var j = 0; j < links.length; j++){
									link = links[j];

									retConcepts.push({
										'concept_id': resConcept._id,
										'concept_title': resConcept.title,
										'concept_enabled': resConcept.enabled,
										'syllabus_id': link.syllabus,
										'syllabus_title': syllabusNames[link.syllabus],
										'grade_id': link.grade,
										'grade_title': gradeNames[link.grade],
										'chapter_id': link.chapter,
										'chapter_title': chapterNames[link.chapter]
								});
								if(counter == len-1){
									if (callback)
					callback();
									}
								}
							}
						}
					});
				}/*
				if (callback)
					callback();*/
			}
			]);
		},
		getConceptListMapped = function(syllabusId, gradeId, chapterId, retConcepts, callback) {
			tmp_concepts = [];

			async.waterfall([
			function(cb) {
				SyllabusModel.findOne({
					'_id': syllabusId
				}, function(err, syllabus){
					if (err || !syllabus) {
						retConcepts = null;

						if (callback)
							callback();
						return;
					} else {
						cb(null, syllabus);
					}
				});
			},
			function(syllabus, cb) {
				GradeModel.findOne({
					'_id': gradeId
				}, function(err, grade){
					if (err || !grade) {
						retConcepts = null;

						if (callback)
							callback();
						return;
					} else {
						cb(null, syllabus, grade);
					}
				});
			},
			function(syllabus, grade, cb) {
				ChapterModel.findOne({
					'_id': chapterId
				}, function(err, chapter){
					if (err || !chapter) {
						retConcepts = null;

						if (callback)
							callback();
						return;
					} else {
						cb(null, syllabus, grade, chapter);
					}
				});
			},
			function(syllabus, grade, chapter, cb) {
				var conceptIds = [];
				LinkModel.find({
					'kind': 'concept',
					'syllabus': syllabusId,
					'grade': gradeId,
					'chapter': chapterId
				}, {
					'concept': 1
				}, {
					sort:{'order': 1}
				}, function(err, links){
					if (err || !links ) {
						retConcepts = null;
						if (callback)
							callback();
						return;
					} else {
						var len = links.length;
						for (var i = 0; i < len; i++) {
							conceptIds.push(links[i].concept);
						}
						cb(null, syllabus, grade, chapter, conceptIds);
					}
				});
			},
			function(syllabus, grade, chapter, conceptIds, cb) {
				ConceptModel.find({'_id': {$in: conceptIds}}, function(err, concepts){
					if (err || !concepts) {
						retConcepts = null;
						if (callback)
							callback();
						return;
					} else {
						var len = concepts.length;
						for (var i = 0; i < len; i++) {
							var concept = concepts[i];
							tmp_concepts[concept._id] = concept;
						}
						cb(null, syllabus, grade, chapter, conceptIds);
					}
				});
			},
			function(syllabus, grade, chapter, conceptIds, cb) {
				len = conceptIds.length;
				for (var i = 0; i < len; i++) {
					var conceptId = conceptIds[i];
					var concept = tmp_concepts[conceptId];

					retConcepts.push({
						'concept_id': conceptId,
						'concept_title': concept.title,
						'concept_enabled': concept.enabled,
						'syllabus_id': syllabus._id,
						'syllabus_title': syllabus.title,
						'grade_id': grade._id,
						'grade_title': grade.grade,
						'chapter_id': chapter._id,
						'chapter_title': chapter.title
					});
				}
				if (callback)
					callback();
			}
			]);
		},
		/*
		 * param :	option
		 * 			syllabus
		 * 			grade
		 * 			chapter
		 */
		getConcepts = function(req, res) {

			if (!req.param('option')) {
				console.log('Failed to get concepts.');
				return res.send({
					'status_code': 400,
					'message': 'Please enter the option.'
				});
			}

			var option = req.param('option');
			var syllabusId = req.param('syllabus');
			var gradeId = req.param('grade');
			var chapterId = req.param('chapter');

			var concepts = [];

			if (option === 'all') {
			}
			else if (option === 'mapped') {
				if (!syllabusId || !gradeId || !chapterId) {
					console.log('Failed to get concepts.');
					return res.send({
						'status_code': 400,
						'message': 'Please enter the option.'
					});
				}
			}
			else if (option === 'unmapped') {
			}
			else {
				console.log('Failed to get concepts.');
				return res.send({
					'status_code': 400,
					'message': 'Please enter the option.'
				});
			}

			async.waterfall([
			function(cb) {
				if (option === 'all') {
					getConceptListAllUnmapped ('true', concepts, function(){
						cb(null);
					});
				}
				else if (option === 'mapped') {
					getConceptListMapped (syllabusId, gradeId, chapterId, concepts, function(){
						cb(null);
					});
				}
				else if (option === 'unmapped') {
					getConceptListAllUnmapped ('false', concepts, function(){
						cb(null);
					});
				}
			},	
			function(cb) {
				if (!concepts)
					concepts = [];

				console.log('Succeeded to get concepts.');

				return res.send({
					'status_code': 200,
					'option': option,
					'concepts': concepts
				});
			}]);
		},
		/*
		 * param : grade
		 */
		getChapters_old = function(req, res) {
			if (!req.param('grade')) {
				console.log('Failed to get chapters.');
				res.send({
					'status_code': 400,
					'message': 'Please enter the grade identifier.'
				});
			}

			async.waterfall([
			function(cb) {
				ChapterModel.find({
					'grade': req.param('grade')
				}, {
					'title': 1,
					'order': 1
				}, {
					sort: {'order': 1}
				}, function(err, chapters) {
					if (err || !chapters || chapters.length <= 0) {
						console.log('Failed to get chapters.');
						res.send({
							'status_code': 200,
							'message': 'The chapters was not got.',
							'grade': req.param('grade'),
							'chapters': []
						});
					} else {
						console.log('Succeeded to get chapters.');
						res.send({
							'status_code': 200,
							'message': 'The chapters was got successfully.',
							'grade': req.param('grade'),
							'chapters': chapters
						});
					}
				});
			}]);
		},
		/*
		 * param: grade
		 *        chapter
		 */
		getConcepts_old = function(req, res) {
			if (!req.param('grade')) {
				console.log('Failed to get concepts.');
				res.send({
					'status_code': 400,
					'message': 'Please enter the grade identifier.'
				});
			}

			if (!req.param('chapter')) {
				console.log('Failed to get concepts.');
				res.send({
					'status_code': 400,
					'message': 'Please enter the chapter identifier.'
				});
			}

			async.waterfall([
			function(cb) {
				ConceptModel.find({
					'grade': req.param('grade'),
					'chapter': req.param('chapter')
				}, {
					'title': 1,
					'order': 1
				}, {
					sort: {'order': 1}
				}, function(err, concepts){
					if (err || !concepts || concepts.length <= 0) {
						console.log('Failed to get concepts.');
						res.send({
							'status_code': 200,
							'message': 'The concepts was not got.',
							'chapter': req.param('chapter'),
							'concepts': []
						});
					} else {
						console.log('Succeeded to get concepts.');
						res.send({
							'status_code': 200,
							'message': 'The concepts was got successfully.',
							'chapter': req.param('chapter'),
							'concepts': concepts
						});
					}
				});
			}]);
		},
		/*
		 * param: 
		 * 
		 */
		getLinks = function(req, res) {
			
			var kind = req.param('kind');
			var syllabus_id = req.param('syllabus');
			var grade_id = req.param('grade');
			var chapter_id = req.param('chapter');
			var concept_id = req.param('concept');

			var query;

			var gradeNames = [];
			var chapterNames = [];
			var conceptNames = [];
			var testNames = [];

			if (!kind) {
				console.log('Failed to get links.');
				return res.send({
					'status_code': 400,
					'message': 'Please enter the kind of link.'
				});
			}

			if (kind === 'grade') {
				if (!syllabus_id) {
					console.log('Failed to get links.');
					return res.send({
						'status_code': 400,
						'message': 'Please enter the syllabus id.Grade'
					});
				}

				query = {
					'kind': kind,
					'syllabus': syllabus_id
				};
				
			}
			else if (kind === 'chapter') {
				if (!syllabus_id || !grade_id) {
					console.log('Failed to get links.');
					return res.send({
						'status_code': 400,
						'message': 'Please enter the syllabus id.Chapter'
					});
				}

				query = {
					'kind': kind,
					'syllabus': syllabus_id,
					'grade': grade_id
				};
			}
			else if (kind === 'concept') {
				if (!syllabus_id || !grade_id || !chapter_id) {
					console.log('Failed to get links.');
					return res.send({
						'status_code': 400,
						'message': 'Please enter the syllabus id.Concept'
					});
				}

				query = {
					'kind': kind,
					'syllabus': syllabus_id,
					'grade': grade_id,
					'chapter': chapter_id
				};
			}
			else if (kind === 'test') {
				if (!syllabus_id || !grade_id || !chapter_id || !concept_id) {
					console.log('Failed to get links.');
					return res.send({
						'status_code': 400,
						'message': 'Please enter the syllabus id.Test'
					});
				}

				query = {
					'kind': kind,
					'syllabus': syllabus_id,
					'grade': grade_id,
					'chapter': chapter_id,
					'concept': concept_id
				};
			}
			else {
				console.log('Failed to get links.');
				return res.send({
					'status_code': 400,
					'message': 'Please enter the kind of link.'
				});
			}

			async.waterfall([
			function(cb) {
				GradeModel.find({}, function(err, grades){
				
					if (err || !grades || grades.length <= 0) {
						console.log('Failed to get grade name list.');
						res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Please try again later.'
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
				ChapterModel.find({}, function(err, chapters){
					if (err || !chapters || chapters.length <= 0) {
						console.log('Failed to get chapter name list.');
						res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Please try again later.'
						});
					} else {
						var len = chapters.length;
						for (var i = 0; i < len; i++) {
							var chapter = chapters[i];
							chapterNames[chapter._id] = chapter.title;
						}
						cb(null);
					}
				});
			},
			function(cb) {
				ConceptModel.find({}, function(err, concepts){
					if (err || !concepts || concepts.length <= 0) {
						console.log('Failed to get concept name list.');
						res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Please try again later.'
						});
					} else {
						var len = concepts.length;
						for (var i = 0; i < len; i++) {
							var concept = concepts[i];
							conceptNames[concept._id] = concept.title;
						}
						cb(null);
					}
				});
			},
			function(cb) {
				TestModel.find({}, function(err, tests){
					if (err || !tests || tests.length <= 0) {
						console.log('Failed to get question name list.');
						res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Please try again later.'
						});
					} else {
						var len = tests.length;
						for (var i = 0; i < len; i++) {
							var test = tests[i];
							testNames[test._id] = test.question;
						}
						cb(null);
					}
				});
			},
			
			function(cb) {
				LinkModel.find(
					query,
				{
				}, {
					sort: {'order': 1}
				}, function(err, links){
					if (err || !links) {
						console.log('Failed to get links.');
						res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Please try again later.'
						});
					} else {
						cb(null, links);
					}
				});
			},
			
			function(links, cb) {
				var resLinks = [];
				var len = links.length;
				console.log(len);
				for (var i = 0; i < len; i++) {
					var linkInfo = links[i];
					if (kind === 'grade') {
						resLinks.push({
							'order': linkInfo.order,
							'grade_id': linkInfo.grade,
							'grade_title': gradeNames[linkInfo.grade]
						});
					} else if (kind === 'chapter') {
						resLinks.push({
							'order': linkInfo.order,
							'chapter_id': linkInfo.chapter,
							'chapter_title': chapterNames[linkInfo.chapter]
						});
					} else if (kind === 'concept') {
						resLinks.push({
							'order': linkInfo.order,
							'concept_id': linkInfo.concept,
							'concept_title': conceptNames[linkInfo.concept]
						});
					} else if (kind === 'test') {
						resLinks.push({
							'order': linkInfo.order,
							'test_id': linkInfo.test,
							'test_title': testNames[linkInfo.test]
						});
					}	
				}

				console.log('Succeeded to get links.');
				res.send({
					'status_code': 200,
					'links': resLinks
				});
			}
			]);
		},
		/*
		 * param: registered_begin
		 *        registered_end
		 *        signin_begin
		 *        signin_end
		 *        verified_status
		 *        grades
		 */
		downloadUsers = function(req, res) {
			var query = {};
			var registered_begin_date = new Date(req.param('registered_begin'));
			var registered_end_date = new Date(req.param('registered_end'));
			var signin_begin_date = new Date(req.param('signin_begin'));
			var signin_end_date = new Date(req.param('signin_end'));

			if (registered_begin_date.toString() != 'Invalid Date' ||
				registered_end_date.toString() != 'Invalid Date')
			{
				query.date = {};
				if (registered_begin_date.toString() != 'Invalid Date')
					query.date.$gte = registered_begin_date;
				if (registered_end_date.toString() != 'Invalid Date')
					query.date.$lte = registered_end_date;
			}

			if (signin_begin_date.toString() != 'Invalid Date' ||
				signin_end_date.toString() != 'Invalid Date')
			{
				query.logged_date = {};
				if (signin_begin_date.toString() != 'Invalid Date')
					query.logged_date.$gte = signin_begin_date;
				if (signin_end_date.toString() != 'Invalid Date')
					query.logged_date.$lte = signin_end_date;
			}

			if (req.param('verified_status') === 'yes')
				query.activation = '';
			else if (req.param('verified_status') === 'no')
				query.activation = {$ne: ''};

			if (req.param('grades')) {
				var grades = req.param('grades');
				if (grades.length > 0) {
					query.grade = {$in: grades};
				}
			}

			async.waterfall([
			function(cb) {
				UserModel.find(query, {}, {sort: {'date': 1}}, function(err, users) {
					if (err || !users) {
						console.log('Failed to download users.');
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Download was not successful. Please try again later.'
						});
					}

					cb(null, users);
				});
			},
			function(users, cb) {
				GradeModel.find({}, {'grade': 1}, function(err, grades) {
					if (err) {
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Download was not successful. Please try again later.'
						});
					}

					var gradeNames = [];
					if (grades) {
						var len = grades.length;
						for (var i = 0; i < len; i++) {
							gradeNames[grades[i]._id] = grades[i].grade;
						}
					}

					cb(null, users, gradeNames);
				});
			},
			function(users, grades, cb) {
				var rootPath = __dirname.substring(0, __dirname.lastIndexOf('/'));
				var date = new Date();
				var filename = 'users-' + dateFormat(date, 'yymmddHHMMss') + '.csv';
				var filePath = rootPath + '/tmp/' + filename;

				var delimiter = ',';
				var data = 'Name' + delimiter;
				data += 'Email Address' + delimiter;
				data += 'Name of School' + delimiter;
				data += 'Address of School' + delimiter;
				data += 'City of School' + delimiter;
				data += 'PostalCode of School' + delimiter;
				data += 'Country of School' + delimiter;
				data += 'Grade' + delimiter;
				data += 'Section / Room' + delimiter;
				data += 'Verified' + delimiter;
				data += 'Disabled' + delimiter;
				data += 'Registered Date' + delimiter;
				data += 'Last Signin Date';
				data += '\n';

				var len = users.length;
				for (var i = 0; i < len; i++) {
					var user = users[i];
					data += '"' + user.name + '"' + delimiter;
					data += '"' + user.email + '"' + delimiter;
					data += '"' + user.school_name + '"' + delimiter;
					data += '"' + user.school_addr + '"' + delimiter;
					data += '"' + user.school_city + '"' + delimiter;
					data += '"' + user.school_postalcode + '"' + delimiter;
					data += '"' + user.school_country + '"' + delimiter;
					data += '"' + grades[user.grade] + '"' + delimiter;
					data += '"' + user.section + '"' + delimiter;

					if (user.activation == '')
						data += 'yes' + delimiter;
					else
						data += 'no' + delimiter;

					if (user.disabled === 'true')
						data += 'yes' + delimiter;
					else
						data += 'no' + delimiter;

					data += dateFormat(user.date, 'yyyy-mm-dd HH:MM:ss') + delimiter;
					data += dateFormat(user.logged_date, 'yyyy-mm-dd HH:MM:ss');
					data += '\n';

					if (i + 1 % 10 == 0) {
						fs.appendFileSync(filePath, data);
						data = '';
					}
				}

				fs.appendFileSync(filePath, data);
				
				// send file to client
				if (!fs.existsSync(filePath)) {
					return res.send({
						'status_code': 400,
						'message': 'Sorry. Something went wrong. Download was not successful. Please try again later.'
					});
				}

				res.send({
					'status_code': 200,
					'message': 'The users was downloaded successfully.',
					'filename': filename
				});
			}]);
		},
		downloadReports = function(req, res) {
			var query = {};
			var reported_begin_date = new Date(req.param('reported_begin'));
			var reported_end_date = new Date(req.param('reported_end'));

			if (reported_begin_date.toString() != 'Invalid Date' ||
				reported_end_date.toString() != 'Invalid Date')
			{
				query.date = {};
				if (reported_begin_date.toString() != 'Invalid Date')
					query.date.$gte = reported_begin_date;
				if (reported_end_date.toString() != 'Invalid Date')
					query.date.$lte = reported_end_date;
			}

			async.waterfall([
			function(cb) {
				ReportModel.find(query, function(err, results) {
					if (err) {
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. Download was not successful. Please try again later.'
						});
					}

					var rootPath = __dirname.substring(0, __dirname.lastIndexOf('/'));
					var date = new Date();
					var filename = 'reports-' + dateFormat(date, 'yymmddHHMMss') + '.csv';
					var filePath = rootPath + '/tmp/' + filename;

					var delimiter = ',';
					var data = 'Date' + delimiter;
					data += 'Reported User' + delimiter;
					data += 'Reporter' + delimiter;
					data += 'Reason' + delimiter;
					data += '\n';

					fs.appendFileSync(filePath, data);

					if (results)
						reportData = results;
					else
						reportData = [];
					
					reportsIndex = -1;
					saveReportsToFile(req, res, filePath, filename);
				});
			}]);
		},
		saveReportsToFile = function(req, res, filePath, filename) {
			reportIndex++;
			if (reportIndex >= reportData.length) {
				return downloadReportsFinish(req, res, filename);
			}

			var report = reportData[reportIndex];

			async.waterfall([
			function(cb) {
				UserModel.findOne({'_id': report.user}, function(err, user) {
					var username = '';
					if (!err && user)
						username = user.name;

					cb(null, username);
				});
			},
			function(username, cb) {
				UserModel.findOne({'_id': report.reporter}, function(err, user) {
					var reportername = '';
					if (!err && user)
						reportername = user.name;

					cb(null, username, reportername);
				});
			},
			function(username, reportername, cb) {
				var delimiter = ',';
				var data = dateFormat(report.date, 'yyyy-mm-dd HH:MM:ss') + delimiter;
				data += '"' + username + '"' + delimiter;
				data += '"' + reportername + '"' + delimiter;
				data += '"' + report.reason + '"' + delimiter;
				data += '\n';

				fs.appendFileSync(filePath, data);
				saveReportsToFile(req, res, filePath, filename);
			}]);
		},
		downloadReportsFinish = function(req, res, filename) {
			reportData = [];
			reportIndex = -1;

			res.send({
				'status_code': 200,
				'message': 'The reports was downloaded successfully.',
				'filename': filename
			});
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

			UserModel.find({
				$or: [
					{'name': {$regex: regexp}},
					{'email': search_text}
				]
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

						resUsers.push({
							'id': users[i]._id,
							'name': users[i].name,
							'photo': photo
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
		},
		getUser = function(req, res) {
			if (!req.param('user_id')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the user identifier.'
				});
			}

			async.waterfall([
			function(cb) {
				UserModel.findOne({
					'_id': req.param('user_id')
				}, {
					'name': 1,
					'email': 1,
					'school_name': 1,
					'grade': 1,
					'section': 1,
					'photo': 1,
					'activation': 1,
					'disabled': 1
				}, function(err, user){
					if (err || !user) {
						return res.send({
							'status_code': 400,
							'message': 'Not found user.'
						});
					} else {
						cb(null, user);
					}
				});
			},
			function(user, cb) {
				GradeModel.findOne({'_id': user.grade}, function(err, grade) {
					if (err || !grade) {
						user.grade = '';
					} else {
						user.grade = grade.grade;
					}

					if (user.photo == '')
						user.photo = '/images/guest.png';

					if (user.activation == '')
						user.activation = 'Verified';
					else
						user.activation = 'Not Verified';

					if (user.disabled === 'true')
						user.disabled = 'Disabled';
					else
						user.disabled = 'Enabled';

					return res.send({
						'status_code': 200,
						'message': 'The user was got successfully.',
						'user': user
					});
				});
			}]);
		},
		disableUser = function(req, res) {
			if (!req.param('user_id')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the user identifier.'
				});
			}

			if (!req.param('disable')) {
				return res.send({
					'status_code': 400,
					'message': 'Please enter the status.'
				});
			}

			async.waterfall([
			function(cb) {
				UserModel.update({
					'_id': req.param('user_id')
				}, {
					$set: {'disabled': req.param('disable')}
				}, function(err, result) {
					if (err) {
						res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. The user status was not changed. Please try again later.'
						});
					} else {
						res.send({
							'status_code': 200,
							'message': 'The user status was changed successfully.'
						});
					}
				});
			}]);
		},
		renderExportContentsPage = function(req, res) {
			async.waterfall([
			function(cb) {
				GradeModel.find({}, {'grade': 1}, {sort: {'order': 1}}, function(err, grades) {
					if (err || !grades || grades.length <= 0)
						res.render('admin/export-contents', {'grades': []});
					else
						res.render('admin/export-contents', {'grades': grades});
				});
			}]);
		},
		/*
		 * export contents
		 */
		export_concepts = [],
		export_concept_index = -1,
		export_concept_count = 0,
		export_grades = [],
		export_chapters = [],
		export_record = '',
		export_records = '',
		export_max_videos = 0,
		export_max_references = 0,
		export_filename = '',
		export_filepath = '',
		
		exportContents = function(req, res) {
			if (export_concept_count > 0) {
				console.log('Exporting contents.');
				return res.send({
					'status_code': 400,
					'message': 'Sorry. Something went wrong. The contents was not exported. Please try again later.'
				});
			}

			var query = {};
			if (req.param('grades')) {
				var grades = req.param('grades');
				if (grades.length > 0) {
					query.grade = {$in: grades};
				}
			}

			async.waterfall([
			function(cb) {
				LinkModel.find(query, {}, {
					sort: {'grade_order': 1, 'chapter_order': 1, 'order': 1}
				}, function(err, concepts) {
					if (err) {
						console.log('Failed to export contents.');
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. The contents was not exported. Please try again later.'
						});
					}

					var rootPath = __dirname.substring(0, __dirname.lastIndexOf('/'));
					var date = new Date();

					export_filename = 'contents-' + dateFormat(date, 'yymmddHHMMss') + '.csv';
					export_filepath = rootPath + '/tmp/' + export_filename;

					export_concept_index = -1;
					export_grades = [];
					export_chapters = [];
					export_max_videos = 0;
					export_max_references = 0;
					export_record = '';

					if (concepts) {
						export_concepts = concepts;
						export_concept_count = concepts.length;
					} else {
						export_concepts = [];
						export_concept_count = 0;
					}

					cb(null);
				});
			},
			function(cb) {
				VideoModel.aggregate([
					{$match: query},
					{$group: {_id: '$concept', count: {$sum: 1}}}
				], function(err, result) {
					if (!err && result) {
						var len = result.length;
						for (var i = 0; i < len; i++) {
							if (export_max_videos < result[i].count)
								export_max_videos = result[i].count
						}
					}

					cb(null);
				});
			},
			function(cb) {
				ReferenceModel.aggregate([
					{$match: query},
					{$group: {_id: '$concept', count: {$sum: 1}}}
				], function(err, result) {
					if (!err && result) {
						var len = result.length;
						for (var i = 0; i < len; i++) {
							if (export_max_references < result[i].count)
								export_max_references = result[i].count
						}
					}

					cb(null);
				});
			},
			function(cb) {
				var delimiter = ',';
				export_records = 'Grade' + delimiter;
				export_records += 'Chapter Name' + delimiter;
				export_records += 'Concept Name' + delimiter;
				export_records += 'Concept Description' + delimiter;
				export_records += 'Concept Image' + delimiter;
				export_records += 'Source URL - Image' + delimiter;
				export_records += 'Credit - Image';

				for (var i = 1; i <= export_max_videos; i++) {
					export_records += delimiter + 'Concept Video ' + i;
				}

				for (var i = 1; i <= export_max_references; i++) {
					export_records += delimiter + 'Concept Reference URL ' + i;
				}

				export_records += '\n';

				exportGradeOfConcept(req, res);
			}]);
		},
		exportGradeOfConcept = function(req, res) {
			export_concept_index++;
			if (export_concept_index >= export_concept_count) {
				return exportContentsFinish(req, res);
			}
			export_record = '';

			var concept = export_concepts[export_concept_index];

			if (!export_grades[concept.grade]) {
				async.waterfall([
				function(cb) {
					GradeModel.findOne({'_id': concept.grade}, {'grade':1}, {}, function(err, grade) {
						if (err || !grade)
							export_record = '';
						else {
							export_grades[concept.grade] = grade.grade;
							export_record = grade.grade;
						}

						exportChapterOfConcept(req, res);
					});
				}]);
			} else {
				export_record = export_grades[concept.grade];
				exportChapterOfConcept(req, res);
			}
		},
		exportChapterOfConcept = function(req, res) {
			var concept = export_concepts[export_concept_index];

			if (!export_chapters[concept.chapter]) {
				async.waterfall([
				function(cb) {
					ChapterModel.findOne({'_id': concept.chapter}, {'title':1}, {}, function(err, chapter) {
						if (err || !chapter)
							export_record += ',';
						else {
							export_chapters[concept.chapter] = chapter.title;
							export_record += ',"' + chapter.title + '"';
						}

						exportOneConcept(req, res);
					});
				}]);
			} else {
				export_record += ',"' + export_chapters[concept.chapter] + '"';
				exportOneConcept(req, res);
			}
		},
		exportOneConcept = function(req, res) {
			var concept = export_concepts[export_concept_index];
			
			export_record += ',"' + concept.title + '"';
			export_record += ',"' + concept.text + '"';
			export_record += ',"' + concept.image_url + '"';
			export_record += ',"' + concept.image_source + '"';
			export_record += ',"' + concept.image_credit + '"';

			exportVideosOfConcept(req, res);
		}
		exportVideosOfConcept = function(req, res) {
			var concept = export_concepts[export_concept_index];

			async.waterfall([
			function(cb) {
				VideoModel.find({
					'concept': concept._id,
					'owner': 'admin'
				}, {
					'url': 1
				}, {
					sort: {'defaulted_admin': -1}
				}, function(err, videos){
					var len = 0;
					if (!err && videos && videos.length > 0)
						len = videos.length;

					if (len > export_max_videos)
						len = export_max_videos;

					for (var i = 0; i < len; i++)
						export_record += ',"https://www.youtube.com/watch?v=' + videos[i].url + '"';

					for (var i = 0; i < export_max_videos - len; i++)
						export_record += ',';

					exportReferencesOfConcept(req, res);
				});
			}]);
		},
		exportReferencesOfConcept = function(req, res) {
			var concept = export_concepts[export_concept_index];

			async.waterfall([
			function(cb) {
				ReferenceModel.find({
					'concept': concept._id,
					'owner': 'admin'
				}, {
					'url': 1
				}, {
					sort: {'defaulted_admin': -1}
				}, function(err, references){
					var len = 0;
					if (!err && references && references.length > 0)
						len = references.length;

					if (len > export_max_references)
						len = export_max_references;

					for (var i = 0; i < len; i++)
						export_record += ',"' + references[i].url + '"';

					for (var i = 0; i < export_max_references - len; i++)
						export_record += ',';

					exportToFile(req, res);
				});
			}]);
		},
		exportToFile = function(req, res) {
			export_records += export_record + '\n';

			if ((export_concept_index + 1) % 10 == 0) {
				fs.appendFile(export_filepath, export_records, function(err) {
					if (err) {
						console.log('Failed to export contents.');
						console.log(err);

						exportVariablesInit();
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. The contents was not exported. Please try again later.'
						});
					}

					export_records = '';
					exportGradeOfConcept(req, res);
				});
			} else {
				exportGradeOfConcept(req, res);
			}
		},
		exportContentsFinish = function(req, res) {
			async.waterfall([
			function(cb) {
				fs.appendFile(export_filepath, export_records, function(err) {
					if (err) {
						console.log('Failed to export contents.');
						console.log(err);

						exportVariablesInit();
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. The contents was not exported. Please try again later.'
						});
					} else {
						console.log('Succeeded to export contents.');
						res.send({
							'status_code': 200,
							'message': 'The contents was exported successfully.',
							'filename': export_filename
						});

						exportVariablesInit();
					}
				});
			}]);
		},
		importConcepts = function(req, res) {
			var filepath = '';
			var ext = '';

			for (var field in req.files) {
				if (req.files[field].originalFilename == ''
					|| req.files[field].size == 0 
					|| filepath != '')
				{
					if (fs.existsSync(req.files[field].path))
						fs.unlinkSync(req.files[field].path);
					continue;
				}

				var filename = req.files[field].originalFilename;
				ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
				if (ext != 'csv') {
					if (fs.existsSync(req.files[field].path))
						fs.unlinkSync(req.files[field].path);
					continue;
				}

				filepath = req.files[field].path;
			}

			if (ext != 'csv') {
				return res.send({
					'status_code': 400,
					'message': 'Please select only *.csv file.'
				});
			}

			if (isImporting) {
				if (fs.existsSync(filepath))
					fs.unlinkSync(filepath);

				return res.send({
					'status_code': 400,
					'message': 'Importing other. Please try again after serveral minutes.'
				});
			}

			isImporting = true;
			var parse = require('csv-parse');
			var parser = parse({delimiter: ','}, function(err, data){
				if (fs.existsSync(filepath))
					fs.unlinkSync(filepath);

				if (err || !data || data.length <= 0) {
					console.log(err);
					console.log(data);
					isImporting = false;
					return res.send({
						'status_code': 400,
						'error':err,
						'message': 'Sorry. Something went wrong. The content was not imported. Please try again later.'
					});
				}

				conceptFieldIndexs = {
					code: -1,
					concept: -1,
					text: -1,
					image: -1,
					image_source: -1,
					image_credit: -1,
					image2: -1,
					image2_source: -1,
					image2_credit: -1,
					videos: [],
					references: []
				};

				var fieldNames = data[0];
				var len = fieldNames.length;

				// get field index
				for (var i = 0; i < len; i++) {
					if (fieldNames[i] == 'Code') {
						conceptFieldIndexs.code = i;
					} else if (fieldNames[i] == 'Concept Name') {
						conceptFieldIndexs.concept = i;
					} else if (fieldNames[i] == 'Concept Description') {
						conceptFieldIndexs.text = i;
					} else if (fieldNames[i] == 'Concept Image 1') {
						conceptFieldIndexs.image = i;
					} else if (fieldNames[i] == 'Source URL - Image 1') {
						conceptFieldIndexs.image_source = i;
					} else if (fieldNames[i] == 'Credit - Image 1') {
						conceptFieldIndexs.image_credit = i;
					} else if (fieldNames[i] == 'Concept Image 2') {
						conceptFieldIndexs.image2 = i;
					} else if (fieldNames[i] == 'Source URL - Image 2') {
						conceptFieldIndexs.image2_source = i;
					} else if (fieldNames[i] == 'Credit - Image 2') {
						conceptFieldIndexs.image2_credit = i;
					} else if (fieldNames[i].indexOf('Concept Video') === 0) {
						conceptFieldIndexs.videos.push(i);
					} else if (fieldNames[i].indexOf('Concept Reference URL') === 0) {
						conceptFieldIndexs.references.push(i);
					}
				}

				if (conceptFieldIndexs.code == -1 || conceptFieldIndexs.concept == -1 || conceptFieldIndexs.image == -1 || conceptFieldIndexs.image2 == -1 )
				{
					isImporting = false;
					return res.send({
						'status_code': 400,
						'message': 'Sorry. Something went wrong. The content was not imported. Please try again later.'
					});
				}

				res.send({
					'status_code': 200,
					'message': 'The contents are being imported.'
				});

				records = data;
				recordCount = records.length - 1;
				recordIndex = 0;
				failedRows = [];
				defaultedVideo = 'true';
				defaultedReference = 'true';

				importOneConcept(req, res);
			});

			fs.createReadStream(filepath).pipe(parser);
		},
		importOneConcept = function(req, res) {
			if (global.socket != null) {
				global.socket.emit('resImporting', {
					'total_count': recordCount,
					'completed_count': recordIndex
				});
			}

			recordIndex++;
			if (recordIndex > recordCount) {
				return importFinish(req, res);
			}

			var record = records[recordIndex];
			var content = {
				code: '',
				concpet: '',
				text: '',
				image: '',
				image_source: '',
				image_credit: '',
				image2: '',
				image2_source: '',
				image2_credit: '',
				videos: [],
				references: []
			};

			if (conceptFieldIndexs.code >= 0)
				content.code = utils.trim(record[conceptFieldIndexs.code]);

			if (conceptFieldIndexs.concept >= 0)
				content.concept = utils.trim(record[conceptFieldIndexs.concept]);

			if (conceptFieldIndexs.text >= 0)
				content.text = utils.trim(record[conceptFieldIndexs.text]);

			if (conceptFieldIndexs.image >= 0)
				content.image = utils.trim(record[conceptFieldIndexs.image]);

			if (conceptFieldIndexs.image_source >= 0)
				content.image_source = utils.trim(record[conceptFieldIndexs.image_source]);

			if (conceptFieldIndexs.image_credit >= 0)
				content.image_credit = utils.trim(record[conceptFieldIndexs.image_credit]);

			if (conceptFieldIndexs.image2 >= 0)
				content.image2 = utils.trim(record[conceptFieldIndexs.image2]);

			if (conceptFieldIndexs.image2_source >= 0)
				content.image2_source = utils.trim(record[conceptFieldIndexs.image2_source]);

			if (conceptFieldIndexs.image2_credit >= 0)
				content.image2_credit = utils.trim(record[conceptFieldIndexs.image2_credit]);

			for (var j = 0; j < conceptFieldIndexs.videos.length; j++) {
				content.videos.push(utils.trim(record[conceptFieldIndexs.videos[j]]));
			}

			for (var j = 0; j < conceptFieldIndexs.references.length; j++) {
				content.references.push(utils.trim(record[conceptFieldIndexs.references[j]]));
			}

			if (content.code == '' ||
				content.concept == '')
			{
				failedRows.push(recordIndex);
				importOneConcept(req, res);
			} else {
				_importOneConcept(req, res, content);
			}
		},
		_importOneConcept = function(req, res, content) {
			async.waterfall([
			function(count, cb) {
				ConceptModel.findOne({
					'code': content.code,
					'title': content.concept
				}, function(err, concept) {
					if (err) {
						failedRows.push(recordIndex);
						importOneConcept(req, res);
					} else if (!concept) {
						ConceptModel.create({
							'code': content.code,
							'title': content.concept,
							'text': content.text,
							'image': content.image,
							'image_url': content.image,
							'image_source': content.image_source,
							'image_credit': content.image_credit,
							'image2': content.image2,
							'image2_url': content.image2,
							'image2_source': content.image2_source,
							'image2_credit': content.image2_credit
						}, function(err, new_concept, result) {
							if (err || !new_concept) {
								failedRows.push(recordIndex);
								importOneConcept(req, res);
							} else {
								downloadConceptImage(new_concept._id, content.image, function(){
									downloadConceptImage2(new_concept._id, content.image2, function(){
										importVideosOfContent(req, res, content, new_concept._id);
									});
								});
							}
						});
					} else {
						ConceptModel.update({
							'_id': concept._id
						}, {
							'code': content.code,
							'title': content.concept,
							'text': content.text,
							'image': content.image,
							'image_url': content.image,
							'image_source': content.image_source,
							'image_credit': content.image_credit,
							'image2': content.image2,
							'image2_url': content.image2,
							'image2_source': content.image2_source,
							'image2_credit': content.image2_credit,
							'updated_date': new Date()
						}, function(err, result) {
							if (err) {
								failedRows.push(recordIndex);
								importOneConcept(req, res);
							} else {
								var path = __dirname.substring(0, __dirname.lastIndexOf('/')) + '/files' + concept.image;
								if (concept.image != '' && fs.existsSync(path))
									fs.unlinkSync(path);

								var path2 = __dirname.substring(0, __dirname.lastIndexOf('/')) + '/files' + concept.image2;
								if (concept.image2 != '' && fs.existsSync(path2))
									fs.unlinkSync(path2);

								downloadConceptImage(concept._id, content.image, function(){
									downloadConceptImage2(concept._id, content.image2, function(){
										importVideosOfContent(req, res, content, concept._id);
									});
								});
							}
						});
					}
				});
			}]);
		},
		importMappings = function(req, res) {
			var filepath = '';
			var ext = '';

			for (var field in req.files) {
				if (req.files[field].originalFilename == ''
					|| req.files[field].size == 0 
					|| filepath != '')
				{
					if (fs.existsSync(req.files[field].path))
						fs.unlinkSync(req.files[field].path);
					continue;
				}

				var filename = req.files[field].originalFilename;
				ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
				if (ext != 'csv') {
					if (fs.existsSync(req.files[field].path))
						fs.unlinkSync(req.files[field].path);
					continue;
				}

				filepath = req.files[field].path;
			}

			if (ext != 'csv') {
				return res.send({
					'status_code': 400,
					'message': 'Please select only *.csv file.'
				});
			}

			if (isImporting) {
				if (fs.existsSync(filepath))
					fs.unlinkSync(filepath);

				return res.send({
					'status_code': 400,
					'message': 'Importing other. Please try again after serveral minutes.'
				});
			}

			isImporting = true;
			var parse = require('csv-parse');
			var parser = parse({delimiter: ','}, function(err, data){
				if (fs.existsSync(filepath))
					fs.unlinkSync(filepath);

				if (err || !data || data.length <= 0) {
					console.log(err);
					console.log(data);
					isImporting = false;
					return res.send({
						'status_code': 400,
						'error': err,
						'message': 'Sorry. Something went wrong. The content was not imported. Please try again later.'
					});
				}

				mappingFieldIndexs = {
					syllabus: -1,
					grade: -1,
					chapter: -1,
					concept_code: -1
				};

				var fieldNames = data[0];
				var len = fieldNames.length;

				logger.trace();

				// get field index
				for (var i = 0; i < len; i++) {
					if (fieldNames[i] == 'Syllabus') {
						mappingFieldIndexs.syllabus = i;
					} else if (fieldNames[i] == 'Grade Name') {
						mappingFieldIndexs.grade = i;
					} else if (fieldNames[i] == 'Chapter Name') {
						mappingFieldIndexs.chapter = i;
					} else if (fieldNames[i] == 'Concept Code') {
						mappingFieldIndexs.concept_code = i;
					}
				}

				if (mappingFieldIndexs.syllabus == -1 ||
						mappingFieldIndexs.grade == -1 ||
						mappingFieldIndexs.chapter == -1 ||
						mappingFieldIndexs.concept_code == -1)
				{
					isImporting = false;
					return res.send({
						'status_code': 400,
						'message': 'Sorry. Something went wrong. The content was not imported. Please try again later.'
					});
				}

				res.send({
					'status_code': 200,
					'message': 'The contents are being imported.'
				});

				records = data;
				recordCount = records.length - 1;
				recordIndex = 0;
				failedRows = [];

				importOneMapping(req, res);
			});

			fs.createReadStream(filepath).pipe(parser);
		},
		importOneMapping = function(req, res) {
			if (global.socket != null) {
				global.socket.emit('resImporting', {
					'total_count': recordCount,
					'completed_count': recordIndex
				});
			}

			recordIndex++;
			if (recordIndex > recordCount) {
				return importFinish(req, res);
			}

			var record = records[recordIndex];
			var content = {
				syllabus: '',
				grade: '',
				chapter: '',
				code: ''
			};

			if (mappingFieldIndexs.syllabus >= 0)
				content.syllabus = utils.trim(record[mappingFieldIndexs.syllabus]);

			if (mappingFieldIndexs.grade >= 0)
				content.grade = utils.trim(record[mappingFieldIndexs.grade]);

			if (mappingFieldIndexs.chapter >= 0)
				content.chapter = utils.trim(record[mappingFieldIndexs.chapter]);

			if (mappingFieldIndexs.concept_code >= 0)
				content.code = utils.trim(record[mappingFieldIndexs.concept_code]);

			if (content.syllabus == '' ||
				content.grade == '' ||
				content.chapter == '' ||
				content.code == '')
			{
				failedRows.push(recordIndex);
				importOneMapping(req, res);
			} else {
				importSyllabusOfMapping(req, res, content);
			}
		},
		importSyllabusOfMapping = function(req, res, content) {
			async.waterfall([
			function(cb) {
				SyllabusModel.findOne({'title': content.syllabus}, function(err, syllabus) {
					if (err) {
						failedRows.push(recordIndex);
						importOneMapping(req, res);
					} else if (!syllabus) {
						cb(null);
					} else {
						importGradeOfMapping(req, res, content, syllabus._id);
					}
				});
			},
			function(cb) {
				SyllabusModel.count({}, function(err, count) {
					if (err) {
						logger.trace(err);
						failedRows.push(recordIndex);
						importOneMapping(req, res);
					} else {
						cb(null, count);
					}
				});
			},
			function(count, cb) {
				SyllabusModel.create({
					'title': content.syllabus,
					'order': count + 1
				}, function(err, syllabus, result) {
					if (err || !syllabus) {
						logger.trace(err);
						failedRows.push(recordIndex);
						importOneMapping(req, res);
					} else {
						importGradeOfMapping(req, res, content, syllabus._id);
					}
				});
			}]);
		},
		importGradeOfMapping = function(req, res, content, syllabus_id) {
			async.waterfall([
			function(cb) {
				LinkModel.count({
					'kind': 'grade',
					'syllabus': syllabus_id
				}, function(err, count) {
					if (err) {
						failedRows.push(recordIndex);
						importOneMapping(req, res);
					} else {
						cb(null, count);
					}
				});
			},
			function(count, cb) {
				GradeModel.findOne({
					'grade': content.grade
				}, function(err, grade) {
					if (err) {
						failedRows.push(recordIndex);
						importOneMapping(req, res);
					} else {
						cb(null, count, grade);
					}
				});
			},
			function(count, grade, cb) {
				if (!grade) {

					GradeModel.create({
						'grade': content.grade
					}, function(err, new_grade, result) {
						if (err || !new_grade) {
							failedRows.push(recordIndex);
							importOneMapping(req, res);
						} else {
							cb(null, count, new_grade._id);
						}
					});
				} else {
					cb(null, count, grade._id);
				}
			},
			function(count, grade_id, cb) {
				LinkModel.findOne({
					'kind': 'grade',
					'syllabus': syllabus_id,
					'grade': grade_id
				}, function(err, gradeLink) {
					if (err) {
						failedRows.push(recordIndex);
						importOneMapping(req, res);
					} else if(!gradeLink) {
						LinkModel.create({
							'kind': 'grade',
							'syllabus': syllabus_id,
							'grade': grade_id,
							'order': count + 1
						}, function (err, link, result) {
							if (err) {
								failedRows.push(recordIndex);
								importOneMapping(req, res);
							} else {
								cb(null, grade_id);
							}
						});
					} else {
						cb(null, grade_id);
					}
				});
			},
			function(grade_id, cb) {
				importChapterOfMapping(req, res, content, syllabus_id, grade_id);
			}]);
		},
		importChapterOfMapping = function(req, res, content, syllabus_id, grade_id) {
			async.waterfall([
			function(cb) {
				LinkModel.count({
					'kind': 'chapter',
					'syllabus': syllabus_id,
					'grade': grade_id
				}, function(err, count) {
					if (err) {
						failedRows.push(recordIndex);
						importOneMapping(req, res);
					} else {
						cb(null, count);
					}
				});
			},
			function(count, cb) {
				ChapterModel.findOne({
					'title': content.chapter
				}, function(err, chapter) {
					if (err) {
						failedRows.push(recordIndex);
						importOneMapping(req, res);
					} else {
						cb(null, count, chapter);
					}
				});
			},
			function(count, chapter, cb) {
				if (!chapter) {

					ChapterModel.create({
						'title': content.chapter
					}, function(err, new_chapter, result) {
						if (err || !new_chapter) {
							failedRows.push(recordIndex);
							importOneMapping(req, res);
						} else {
							cb(null, count, new_chapter._id);
						}
					});
				} else {
					cb(null, count, chapter._id);
				}
			},
			function(count, chapter_id, cb) {
				LinkModel.findOne({
					'kind': 'chapter',
					'syllabus': syllabus_id,
					'grade': grade_id,
					'chapter': chapter_id
				}, function(err, chapterLink) {
					if (err) {
						failedRows.push(recordIndex);
						importOneMapping(req, res);
					} else if(!chapterLink) {
						LinkModel.create({
							'kind': 'chapter',
							'syllabus': syllabus_id,
							'grade': grade_id,
							'chapter': chapter_id,
							'order': count + 1
						}, function (err, link, result) {
							if (err) {
								failedRows.push(recordIndex);
								importOneMapping(req, res);
							} else {
								cb(null, chapter_id);
							}
						});
					} else {
						cb(null, chapter_id);
					}
				});
			},
			function(chapter_id, cb) {
				importConceptOfMapping(req, res, content, syllabus_id, grade_id, chapter_id);
			}]);
		},
		importConceptOfMapping = function(req, res, content, syllabus_id, grade_id, chapter_id) {
			async.waterfall([
			function(cb) {
				LinkModel.count({
					'kind': 'concept',
					'syllabus': syllabus_id,
					'grade': grade_id,
					'chapter': grade_id
				}, function(err, count) {
					if (err) {
						failedRows.push(recordIndex);
						importOneMapping(req, res);
					} else {
						cb(null, count);
					}
				});
			},
			function(count, cb) {
				ConceptModel.findOne({
					'code': content.code
				}, function(err, concept) {
					if (err || !concept) {
						failedRows.push(recordIndex);
						importOneMapping(req, res);
					} else {
						cb(null, count, concept._id);
					}
				});
			},
			function(count, concept_id, cb) {
				LinkModel.findOne({
					'kind': 'concept',
					'syllabus': syllabus_id,
					'grade': grade_id,
					'chapter': chapter_id,
					'concept': concept_id
				}, function(err, conceptLink) {
					if (err) {
						failedRows.push(recordIndex);
						importOneMapping(req, res);
					} else if(!conceptLink) {
						LinkModel.create({
							'kind': 'concept',
							'syllabus': syllabus_id,
							'grade': grade_id,
							'chapter': chapter_id,
							'concept': concept_id,
							'order': count + 1
						}, function (err, link, result) {
							if (err) {
								failedRows.push(recordIndex);
								importOneMapping(req, res);
							} else {
								cb(null);
							}
						});
					} else {
						cb(null);
					}
				});
			},
			function(cb) {
				importOneMapping(req, res);
			}]);
		},
		exportVariablesInit = function() {
			export_concepts = [];
			export_concept_index = -1;
			export_concept_count = 0;
			export_grades = [];
			export_chapters = [];
			export_record = '';
			export_records = '';
			export_records2 = '';
			export_max_videos = 0;
			export_max_references = 0;
			export_filename = '';
			export_filepath = '';
		};
	
		
		
		/*
		 *
		 * Import & Export TEST Controller
		 *
		 * */

		renderImportTestsPage = function(req, res) {
			res.render('admin/import-tests');
		},
		renderExportTestsPage = function(req, res) {
			async.waterfall([
			function(cb) {
				GradeModel.find({}, {'grade': 1}, {sort: {'order': 1}}, function(err, grades) {
					if (err || !grades || grades.length <= 0)
						res.render('admin/export-tests', {'grades': []});
					else
						res.render('admin/export-tests', {'grades': grades});
				});
			}]);
		},
		importFinishTest = function(req, res) {
			var len = failedRowsTest.length;
			var failedRowsStr = '';
			for (var i = 0; i < len; i++) {
				if (i > 0)
					failedRowsStr += ', ';
				failedRowsStr += failedRowsTest[i];
			}

			global.socket.emit('resImportTestCompleted', {
				'total_count': recordCountTest,
				'imported_count': recordCountTest - len,
				'failed_rows': failedRowsStr
			});

			isImportingTest = false;
			recordsTest = null;
			testFieldIndexs = null;
			//mappingFieldIndexs = null;
			fieldIndexsTest = null;
			failedRowsTest = null;
			recordCountTest = 0;
			recordIndexTest = 0;
			//videoIndex = 0;
			//refIndex = 0;
			//defaultedVideo = 'true';
			//defaultedReference = 'true';
		},
		/*
		 * export test
		 */
		export_tests = [],
		export_test_index = -1,
		export_test_count = 0,
		export_grades = [],
		export_chapters = [],
		export_concepts = [],
		export_record = '',
		export_records = '',
		export_records2 = '',
		export_filename = '',
		export_filepath = '',
		
		exportTests = function(req, res) {
			if (export_test_count > 0) {
				console.log('Exporting tests.');
				return res.send({
					'status_code': 400,
					'message': 'Sorry. Something went wrong. The test was not exported. Please try again later.'
				});
			}

			var query = {};
			if (req.param('grades')) {
				var grades = req.param('grades');
				if (grades.length > 0) {
					query.grade = {$in: grades};
				}
			}

			async.waterfall([
			function(cb){
				LinkModel.find({'kind':'test','grade':grades},{},
					function(err, links) {
					if (err) {
						console.log('Failed to find Links.');
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. The test was not exported. Please try again later.'
						});
					}	else {
						cb(null,links);
						}
					});
				},
			function(links,cb) {
				var rootPath = __dirname.substring(0, __dirname.lastIndexOf('/'));
					var date = new Date();

					export_filename = 'tests-' + dateFormat(date, 'yymmddHHMMss') + '.csv';
					export_filepath = rootPath + '/tmp/' + export_filename;

					export_record = '';
					
					var delimiter = ',';
					
					export_records += 'Question' + delimiter;
					export_records += 'Option 1' + delimiter;
					export_records += 'Option 2' + delimiter;
					export_records += 'Option 3' + delimiter;
					export_records += 'Option 4' + delimiter;
					export_records += 'Answer';
					
					export_records += '\n';
					
				var len = links.length;
				for (var i = 0; i < len; i++) {
					TestModel.findOne({'_id': links[i].test},{},
					 function(err, tests) {
						if (err) {
							return res.send({
								'status_code': 400,
								'message': 'Sorry. Something went wrong. The test was not exported. Please try again later.'
							});
						}	else {
							cb(null,tests,len);
							++export_test_count;
							}
					});
						
					}
					
			},
			function(tests,len,cb) {
				export_record += '"' + tests.question + '"';
				export_record += ',"' + tests.option1 + '"';
				export_record += ',"' + tests.option2 + '"';
				export_record += ',"' + tests.option3 + '"';
				export_record += ',"' + tests.option4 + '"';
				export_record += ',"' + tests.answer + '",';
				export_record += '\n';
				
				if(export_test_count == len-1){
					export_records += export_record;
				fs.appendFile(export_filepath, export_records, function(err) {
					if (err) {
						console.log('Failed to export tests.');
						console.log(err);

						exportVariablesInitTest();
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. The tests was not exported. Please try again later.'
						});
					} else {
						console.log('Succeeded to export tests.');
						res.send({
							'status_code': 200,
							'message': 'The test was exported successfully.',
							'filename': export_filename
						});

						exportVariablesInitTest();
					}
				});
			}
			
			}
				]);
			},
		
		exportToFileTest = function(req, res) {
			console.log('this');
			console.log(export_record);
			//export_record += export_record + '\n';

		//	if ((export_test_index + 1) % 10 == 0) {
				fs.appendFile(export_filepath, export_records, function(err) {
					console.log('fileTest');
					console.log(export_records);
					if (err) {
						console.log('Failed to export tests.');
						console.log(err);

						exportVariablesInitTest();
						return res.send({
							'status_code': 400,
							'message': 'Sorry. Something went wrong. The tests was not exported. Please try again later.'
						});
					}
				
					//export_record = '';
					exportTestsFinish(req, res);
					//exportGradeOfTest(req, res);
				});
			//} else {
			//	exportGradeOfTest(req, res);
				
		//	}
		},
		importTests = function(req, res) {
		
			var filepath = '';
			var ext = '';

			for (var field in req.files) {
				if (req.files[field].originalFilename == ''
					|| req.files[field].size == 0 
					|| filepath != '')
				{
					if (fs.existsSync(req.files[field].path))
						fs.unlinkSync(req.files[field].path);
					continue;
				}

				var filename = req.files[field].originalFilename;
				ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
				if (ext != 'csv') {
					if (fs.existsSync(req.files[field].path))
						fs.unlinkSync(req.files[field].path);
					continue;
				}

				filepath = req.files[field].path;
			}

			if (ext != 'csv') {
				return res.send({
					'status_code': 400,
					'message': 'Please select only *.csv file.'
				});
			}

			if (isImportingTest) {
				if (fs.existsSync(filepath))
					fs.unlinkSync(filepath);
				return res.send({
					'status_code': 400,
					'message': 'Importing other. Please try again after serveral minutes.'
				});
			}

			isImportingTest = true;
			var parse = require('csv-parse');
			var parser = parse({delimiter: ','}, function(err, data){
				if (fs.existsSync(filepath))
					fs.unlinkSync(filepath);

				if (err || !data || data.length <= 0) {
					console.log(err);
					console.log(data);
					isImportingTest = false;
					return res.send({
						'status_code': 400,
						'message': 'Sorry. Something went wrong. The Test was not imported. Please try again later.'
					});
				}

				testFieldIndexs = {
					code:-1,
					question: -1,
					option1: -1,
					option2: -1,
					option3: -1,
					option4: -1,
					answer: -1					
				};

				var fieldNames = data[0];
				var len = fieldNames.length;

				// get field index
				for (var i = 0; i < len; i++) {
					//console.log('i:' + i);
					if (fieldNames[i] == 'Concept code') {
						testFieldIndexs.code = i;
					} else if (fieldNames[i] == 'Question') {
						testFieldIndexs.question = i;	
					} else if (fieldNames[i] == 'Option 1') {
						testFieldIndexs.option1 = i;
					} else if (fieldNames[i] == 'Option 2') {
						testFieldIndexs.option2 = i;
					} else if (fieldNames[i] == 'Option 3') {
						testFieldIndexs.option3 = i;
					} else if (fieldNames[i] == 'Option 4') {
						testFieldIndexs.option4 = i;
					} else if (fieldNames[i] == 'Answer') {
						testFieldIndexs.answer = i;
					}
					
				}

				if (testFieldIndexs.question == -1)
				{
					isImportingTest = false;
					return res.send({
						'status_code': 400,
						'message': 'Sorry. Something went wrong. The test was not imported. Please try again later.'
					});
				}

				res.send({
					'status_code': 200,
					'message': 'The test are being imported.'
				});
				recordsTest = data;
				recordCountTest = recordsTest.length - 1;
				recordIndexTest = 0;
				failedRowsTest = [];
				
				importOneTest(req, res);
			});

			fs.createReadStream(filepath).pipe(parser);
		},
		importOneTest = function(req, res) {
			if (global.socket != null) {
				global.socket.emit('resImportingTest', {
					'total_count': recordCountTest,
					'completed_count': recordIndexTest
				});
			}

			recordIndexTest++;
			if (recordIndexTest > recordCountTest) {
				return importFinishTest(req, res);
			}

			var record = recordsTest[recordIndexTest];
			var content = {
				code:'',
				question: '',				
				option1: '',
				option2: '',
				option3: '',
				option4: '',
				answer: ''
			};
			
			if (testFieldIndexs.code >= 0)
				content.code = utils.trim(record[testFieldIndexs.code]);

			if (testFieldIndexs.question >= 0)
				content.question = utils.trim(record[testFieldIndexs.question]);

			if (testFieldIndexs.option1 >= 0)
				content.option1 = utils.trim(record[testFieldIndexs.option1]);
				
			if (testFieldIndexs.option2 >= 0)
				content.option2 = utils.trim(record[testFieldIndexs.option2]);
			
			if (testFieldIndexs.option3 >= 0)
				content.option3 = utils.trim(record[testFieldIndexs.option3]);
			
			if (testFieldIndexs.option4 >= 0)
				content.option4 = utils.trim(record[testFieldIndexs.option4]);
			
			if (testFieldIndexs.answer >= 0)
				content.answer = utils.trim(record[testFieldIndexs.answer]);

			if (content.code == '')
			{
				failedRowsTest.push(recordIndexTest);
				importOneTest(req, res);
			} else {
				_importOneTest(req, res, content);
			}
		},
		_importOneTest = function(req, res, content) {
			async.waterfall([
			function(count, cb) {
				TestModel.findOne({
					'question': content.question
				}, function(err, test) {
					if (err) {
						failedRowsTest.push(recordIndexTest);
						importOneTest(req, res);
					} else if (!test) {
						TestModel.create({
							'question': content.question,
							'option1': content.option1,
							'option2': content.option2,
							'option3': content.option3,
							'option4': content.option4,
							'answer': content.answer
						}, function(err, new_test, result) {
							if (err || !new_test) {
								failedRowsTest.push(recordIndexTest);
								importOneTest(req, res);
							} else {
								//NEW CODE
								ConceptModel.findOne({'code': content.code},function(err, res){
									if (err) {
										failedRowsTest.push(recordIndexTest);
										importOneTest(req, res);
									}
									 else if(!res){
												failedRowsTest.push(recordIndexTest);
												importOneTest(req, res);
												}
									 else {
										LinkModel.findOne({'kind':'concept','concept':res._id},function(err,res){
											if (err) {
												failedRowsTest.push(recordIndexTest);
												importOneTest(req, res);
											}	else if(!res){
												failedRowsTest.push(recordIndexTest);
												importOneTest(req, res);
												}
												else {
												LinkModel.create({
													'kind': 'test',
													'syllabus': res.syllabus,
													'grade': res.grade,
													'chapter': res.chapter,
													'concept': res.concept,
													'test': new_test._id
													},function(err,links,res){
															if (err) {
															failedRowsTest.push(recordIndexTest);
															importOneTest(req, res);
															}	else {
																importOneTest(req, res);	
															}
													});
												}
											});
										}
									
									});
								//importOneTest(req, res);
								}
						});
					} else {
						TestModel.update({
							'_id': test._id
						}, {
							'question': content.question,
							'option1': content.option1,
							'option2': content.option2,
							'option3': content.option3,
							'option4': content.option4,
							'answer': content.answer,
							'updated_date': new Date()
						}, function(err, result) {
							if (err) {
								failedRowsTest.push(recordIndexTest);
								importOneTest(req, res);
							}	else {
								importOneTest(req, res);
								}
						});
					}
				});
			}]);
		},
		importMappingsTest = function(req, res) {
			var filepath = '';
			var ext = '';

			for (var field in req.files) {
				if (req.files[field].originalFilename == ''
					|| req.files[field].size == 0 
					|| filepath != '')
				{
					if (fs.existsSync(req.files[field].path))
						fs.unlinkSync(req.files[field].path);
					continue;
				}

				var filename = req.files[field].originalFilename;
				ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
				if (ext != 'csv') {
					if (fs.existsSync(req.files[field].path))
						fs.unlinkSync(req.files[field].path);
					continue;
				}

				filepath = req.files[field].path;
			}

			if (ext != 'csv') {
				return res.send({
					'status_code': 400,
					'message': 'Please select only *.csv file.'
				});
			}

			if (isImporting) {
				if (fs.existsSync(filepath))
					fs.unlinkSync(filepath);

				return res.send({
					'status_code': 400,
					'message': 'Importing other. Please try again after serveral minutes.'
				});
			}

			isImporting = true;
			var parse = require('csv-parse');
			var parser = parse({delimiter: ','}, function(err, data){
				if (fs.existsSync(filepath))
					fs.unlinkSync(filepath);

				if (err || !data || data.length <= 0) {
					console.log(err);
					console.log(data);
					isImporting = false;
					return res.send({
						'status_code': 400,
						'message': 'Sorry. Something went wrong. The Test was not imported. Please try again later.'
					});
				}

				mappingFieldIndexs = {
					syllabus: -1,
					grade: -1,
					chapter: -1,
					concept: -1,
					tests: -1
				};

				var fieldNames = data[0];
				var len = fieldNames.length;

				logger.trace();

				// get field index
				for (var i = 0; i < len; i++) {
					if (fieldNames[i] == 'Syllabus') {
						mappingFieldIndexs.syllabus = i;
					} else if (fieldNames[i] == 'Grade Name') {
						mappingFieldIndexs.grade = i;
					} else if (fieldNames[i] == 'Chapter Name') {
						mappingFieldIndexs.chapter = i;
					} else if (fieldNames[i] == 'Concept Name') {
						mappingFieldIndexs.concept = i;
					} else if (fieldNames[i] == 'Question') {
						mappingFieldIndexs.tests = i;
					}
				}

				if (mappingFieldIndexs.syllabus == -1 ||
						mappingFieldIndexs.grade == -1 ||
						mappingFieldIndexs.chapter == -1 ||
						mappingFieldIndexs.concept == -1 ||
						mappingFieldIndexs.tests == -1)
				{
					isImporting = false;
					return res.send({
						'status_code': 400,
						'message': 'Sorry. Something went wrong. The test was not imported. Please try again later.'
					});
				}

				res.send({
					'status_code': 200,
					'message': 'The tests are being imported.'
				});

				records = data;
				recordCount = records.length - 1;
				recordIndex = 0;
				failedRows = [];

				importOneMappingTest(req, res);
			});

			fs.createReadStream(filepath).pipe(parser);
		},
		importOneMappingTest = function(req, res) {
			if (global.socket != null) {
				global.socket.emit('resImportingTest', {
					'total_count': recordCount,
					'completed_count': recordIndex
				});
			}

			recordIndex++;
			if (recordIndex > recordCount) {
				return importFinishTest(req, res);
			}

			var record = records[recordIndex];
			var test = {
				syllabus: '',
				grade: '',
				chapter: '',
				concept: '',
				tests: ''
			};

			if (mappingFieldIndexs.syllabus >= 0)
				test.syllabus = utils.trim(record[mappingFieldIndexs.syllabus]);

			if (mappingFieldIndexs.grade >= 0)
				test.grade = utils.trim(record[mappingFieldIndexs.grade]);

			if (mappingFieldIndexs.chapter >= 0)
				test.chapter = utils.trim(record[mappingFieldIndexs.chapter]);

			if (mappingFieldIndexs.concept >= 0)
				test.concept = utils.trim(record[mappingFieldIndexs.concept]);
			
			if (mappingFieldIndexs.concept >= 0)
				test.tests = utils.trim(record[mappingFieldIndexs.tests]);

			if (test.syllabus == '' ||
				test.grade == '' ||
				test.chapter == '' ||
				test.concept == '' )
			{
				failedRows.push(recordIndex);
				importOneMappingTest(req, res);
			} else {
				importSyllabusOfMappingTest(req, res, test);
			}
		},
		importSyllabusOfMappingTest = function(req, res, test) {
			async.waterfall([
			function(cb) {
				SyllabusModel.findOne({'title': test.syllabus}, function(err, syllabus) {
					if (err) {
						failedRows.push(recordIndex);
						importOneMappingTest(req, res);
					} else if (!syllabus) {
						cb(null);
					} else {
						importGradeOfMappingTest(req, res, test, syllabus._id);
					}
				});
			},
			function(cb) {
				SyllabusModel.count({}, function(err, count) {
					if (err) {
						logger.trace(err);
						failedRows.push(recordIndex);
						importOneMappingTest(req, res);
					} else {
						cb(null, count);
					}
				});
			},
			function(count, cb) {
				SyllabusModel.create({
					'title': test.syllabus,
					'order': count + 1
				}, function(err, syllabus, result) {
					if (err || !syllabus) {
						logger.trace(err);
						failedRows.push(recordIndex);
						importOneMappingTest(req, res);
					} else {
						importGradeOfMappingTest(req, res, test, syllabus._id);
					}
				});
			}]);
		},
		importGradeOfMappingTest = function(req, res, test, syllabus_id) {
			async.waterfall([
			function(cb) {
				LinkModel.count({
					'kind': 'grade',
					'syllabus': syllabus_id
				}, function(err, count) {
					if (err) {
						failedRows.push(recordIndex);
						importOneMappingTest(req, res);
					} else {
						cb(null, count);
					}
				});
			},
			function(count, cb) {
				GradeModel.findOne({
					'grade': test.grade
				}, function(err, grade) {
					if (err) {
						failedRows.push(recordIndex);
						importOneMappingTest(req, res);
					} else {
						cb(null, count, grade);
					}
				});
			},
			function(count, grade, cb) {
				if (!grade) {

					GradeModel.create({
						'grade': test.grade
					}, function(err, new_grade, result) {
						if (err || !new_grade) {
							failedRows.push(recordIndex);
							importOneMappingTest(req, res);
						} else {
							cb(null, count, new_grade._id);
						}
					});
				} else {
					cb(null, count, grade._id);
				}
			},
			function(count, grade_id, cb) {
				LinkModel.findOne({
					'kind': 'grade',
					'syllabus': syllabus_id,
					'grade': grade_id
				}, function(err, gradeLink) {
					if (err) {
						failedRows.push(recordIndex);
						importOneMappingTest(req, res);
					} else if(!gradeLink) {
						LinkModel.create({
							'kind': 'grade',
							'syllabus': syllabus_id,
							'grade': grade_id,
							'order': count + 1
						}, function (err, link, result) {
							if (err) {
								failedRows.push(recordIndex);
								importOneMappingTest(req, res);
							} else {
								cb(null, grade_id);
							}
						});
					} else {
						cb(null, grade_id);
					}
				});
			},
			function(grade_id, cb) {
				importChapterOfMappingTest(req, res, test, syllabus_id, grade_id);
			}]);
		},
		importChapterOfMappingTest = function(req, res, test, syllabus_id, grade_id) {
			async.waterfall([
			function(cb) {
				LinkModel.count({
					'kind': 'chapter',
					'syllabus': syllabus_id,
					'grade': grade_id
				}, function(err, count) {
					if (err) {
						failedRows.push(recordIndex);
						importOneMappingTest(req, res);
					} else {
						cb(null, count);
					}
				});
			},
			function(count, cb) {
				ChapterModel.findOne({
					'title': test.chapter
				}, function(err, chapter) {
					if (err) {
						failedRows.push(recordIndex);
						importOneMappingTest(req, res);
					} else {
						cb(null, count, chapter);
					}
				});
			},
			function(count, chapter, cb) {
				if (!chapter) {

					ChapterModel.create({
						'title': test.chapter
					}, function(err, new_chapter, result) {
						if (err || !new_chapter) {
							failedRows.push(recordIndex);
							importOneMappingTest(req, res);
						} else {
							cb(null, count, new_chapter._id);
						}
					});
				} else {
					cb(null, count, chapter._id);
				}
			},
			function(count, chapter_id, cb) {
				LinkModel.findOne({
					'kind': 'chapter',
					'syllabus': syllabus_id,
					'grade': grade_id,
					'chapter': chapter_id
				}, function(err, chapterLink) {
					if (err) {
						failedRows.push(recordIndex);
						importOneMappingTest(req, res);
					} else if(!chapterLink) {
						LinkModel.create({
							'kind': 'chapter',
							'syllabus': syllabus_id,
							'grade': grade_id,
							'chapter': chapter_id,
							'order': count + 1
						}, function (err, link, result) {
							if (err) {
								failedRows.push(recordIndex);
								importOneMappingTest(req, res);
							} else {
								cb(null, chapter_id);
							}
						});
					} else {
						cb(null, chapter_id);
					}
				});
			},
			function(chapter_id, cb) {
				importConceptOfMappingTest(req, res, test, syllabus_id, grade_id, chapter_id);
			}]);
		},
		importConceptOfMappingTest = function(req, res, test, syllabus_id, grade_id, chapter_id) {
			async.waterfall([
			function(cb) {
				LinkModel.count({
					'kind': 'concept',
					'syllabus': syllabus_id,
					'grade': grade_id,
					'chapter': chapter_id
				}, function(err, count) {
					if (err) {
						failedRows.push(recordIndex);
						importOneMappingTest(req, res);
					} else {
						cb(null, count);
					}
				});
			},
			function(count, cb) {
				ConceptModel.findOne({
					'title': test.concept
				}, function(err, concept) {
					if (err || !concept) {
						failedRows.push(recordIndex);
						importOneMappingTest(req, res);
					} else {
						cb(null, count, concept._id);
					}
				});
			},
			function(count, concept_id, cb) {
				LinkModel.findOne({
					'kind': 'concept',
					'syllabus': syllabus_id,
					'grade': grade_id,
					'chapter': chapter_id,
					'concept': concept_id
				}, function(err, conceptLink) {
					if (err) {
						failedRows.push(recordIndex);
						importOneMappingTest(req, res);
					} else if(!conceptLink) {
						LinkModel.create({
							'kind': 'concept',
							'syllabus': syllabus_id,
							'grade': grade_id,
							'chapter': chapter_id,
							'concept': concept_id,
							'order': count + 1
						}, function (err, link, result) {
							if (err) {
								failedRows.push(recordIndex);
								importOneMappingTest(req, res);
							} else {
								cb(null, concept_id);
							}
						});
					} else {
						cb(null, concept_id);
					}
				});
			},
			function(chapter_id, cb) {
				importTestOfMapping(req, res, test, syllabus_id, grade_id, chapter_id, concept_id);
			}]);
		},
		importTestOfMapping = function(req, res, test, syllabus_id, grade_id, chapter_id, concept_id) {
			async.waterfall([
			function(cb) {
				LinkModel.count({
					'kind': 'test',
					'syllabus': syllabus_id,
					'grade': grade_id,
					'chapter': chapter_id,
					'concept': concept_id
				}, function(err, count) {
					if (err) {
						failedRows.push(recordIndex);
						importOneMappingTest(req, res);
					} else {
						cb(null, count);
					}
				});
			},
			function(count, cb) {
				TestModel.findOne({
					'question': test.tests
				}, function(err, tests) {
					if (err || !tests) {
						failedRows.push(recordIndex);
						importOneMappingTest(req, res);
					} else {
						cb(null, count, test._id);
					}
				});
			},
			function(count, test_id, cb) {
				LinkModel.findOne({
					'kind': 'test',
					'syllabus': syllabus_id,
					'grade': grade_id,
					'chapter': chapter_id,
					'concept': concept_id,
					'test': test_id
				}, function(err, testLink) {
					if (err) {
						failedRows.push(recordIndex);
						importOneMappingTest(req, res);
					} else if(!testLink) {
						LinkModel.create({
							'kind': 'test',
							'syllabus': syllabus_id,
							'grade': grade_id,
							'chapter': chapter_id,
							'concept': concept_id,
							'test': test_id,
							'order': count + 1
						}, function (err, link, result) {
							if (err) {
								failedRows.push(recordIndex);
								importOneMappingTest(req, res);
							} else {
								cb(null);
							}
						});
					} else {
						cb(null);
					}
				});
			},
			function(cb) {
				importOneMappingTest(req, res);
			}]);
		},
		exportVariablesInitTest = function() {
			export_tests = [],
			export_test_index = -1,
			export_test_count = 0,
			export_grades = [],
			export_chapters = [],
			export_concepts = [],
			export_record = '',
			export_records = '',
			export_filename = '',
			export_filepath = ''
		};

	return {
		/* Admin User */
		renderAdminPage: renderAdminPage,
		renderRegisterPage: renderRegisterPage,
		register: register,
		renderLoginPage: renderLoginPage,
		login: login,
		logout: logout,

		/* Syllabus */
		renderSyllabusesPage: renderSyllabusesPage,
		renderSyllabusNewPage: renderSyllabusNewPage,
		newSyllabus: newSyllabus,
		renderSyllabusEditPage: renderSyllabusEditPage,
		editSyllabus: editSyllabus,
		deleteSyllabus: deleteSyllabus,

		/* Grade */
		renderGradesPage: renderGradesPage,
		renderGradeNewPage: renderGradeNewPage,
		newGrade: newGrade,
		renderGradeEditPage: renderGradeEditPage,
		editGrade: editGrade,
		deleteGrade: deleteGrade,

		/* Chapter */
		renderChaptersPage: renderChaptersPage,
		renderChapterNewPage: renderChapterNewPage,
		newChapter: newChapter,
		renderChapterEditPage: renderChapterEditPage,
		editChapter: editChapter,
		deleteChapter: deleteChapter,

		/* Concept */
		renderConceptsPage: renderConceptsPage,
		renderConceptNewPage: renderConceptNewPage,
		newConcept: newConcept,
		renderConceptEditPage: renderConceptEditPage,
		editConcept: editConcept,
		downloadConceptImage: downloadConceptImage,
		downloadConceptImage2: downloadConceptImage2,
		deleteConcept: deleteConcept,

		/* Test */
		renderTestsPage: renderTestsPage,
		renderTestNewPage: renderTestNewPage,
		newTest: newTest,
		renderTestEditPage: renderTestEditPage,
		editTest: editTest,
		deleteTest: deleteTest,
		
		/* Reference */
		getDataFromRefUrls: getDataFromRefUrls,
		getDataFromRefUrl: getDataFromRefUrl,

		/* Video */
		getYoutubeEmbedUrl: getYoutubeEmbedUrl,

		/* Users */
		renderReportsPage: renderReportsPage,
		getUsernameOfReport: getUsernameOfReport,
		renderUsersPage: renderUsersPage,
		renderManageUsersPage: renderManageUsersPage,
		renderListUsersPage: renderListUsersPage,

		/* Logs */
		renderLogsPage: renderLogsPage,
		getUsernameOfLog: getUsernameOfLog,

		/* Monitoring Server Resources */
		renderMonitoringPage: renderMonitoringPage,

		/* Search Contents */
		renderSearchContentsPage: renderSearchContentsPage,
		searchContents: searchContents,

		/* Other Functions */
		getGrades: getGrades,
		getChapters: getChapters,
		getConcepts: getConcepts,
		getTests: getTests,
		getLinks: getLinks,
		downloadUsers: downloadUsers,
		downloadReports: downloadReports,
		searchUsers: searchUsers,
		getUser: getUser,
		disableUser: disableUser,

		/* Import/Export Contents with Syllabus Mapping */
		renderImportContentsPage: renderImportContentsPage,
		importConcepts: importConcepts,
		importOneConcept: importOneConcept,
		importMappings: importMappings,

		importVideosOfContent: importVideosOfContent,
		importReferencesOfContent: importReferencesOfContent,
		importReferenceOfContent: importReferenceOfContent,
		importFinish: importFinish,

		renderExportContentsPage: renderExportContentsPage,
		exportContents: exportContents,
		exportGradeOfConcept: exportGradeOfConcept,
		exportChapterOfConcept: exportChapterOfConcept,
		exportOneConcept: exportOneConcept,
		exportVideosOfConcept: exportVideosOfConcept,
		exportReferencesOfConcept: exportReferencesOfConcept,
		exportToFile: exportToFile,
		exportContentsFinish: exportContentsFinish,
		exportVariablesInit: exportVariablesInit,
		
		/* Import/Export Tests with Syllabus Mapping */
		renderImportTestsPage: renderImportTestsPage,
		importTests: importTests,
		importOneTest: importOneTest,
		//importMappingsTest: importMappingsTest,
		importFinishTest: importFinishTest,

		renderExportTestsPage: renderExportTestsPage,
		exportTests: exportTests,
		//exportGradeOfTest: exportGradeOfTest,
		//exportChapterOfTest: exportChapterOfTest,
		//exportOneTest: exportOneTest,		
		exportToFileTest: exportToFileTest,
		//exportTestsFinish: exportTestsFinish,
		exportVariablesInitTest: exportVariablesInitTest	
	};
 }();

 module.exports = admin;

